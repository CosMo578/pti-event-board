import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/EventForm";
import type { Event } from "@/lib/types/database";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/?auth=required`);
  }

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !event) {
    redirect("/");
  }

  if (event.created_by !== user.id) {
    redirect(`/events/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-pti-green sm:text-3xl">
        Edit Event
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Update your event details below.
      </p>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <EventForm mode="edit" event={event as Event} />
      </div>
    </div>
  );
}
