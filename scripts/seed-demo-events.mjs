#!/usr/bin/env node
/**
 * Seed demo events from data/demo-events.json.
 *
 * Usage:
 *   pnpm seed:demo
 *   pnpm seed:demo -- --email you@gmail.com
 *   pnpm seed:demo -- --user-id <uuid>
 *   pnpm seed:demo -- --force   # insert even if titles already exist
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const args = { email: null, userId: null, force: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--force") args.force = true;
    else if (arg === "--email") args.email = argv[++i];
    else if (arg === "--user-id") args.userId = argv[++i];
    else if (arg.startsWith("--email=")) args.email = arg.slice("--email=".length);
    else if (arg.startsWith("--user-id="))
      args.userId = arg.slice("--user-id=".length);
  }
  return args;
}

function displayName(user) {
  const meta = user.user_metadata ?? {};
  return (
    meta.full_name ??
    meta.name ??
    user.email?.split("@")[0] ??
    "PTI User"
  );
}

function avatarUrl(user) {
  const meta = user.user_metadata ?? {};
  return meta.avatar_url ?? meta.picture ?? null;
}

loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, ".env"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resolveUser() {
  const userId = args.userId || process.env.SEED_USER_ID;
  if (userId) {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data.user) {
      throw new Error(`User not found for id ${userId}: ${error?.message}`);
    }
    return data.user;
  }

  const email = args.email || process.env.SEED_USER_EMAIL;
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });
  if (error) throw new Error(`Failed to list users: ${error.message}`);

  const users = data.users ?? [];
  if (users.length === 0) {
    throw new Error(
      "No auth users found. Sign in to the app once, then re-run the seed.",
    );
  }

  if (email) {
    const match = users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!match) {
      throw new Error(
        `No user with email ${email}. Available: ${users
          .map((u) => u.email)
          .filter(Boolean)
          .join(", ")}`,
      );
    }
    return match;
  }

  if (users.length > 1) {
    console.log(
      "Multiple users found; using the first. Pass --email or --user-id to pick one:",
    );
    for (const u of users) console.log(`  - ${u.email} (${u.id})`);
  }

  return users[0];
}

async function main() {
  const eventsPath = resolve(root, "data/demo-events.json");
  const events = JSON.parse(readFileSync(eventsPath, "utf8"));
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error("data/demo-events.json must be a non-empty array");
  }

  const user = await resolveUser();
  const host_name = displayName(user);
  const host_avatar_url = avatarUrl(user);

  console.log(`Seeding ${events.length} events as ${user.email} (${user.id})`);

  let existingTitles = new Set();
  if (!args.force) {
    const titles = events.map((e) => e.title);
    const { data: existing, error } = await supabase
      .from("events")
      .select("title")
      .in("title", titles);
    if (error) throw new Error(`Failed checking existing events: ${error.message}`);
    existingTitles = new Set((existing ?? []).map((row) => row.title));
  }

  const rows = events
    .filter((event) => {
      if (existingTitles.has(event.title)) {
        console.log(`  skip (exists): ${event.title}`);
        return false;
      }
      return true;
    })
    .map((event) => ({
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      event_time: event.event_time,
      location: event.location,
      category: event.category,
      flyer_url: event.flyer_url ?? null,
      visibility: event.visibility ?? "public",
      hashtags: event.hashtags ?? [],
      created_by: user.id,
      host_name,
      host_avatar_url,
    }));

  if (rows.length === 0) {
    console.log("Nothing to insert. Use --force to re-insert duplicates.");
    return;
  }

  const { data, error } = await supabase.from("events").insert(rows).select("id, title");
  if (error) throw new Error(`Insert failed: ${error.message}`);

  console.log(`Inserted ${data.length} events:`);
  for (const row of data) console.log(`  + ${row.title} (${row.id})`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
