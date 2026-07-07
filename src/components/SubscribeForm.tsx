"use client";

import { useState } from "react";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
        return;
      }

      setStatus("success");
      setMessage(data.message);
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="rounded-xl border border-pti-green/20 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-pti-green">
        Weekly Event Digest
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        Get upcoming campus events delivered to your inbox every Monday morning.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-pti-green focus:outline-none focus:ring-2 focus:ring-pti-green/20"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-pti-green px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pti-green-dark disabled:opacity-50"
        >
          {status === "loading" ? "Subscribing..." : "Subscribe"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-3 text-sm ${
            status === "success" ? "text-green-700" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </section>
  );
}
