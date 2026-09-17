import Link from "next/link";
import { getUpcomingDates, getOverdueCheckIns, getTodayFlashbacks, getUpcomingEvents } from "@/lib/reminders";

// Reminders are time-sensitive and change daily; never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";
import { formatDate } from "@/lib/dates";
import { Card, SectionHeading, EmptyState, Badge } from "@/components/ui";

const dateTypeLabels: Record<string, string> = {
  BIRTHDAY: "Birthday",
  ANNIVERSARY: "Anniversary",
  GRADUATION: "Graduation",
  JOB_START: "Job start",
  ENGAGEMENT: "Engagement",
  WEDDING: "Wedding",
  OTHER: "Other",
};

export default async function DashboardPage() {
  const [upcomingDates, overdueCheckIns, flashbacks, upcomingEvents] = await Promise.all([
    getUpcomingDates(30),
    getOverdueCheckIns(),
    getTodayFlashbacks(),
    getUpcomingEvents(60),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Dashboard</h1>

      {flashbacks.length > 0 && (
        <Card className="p-5 border-accent/30">
          <SectionHeading title="On this day" />
          <ul className="space-y-3">
            {flashbacks.map((memory) => (
              <li key={memory.id} className="text-sm">
                <Link href={`/people/${memory.personId}`} className="text-accent hover:underline font-medium">
                  {memory.person.firstName} {memory.person.lastName}
                </Link>{" "}
                — {memory.title}{" "}
                <span className="text-muted">
                  ({memory.yearsAgo} year{memory.yearsAgo === 1 ? "" : "s"} ago)
                </span>
                {memory.description && <p className="text-muted mt-0.5">{memory.description}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-5">
          <SectionHeading title="Upcoming dates" />
          {upcomingDates.length === 0 ? (
            <EmptyState>Nothing in the next 30 days.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {upcomingDates.map((date) => (
                <li key={date.id} className="text-sm flex items-center justify-between">
                  <span>
                    <Link href={`/people/${date.personId}`} className="text-accent hover:underline">
                      {date.person.firstName} {date.person.lastName}
                    </Link>{" "}
                    — {dateTypeLabels[date.type]}
                    {date.label ? ` (${date.label})` : ""}
                  </span>
                  <Badge>{date.daysAway === 0 ? "today" : `${date.daysAway}d`}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <SectionHeading title="Check in" />
          {overdueCheckIns.length === 0 ? (
            <EmptyState>You&rsquo;re all caught up.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {overdueCheckIns.map((checkIn) => (
                <li key={checkIn.id} className="text-sm flex items-center justify-between">
                  <Link href={`/people/${checkIn.personId}`} className="text-accent hover:underline">
                    {checkIn.person.firstName} {checkIn.person.lastName}
                  </Link>
                  <span className="text-muted text-xs">since {formatDate(checkIn.nextDueAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <SectionHeading title="Events you might both like" action={<Link href="/events" className="text-sm text-accent hover:underline">See all</Link>} />
        {upcomingEvents.length === 0 ? (
          <EmptyState>No upcoming events yet.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {upcomingEvents.map((event) => (
              <li key={event.id} className="text-sm flex items-center justify-between">
                <span>
                  {event.title}
                  {event.interestedPeople.length > 0 && (
                    <span className="text-muted">
                      {" "}
                      — {event.interestedPeople.map((ip) => ip.person.firstName).join(", ")}
                    </span>
                  )}
                </span>
                <span className="text-muted text-xs">{formatDate(event.startsAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
