import { prisma } from "@/lib/prisma";
import { formatDate, toDateInputValue } from "@/lib/dates";
import { createEvent, deleteEvent } from "@/app/actions/events";
import { Card, SectionHeading, EmptyState, Badge, inputClasses, labelClasses, Field, SubmitButton } from "@/components/ui";
import { EdmtrainSync } from "@/components/edmtrain-sync";
import { TicketmasterSync } from "@/components/ticketmaster-sync";

const sourceLabels: Record<string, string> = {
  edmtrain: "EDMTrain",
  ticketmaster: "Ticketmaster",
};

// Always reflect newly added/removed events, never a stale build-time snapshot.
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const [events, people] = await Promise.all([
    prisma.event.findMany({
      include: { interestedPeople: { include: { person: true } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.person.findMany({ orderBy: [{ firstName: "asc" }, { lastName: "asc" }] }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Events</h1>

      <Card className="p-5">
        <SectionHeading title="Upcoming & past events" />
        {events.length === 0 ? (
          <EmptyState>No events yet — add one you and someone else might want to attend.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id} className="border-b border-border pb-3 last:border-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {event.title} <span className="text-muted font-normal">· {formatDate(event.startsAt)}</span>
                      {event.source && <span className="ml-2"><Badge>{sourceLabels[event.source] ?? event.source}</Badge></span>}
                    </p>
                    {event.location && <p className="text-xs text-muted">{event.location}</p>}
                    {event.description && <p className="text-sm mt-1">{event.description}</p>}
                    {event.lowestPrice != null && (
                      <p className="text-xs text-muted">
                        From ${event.lowestPrice} {event.priceCurrency}
                        {event.priceAlertSentAt && <span className="text-accent"> · you were notified about this price</span>}
                      </p>
                    )}
                    {event.ticketUrl && (
                      <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                        Tickets / event page
                      </a>
                    )}
                    {event.interestedPeople.length > 0 && (
                      <p className="text-xs text-muted mt-1">
                        Interested: {event.interestedPeople.map((ip) => `${ip.person.firstName} ${ip.person.lastName}`).join(", ")}
                      </p>
                    )}
                  </div>
                  <form action={deleteEvent.bind(null, event.id)}>
                    <button type="submit" className="text-muted hover:text-red-600 text-xs">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <SectionHeading title="EDMTrain" />
        <p className="text-sm text-muted">
          Pulls upcoming electronic events near Toronto into the list above. Requires an EDMTrain API
          key in <code>.env</code> — see <code>.env.example</code>.
        </p>
        <EdmtrainSync />
      </Card>

      <Card className="p-5 space-y-3">
        <SectionHeading title="Toronto sports tickets" />
        <p className="text-sm text-muted">
          Pulls upcoming Blue Jays, Raptors, Maple Leafs, and Toronto FC home games in the next 30 days,
          and sends a notification the first time a game&rsquo;s lowest listed price drops to or under
          your threshold (Jays $40, Raptors $30, Leafs $70, TFC $30 — edit the defaults in{" "}
          <code>src/lib/ticketmaster.ts</code> until this has its own settings page). Requires a
          Ticketmaster API key in <code>.env</code> — see <code>.env.example</code>.
        </p>
        <TicketmasterSync />
      </Card>

      <Card className="p-5">
        <SectionHeading title="Add an event" />
        <form action={createEvent} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title">
              <input name="title" required className={inputClasses} />
            </Field>
            <Field label="Date">
              <input type="date" name="startsAt" required defaultValue={toDateInputValue(new Date())} className={inputClasses} />
            </Field>
          </div>
          <Field label="Location (optional)">
            <input name="location" className={inputClasses} />
          </Field>
          <Field label="Description (optional)">
            <textarea name="description" rows={2} className={inputClasses} />
          </Field>
          {people.length > 0 && (
            <div>
              <span className={labelClasses}>Who might be interested?</span>
              <div className="flex gap-3 flex-wrap">
                {people.map((p) => (
                  <label key={p.id} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" name="interestedPersonIds" value={p.id} />
                    {p.firstName} {p.lastName}
                  </label>
                ))}
              </div>
            </div>
          )}
          <SubmitButton>Add event</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
