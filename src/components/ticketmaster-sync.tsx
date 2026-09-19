"use client";

import { useState, useTransition } from "react";
import { syncTicketmasterNow } from "@/app/actions/events";

export function TicketmasterSync() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runSync() {
    startTransition(async () => {
      const result = await syncTicketmasterNow();
      if (result.error) {
        setMessage(`Couldn't sync: ${result.error}`);
        return;
      }
      setMessage(
        `Found ${result.fetched} event(s) across your teams, imported ${result.imported}, ${result.alertsSent} price alert(s) sent.`,
      );
    });
  }

  return (
    <div className="space-y-2">
      <button
        onClick={runSync}
        disabled={isPending}
        className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted transition-colors disabled:opacity-50"
      >
        {isPending ? "Syncing…" : "Sync ticket prices now"}
      </button>
      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}
