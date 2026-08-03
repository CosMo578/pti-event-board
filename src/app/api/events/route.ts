import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAvatarUrl, getGoogleDisplayName } from "@/lib/google-user";
import { triggerPushNotification } from "@/lib/push-trigger";
import { createEventSchema } from "@/lib/validations/event";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      ...parsed.data,
      created_by: user.id,
      host_name: getGoogleDisplayName(user),
      host_avatar_url: getGoogleAvatarUrl(user),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (parsed.data.visibility === "public") {
    void triggerPushNotification("new_event", data.id);
  }

  return NextResponse.json(data, { status: 201 });
}
