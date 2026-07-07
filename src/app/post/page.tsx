import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/EventForm";
import { AuthButton } from "@/components/AuthButton";

export const dynamic = "force-dynamic";

export default async function PostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-lg flex-1 px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-pti-green">Post an Event</h1>
        <p className="mt-4 text-gray-600">
          You need to sign in with Google before posting an event.
        </p>
        <div className="mt-6 flex justify-center">
          <AuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-pti-green sm:text-3xl">
        Post an Event
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Share an upcoming campus event with the PTI community.
      </p>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <EventForm />
      </div>
    </div>
  );
}
