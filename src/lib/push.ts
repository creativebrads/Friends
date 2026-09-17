import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export type PushMessage = {
  title: string;
  body: string;
  url?: string;
};

/** Sends a message to every subscribed browser, pruning subscriptions the push service reports as gone. */
export async function sendPushToAll(message: PushMessage) {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    throw new Error("Web Push isn't configured — set VAPID keys in .env");
  }

  const subscriptions = await prisma.pushSubscription.findMany();
  const payload = JSON.stringify(message);

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      ),
    ),
  );

  const staleEndpoints: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const statusCode = (result.reason as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        staleEndpoints.push(subscriptions[i].endpoint);
      }
    }
  });

  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: staleEndpoints } } });
  }

  return {
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length - staleEndpoints.length,
    pruned: staleEndpoints.length,
  };
}
