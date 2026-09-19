import { prisma } from "@/lib/prisma";

// EDMTrain's public API. Confirmed from their own docs (edmtrain.com/api-documentation,
// edmtrain.com/developer-api): base URL below, `client` query param for auth, and
// location can be given as latitude/longitude/state instead of a separate location
// lookup. Defaults are Toronto; override via env vars if that ever changes.
const EDMTRAIN_BASE_URL = "https://edmtrain.com/api/events";

type EdmtrainArtist = {
  id?: number;
  name?: string;
};

type EdmtrainVenue = {
  name?: string;
  location?: string; // e.g. "Toronto, ON"
  address?: string;
};

// NOTE: the shape below is my best-known mapping of EDMTrain's response, pieced
// together from public documentation I could reach — I could not fetch a live
// sample to confirm exact field names before writing this (this sandbox can't
// reach edmtrain.com at all). If imported events come through with missing
// titles/dates/links once you test this for real, the fix is almost certainly
// just adjusting the field names accessed in `mapEdmtrainEvent` below — the
// request/auth/sync plumbing around it should already be correct.
type EdmtrainEvent = {
  id: number | string;
  name?: string | null;
  date?: string; // e.g. "2026-10-15"
  link?: string;
  festivalInd?: boolean;
  artistList?: EdmtrainArtist[];
  venue?: EdmtrainVenue;
};

type EdmtrainResponse = {
  success?: boolean;
  data?: EdmtrainEvent[];
};

function buildTitle(event: EdmtrainEvent): string {
  if (event.name) return event.name;
  const artists = (event.artistList ?? []).map((a) => a.name).filter(Boolean);
  if (artists.length > 0) return artists.join(", ");
  return event.venue?.name ? `Event at ${event.venue.name}` : "EDMTrain event";
}

function mapEdmtrainEvent(event: EdmtrainEvent) {
  if (!event.date) return null; // can't schedule an event with no date

  return {
    title: buildTitle(event),
    location: event.venue?.location ?? event.venue?.name ?? null,
    startsAt: new Date(event.date),
    ticketUrl: event.link ?? null,
    source: "edmtrain",
    externalId: String(event.id),
  };
}

export type EdmtrainSyncResult = {
  fetched: number;
  imported: number;
  skipped: number;
  error?: string;
};

export async function syncEdmtrainEvents(daysAhead = 90): Promise<EdmtrainSyncResult> {
  const apiKey = process.env.EDMTRAIN_API_KEY;
  if (!apiKey) {
    return { fetched: 0, imported: 0, skipped: 0, error: "EDMTRAIN_API_KEY is not set" };
  }

  const latitude = process.env.EDMTRAIN_LATITUDE ?? "43.6532";
  const longitude = process.env.EDMTRAIN_LONGITUDE ?? "-79.3832";
  const state = process.env.EDMTRAIN_STATE ?? "ON";

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const formatDate = (d: Date) => d.toISOString().slice(0, 10);

  const url = new URL(EDMTRAIN_BASE_URL);
  url.searchParams.set("client", apiKey);
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("state", state);
  url.searchParams.set("startDate", formatDate(startDate));
  url.searchParams.set("endDate", formatDate(endDate));

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch (err) {
    return { fetched: 0, imported: 0, skipped: 0, error: `Network error reaching EDMTrain: ${err}` };
  }

  if (!response.ok) {
    return { fetched: 0, imported: 0, skipped: 0, error: `EDMTrain returned HTTP ${response.status}` };
  }

  const body: EdmtrainResponse = await response.json();
  const events = body.data ?? [];

  let imported = 0;
  let skipped = 0;

  for (const event of events) {
    const mapped = mapEdmtrainEvent(event);
    if (!mapped) {
      skipped++;
      continue;
    }

    await prisma.event.upsert({
      where: { source_externalId: { source: mapped.source, externalId: mapped.externalId } },
      create: mapped,
      update: {
        title: mapped.title,
        location: mapped.location,
        startsAt: mapped.startsAt,
        ticketUrl: mapped.ticketUrl,
      },
    });
    imported++;
  }

  return { fetched: events.length, imported, skipped };
}
