import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subscribeSchema } from "@/lib/validations/event";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const supabase = await createClient();

  const { error } = await supabase.from("subscribers").insert({ email });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({
        message: "You are already subscribed to the weekly digest.",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "You have been subscribed to the weekly event digest!",
  });
}
