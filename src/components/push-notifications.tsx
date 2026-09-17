"use client";

import { useEffect, useState } from "react";
import { saveSubscription, deleteSubscription } from "@/app/actions/push";

type Status = "unsupported" | "loading" | "denied" | "subscribed" | "unsubscribed";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushNotifications() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.getSubscription();
        if (!cancelled) setStatus(subscription ? "subscribed" : "unsubscribed");
      } catch {
        if (!cancelled) setStatus("unsupported");
      }
    }

    checkStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "unsubscribed");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await saveSubscription(subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
      setStatus("subscribed");
    } catch {
      setStatus("unsubscribed");
    }
  }

  async function disable() {
    setStatus("loading");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await deleteSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch {
      setStatus("subscribed");
    }
  }

  if (status === "unsupported") {
    return <p className="text-sm text-muted">Push notifications aren&rsquo;t supported in this browser.</p>;
  }
  if (status === "denied") {
    return (
      <p className="text-sm text-muted">
        Notifications are blocked for this site. Re-enable them in your browser&rsquo;s site settings.
      </p>
    );
  }
  if (status === "loading") {
    return <p className="text-sm text-muted">Checking notification status…</p>;
  }

  return status === "subscribed" ? (
    <div className="flex items-center gap-3">
      <span className="text-sm text-accent">Notifications are on for this browser.</span>
      <button onClick={disable} className="text-sm text-muted hover:text-foreground underline">
        Turn off
      </button>
    </div>
  ) : (
    <button
      onClick={enable}
      className="rounded-full bg-accent text-accent-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
    >
      Enable notifications on this browser
    </button>
  );
}
