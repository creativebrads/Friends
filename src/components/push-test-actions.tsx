"use client";

import { useState, useTransition } from "react";
import { sendTestNotification, checkRemindersNow } from "@/app/actions/push";

export function PushTestActions() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runTest() {
    startTransition(async () => {
      const result = await sendTestNotification();
      setMessage(`Sent to ${result.sent} device(s), ${result.failed} failed, ${result.pruned} removed as stale.`);
    });
  }

  function runCheck() {
    startTransition(async () => {
      const { messageCount } = await checkRemindersNow();
      setMessage(
        messageCount === 0
          ? "Nothing due today — no notifications sent."
          : `${messageCount} reminder(s) due today, sent to your subscribed devices.`,
      );
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <button
          onClick={runTest}
          disabled={isPending}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted transition-colors disabled:opacity-50"
        >
          Send test notification
        </button>
        <button
          onClick={runCheck}
          disabled={isPending}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted transition-colors disabled:opacity-50"
        >
          Check today&rsquo;s reminders now
        </button>
      </div>
      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}
