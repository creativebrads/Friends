import { NextRequest, NextResponse } from "next/server";
import { getDueTodayNotifications } from "@/lib/reminders";
import { sendPushToAll } from "@/lib/push";

// Hit by a daily scheduler (e.g. Vercel Cron) to compute today's reminders and push them.
// Not meant to be called by the browser — protected by CRON_SECRET.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await getDueTodayNotifications();
  const results = await Promise.all(messages.map((message) => sendPushToAll(message)));

  return NextResponse.json({ messageCount: messages.length, results });
}
