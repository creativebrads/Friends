import { prisma } from "@/lib/prisma";
import { daysUntilNextOccurrence, isSameMonthDay, yearsSince, daysUntil } from "@/lib/dates";
import type { PushMessage } from "@/lib/push";

export async function getUpcomingDates(daysAhead = 30) {
  const dates = await prisma.importantDate.findMany({
    include: { person: true },
  });

  return dates
    .map((d) => ({ ...d, daysAway: daysUntilNextOccurrence(d.date) }))
    .filter((d) => d.recurring && d.daysAway <= daysAhead)
    .sort((a, b) => a.daysAway - b.daysAway);
}

export async function getOverdueCheckIns() {
  const now = new Date();
  const checkIns = await prisma.checkIn.findMany({
    where: { nextDueAt: { lte: now } },
    include: { person: true },
    orderBy: { nextDueAt: "asc" },
  });
  return checkIns;
}

export async function getUpcomingCheckIns(daysAhead = 7) {
  const now = new Date();
  const soon = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const checkIns = await prisma.checkIn.findMany({
    where: { nextDueAt: { gt: now, lte: soon } },
    include: { person: true },
    orderBy: { nextDueAt: "asc" },
  });
  return checkIns;
}

/** Memories that happened on this day (month/day) in a past year: "X years ago today." */
export async function getTodayFlashbacks() {
  const today = new Date();
  const memories = await prisma.memory.findMany({
    include: { person: true, photos: true },
  });

  return memories
    .filter((m) => isSameMonthDay(m.occurredOn, today) && m.occurredOn.getFullYear() < today.getFullYear())
    .map((m) => ({ ...m, yearsAgo: yearsSince(m.occurredOn, today) }))
    .sort((a, b) => b.yearsAgo - a.yearsAgo);
}

export async function getUpcomingEvents(daysAhead = 60) {
  const now = new Date();
  const soon = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const events = await prisma.event.findMany({
    where: { startsAt: { gte: now, lte: soon } },
    include: { interestedPeople: { include: { person: true } } },
    orderBy: { startsAt: "asc" },
  });
  return events.map((e) => ({ ...e, daysAway: daysUntil(e.startsAt) }));
}

const dateTypeLabels: Record<string, string> = {
  BIRTHDAY: "Birthday",
  ANNIVERSARY: "Anniversary",
  GRADUATION: "Graduation",
  JOB_START: "Job start",
  ENGAGEMENT: "Engagement",
  WEDDING: "Wedding",
  OTHER: "Other",
};

/**
 * What's actually worth a push notification today — a narrower set than the
 * dashboard's 30-day window. Important dates fire once, at each date's own
 * `reminderDaysBefore` (adjustable per date — e.g. a week out for an
 * anniversary, the day before for a birthday); check-ins fire on the exact
 * day they come due (not every day they stay overdue); flashbacks and
 * events follow the same "once, on the meaningful day" idea, so a daily
 * cron run never re-sends the same nudge.
 */
export async function getDueTodayNotifications(): Promise<PushMessage[]> {
  const [dates, checkIns, flashbacks, events] = await Promise.all([
    // 366 days out covers any custom lead time (each date's own reminderDaysBefore, capped at 365 when set).
    getUpcomingDates(366),
    prisma.checkIn.findMany({ include: { person: true } }),
    getTodayFlashbacks(),
    getUpcomingEvents(7),
  ]);

  const messages: PushMessage[] = [];

  for (const date of dates) {
    if (date.daysAway !== date.reminderDaysBefore) continue;
    const when = date.daysAway === 0 ? "is today" : date.daysAway === 1 ? "is tomorrow" : `is in ${date.daysAway} days`;
    messages.push({
      title: `${dateTypeLabels[date.type]}${date.label ? ` — ${date.label}` : ""}`,
      body: `${date.person.firstName} ${date.person.lastName ?? ""}'s ${dateTypeLabels[date.type].toLowerCase()} ${when}.`,
      url: `/people/${date.personId}`,
    });
  }

  for (const checkIn of checkIns) {
    if (daysUntil(checkIn.nextDueAt) !== 0) continue;
    messages.push({
      title: "Time to check in",
      body: `You planned to check in with ${checkIn.person.firstName} ${checkIn.person.lastName ?? ""} today.`,
      url: `/people/${checkIn.personId}`,
    });
  }

  for (const memory of flashbacks) {
    messages.push({
      title: "On this day",
      body: `${memory.yearsAgo} year${memory.yearsAgo === 1 ? "" : "s"} ago: ${memory.title} with ${memory.person.firstName}.`,
      url: `/people/${memory.personId}`,
    });
  }

  for (const event of events) {
    if (event.daysAway !== 1 && event.daysAway !== 7) continue;
    const when = event.daysAway === 1 ? "tomorrow" : "in a week";
    messages.push({
      title: event.title,
      body: `Happening ${when}${event.location ? ` at ${event.location}` : ""}.`,
      url: "/events",
    });
  }

  return messages;
}
