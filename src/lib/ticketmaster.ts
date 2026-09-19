import { prisma } from "@/lib/prisma";
import { sendPushToAll } from "@/lib/push";

// Ticketmaster's Discovery API. Confirmed via developer.ticketmaster.com and a
// published API client's field mappings: base URL/auth param below, and the
// response shape used in mapTicketmasterEvent (id, name, url, dates.start,
// priceRanges[].min/currency, _embedded.venues[].name/city) — more solid
// ground than the EDMTrain integration, which had to guess at field names.
const TICKETMASTER_BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

// Default price-alert thresholds per team, in CAD. Set once here rather than
// as a Settings-page control since there's no "adjustable in-app" UI for this
// yet — when that gets built, this array becomes the seed data for a DB table
// instead of a code constant, but the sync logic below doesn't need to change.
const TEAMS: { name: string; keyword: string; priceThreshold: number }[] = [
  { name: "Toronto Blue Jays", keyword: "Toronto Blue Jays", priceThreshold: 40 },
  { name: "Toronto Raptors", keyword: "Toronto Raptors", priceThreshold: 30 },
  { name: "Toronto Maple Leafs", keyword: "Toronto Maple Leafs", priceThreshold: 70 },
  { name: "Toronto FC", keyword: "Toronto FC", priceThreshold: 30 },
];

type TicketmasterPriceRange = {
  type?: string;
  currency?: string;
  min?: number;
  max?: number;
};

type TicketmasterVenue = {
  name?: string;
  city?: { name?: string };
  state?: { stateCode?: string };
};

type TicketmasterEvent = {
  id: string;
  name?: string;
  url?: string;
  dates?: {
    start?: { localDate?: string; dateTime?: string };
  };
  priceRanges?: TicketmasterPriceRange[];
  _embedded?: { venues?: TicketmasterVenue[] };
};

type TicketmasterResponse = {
  _embedded?: { events?: TicketmasterEvent[] };
};

function mapTicketmasterEvent(event: TicketmasterEvent) {
  const start = event.dates?.start;
  const startsAtRaw = start?.dateTime ?? start?.localDate;
  if (!startsAtRaw) return null; // can't schedule an event with no date

  const venue = event._embedded?.venues?.[0];
  const location = venue
    ? [venue.name, venue.city?.name].filter(Boolean).join(", ")
    : null;

  const prices = event.priceRanges ?? [];
  const lowestPriceEntry = prices.reduce<TicketmasterPriceRange | null>((lowest, range) => {
    if (range.min == null) return lowest;
    if (!lowest || (lowest.min != null && range.min < lowest.min)) return range;
    return lowest;
  }, null);

  return {
    title: event.name ?? "Untitled event",
    location,
    startsAt: new Date(startsAtRaw),
    ticketUrl: event.url ?? null,
    source: "ticketmaster",
    externalId: event.id,
    lowestPrice: lowestPriceEntry?.min ?? null,
    priceCurrency: lowestPriceEntry?.currency ?? null,
  };
}

export type TicketmasterSyncResult = {
  fetched: number;
  imported: number;
  skipped: number;
  alertsSent: number;
  error?: string;
};

export async function syncTicketmasterEvents(daysAhead = 30): Promise<TicketmasterSyncResult> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    return { fetched: 0, imported: 0, skipped: 0, alertsSent: 0, error: "TICKETMASTER_API_KEY is not set" };
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const formatDateTime = (d: Date) => d.toISOString().split(".")[0] + "Z";

  let fetched = 0;
  let imported = 0;
  let skipped = 0;
  let alertsSent = 0;

  for (const team of TEAMS) {
    const url = new URL(TICKETMASTER_BASE_URL);
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("keyword", team.keyword);
    url.searchParams.set("city", "Toronto");
    url.searchParams.set("countryCode", "CA");
    url.searchParams.set("startDateTime", formatDateTime(startDate));
    url.searchParams.set("endDateTime", formatDateTime(endDate));
    url.searchParams.set("size", "50");

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch (err) {
      return { fetched, imported, skipped, alertsSent, error: `Network error reaching Ticketmaster: ${err}` };
    }

    if (!response.ok) {
      return { fetched, imported, skipped, alertsSent, error: `Ticketmaster returned HTTP ${response.status} for ${team.name}` };
    }

    const body: TicketmasterResponse = await response.json();
    const events = body._embedded?.events ?? [];
    fetched += events.length;

    for (const event of events) {
      const mapped = mapTicketmasterEvent(event);
      if (!mapped) {
        skipped++;
        continue;
      }

      const result = await prisma.event.upsert({
        where: { source_externalId: { source: mapped.source, externalId: mapped.externalId } },
        create: mapped,
        update: {
          title: mapped.title,
          location: mapped.location,
          startsAt: mapped.startsAt,
          ticketUrl: mapped.ticketUrl,
          lowestPrice: mapped.lowestPrice,
          priceCurrency: mapped.priceCurrency,
        },
      });
      imported++;

      const isCheapEnough = result.lowestPrice != null && result.lowestPrice <= team.priceThreshold;
      if (isCheapEnough && !result.priceAlertSentAt) {
        await sendPushToAll({
          title: `Cheap ${team.name} tickets`,
          body: `${result.title} — from $${result.lowestPrice} ${result.priceCurrency ?? ""}`.trim(),
          url: result.ticketUrl ?? "/events",
        });
        await prisma.event.update({
          where: { id: result.id },
          data: { priceAlertSentAt: new Date() },
        });
        alertsSent++;
      }
    }
  }

  return { fetched, imported, skipped, alertsSent };
}
