"use server";

import { prisma } from "@/lib/prisma";
import { sendPushToAll } from "@/lib/push";
import { getDueTodayNotifications } from "@/lib/reminders";

export type SubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function saveSubscription(subscription: SubscriptionJSON) {
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function deleteSubscription(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function isSubscribed(endpoint: string) {
  const sub = await prisma.pushSubscription.findUnique({ where: { endpoint } });
  return sub !== null;
}

export async function sendTestNotification() {
  return sendPushToAll({
    title: "Test notification",
    body: "If you can see this, push notifications are working.",
    url: "/",
  });
}

/** Computes today's reminders and pushes them now — same logic the daily cron route runs. */
export async function checkRemindersNow() {
  const messages = await getDueTodayNotifications();
  const results = await Promise.all(messages.map((message) => sendPushToAll(message)));
  return { messageCount: messages.length, results };
}
