"use client";

import { useState, useTransition } from "react";
import { syncEdmtrainNow } from "@/app/actions/events";

export function EdmtrainSync() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runSync() {
    startTransition(async () => {
      const result = await syncEdmtrainNow();
      if (result.error) {
        setMessage(`Couldn't sync: ${result.error}`);
        return;
      }
      setMessage(`Found ${result.fetched} event(s), imported ${result.imported}, skipped ${result.skipped}.`);
    });
  }

  return (
    <div className="space-y-2">
      <button
        onClick={runSync}
        disabled={isPending}
        className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted transition-colors disabled:opacity-50"
      >
        {isPending ? "Syncing…" : "Sync EDMTrain events now"}
      </button>
      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}
