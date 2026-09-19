import { NextRequest, NextResponse } from "next/server";
import { syncEdmtrainEvents } from "@/lib/edmtrain";

// Hit by a daily scheduler (e.g. Vercel Cron) to pull upcoming EDMTrain events into
// the Events table. Not meant to be called by the browser — protected by CRON_SECRET
// (reuses the same secret as /api/cron/reminders).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncEdmtrainEvents();
  return NextResponse.json(result);
}
