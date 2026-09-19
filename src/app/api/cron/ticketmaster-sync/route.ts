import { NextRequest, NextResponse } from "next/server";
import { syncTicketmasterEvents } from "@/lib/ticketmaster";

// Hit by a daily scheduler (e.g. Vercel Cron) to pull upcoming Toronto sports events
// and push a notification when one drops under its price threshold. Not meant to be
// called by the browser — protected by CRON_SECRET (same secret as the other cron routes).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncTicketmasterEvents();
  return NextResponse.json(result);
}
