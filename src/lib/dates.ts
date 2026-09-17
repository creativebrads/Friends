const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Formats a date as "January 5, 1990" (or without the year: "January 5"). */
export function formatDate(date: Date, withYear = true): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: withYear ? "numeric" : undefined,
  });
}

/** Days from today until the next annual occurrence of this date's month/day. 0 = today. */
export function daysUntilNextOccurrence(date: Date, from: Date = new Date()): number {
  const today = startOfDay(from);
  let next = new Date(today.getFullYear(), date.getMonth(), date.getDate());
  if (next < today) {
    next = new Date(today.getFullYear() + 1, date.getMonth(), date.getDate());
  }
  return Math.round((next.getTime() - today.getTime()) / MS_PER_DAY);
}

/** Full years elapsed between a past date and today (e.g. age, or "3 years ago"). */
export function yearsSince(date: Date, from: Date = new Date()): number {
  let years = from.getFullYear() - date.getFullYear();
  const hasHadAnniversaryThisYear =
    from.getMonth() > date.getMonth() ||
    (from.getMonth() === date.getMonth() && from.getDate() >= date.getDate());
  if (!hasHadAnniversaryThisYear) years -= 1;
  return years;
}

export function isSameMonthDay(a: Date, b: Date): boolean {
  return a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function daysUntil(date: Date, from: Date = new Date()): number {
  return Math.round((startOfDay(date).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);
}

/** Formats an HTML <input type="date"> value (YYYY-MM-DD) into a Date, safely in local time. */
export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
