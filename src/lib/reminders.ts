import { prisma } from "@/lib/prisma";
import { daysUntilNextOccurrence, isSameMonthDay, yearsSince, daysUntil } from "@/lib/dates";

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
