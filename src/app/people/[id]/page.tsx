import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, daysUntilNextOccurrence, yearsSince, toDateInputValue } from "@/lib/dates";
import { Card, SectionHeading, EmptyState, Badge, inputClasses, labelClasses, Field, SubmitButton } from "@/components/ui";
import { addImportantDate, deleteImportantDate, updateReminderLeadTime } from "@/app/actions/importantDates";
import { addMemory, deleteMemory, deletePhoto } from "@/app/actions/memories";
import { addRelationship, deleteRelationship } from "@/app/actions/relationships";
import { setCheckInCadence, markContacted } from "@/app/actions/checkins";
import { deletePerson } from "@/app/actions/people";

const categoryLabels: Record<string, string> = {
  FAMILY: "Family",
  FRIEND: "Friend",
  COWORKER: "Coworker",
  ACQUAINTANCE: "Acquaintance",
  OTHER: "Other",
};

const dateTypeLabels: Record<string, string> = {
  BIRTHDAY: "Birthday",
  ANNIVERSARY: "Anniversary",
  GRADUATION: "Graduation",
  JOB_START: "Job start",
  ENGAGEMENT: "Engagement",
  WEDDING: "Wedding",
  OTHER: "Other",
};

const familyRelationLabels: Record<string, string> = {
  PARENT: "Parent",
  CHILD: "Child",
  SIBLING: "Sibling",
  SPOUSE_PARTNER: "Spouse / partner",
  GRANDPARENT: "Grandparent",
  GRANDCHILD: "Grandchild",
  OTHER: "Other",
};

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      importantDates: { orderBy: { date: "asc" } },
      memories: {
        include: { photos: true, importantDates: { include: { importantDate: true } } },
        orderBy: { occurredOn: "desc" },
      },
      checkIn: true,
      relationshipsFrom: { include: { relatedPerson: true } },
      relationshipsTo: { include: { person: true } },
    },
  });

  if (!person) notFound();

  const otherPeople = await prisma.person.findMany({
    where: { id: { not: id } },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  const relationships = [
    ...person.relationshipsFrom.map((r) => ({
      id: r.id,
      other: r.relatedPerson,
      type: r.type,
      label: r.label,
    })),
    ...person.relationshipsTo.map((r) => ({
      id: r.id,
      other: r.person,
      type: r.type,
      label: r.label,
    })),
  ];

  const contactFields = [person.email, person.phone, person.address].filter(Boolean);
  const workFields = [person.jobTitle, person.company].filter(Boolean);
  const loveFields = [
    person.favoriteMeals && `Meals: ${person.favoriteMeals}`,
    person.favoriteTreats && `Treats: ${person.favoriteTreats}`,
    person.favoriteDrinks && `Drinks: ${person.favoriteDrinks}`,
    person.hobbies && `Hobbies: ${person.hobbies}`,
    person.activeProjects && `Working on: ${person.activeProjects}`,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Badge>{categoryLabels[person.category]}</Badge>
          <h1 className="font-display text-4xl mt-2">
            {person.firstName} {person.lastName}
          </h1>
          {person.nickname && <p className="text-muted">&ldquo;{person.nickname}&rdquo;</p>}
          {person.howWeMet && <p className="text-sm text-muted mt-2">How we met: {person.howWeMet}</p>}
        </div>
        <div className="flex gap-3 text-sm">
          <Link href={`/people/${person.id}/edit`} className="text-muted hover:text-foreground">
            Edit
          </Link>
          <form action={deletePerson.bind(null, person.id)}>
            <button type="submit" className="text-muted hover:text-red-600">
              Delete
            </button>
          </form>
        </div>
      </div>

      {person.notes && <p className="text-sm leading-relaxed">{person.notes}</p>}

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-5">
          <SectionHeading title="Contact" />
          {contactFields.length === 0 ? (
            <EmptyState>No contact info yet.</EmptyState>
          ) : (
            <ul className="text-sm space-y-1">
              {person.email && <li>{person.email}</li>}
              {person.phone && <li>{person.phone}</li>}
              {person.address && <li>{person.address}</li>}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <SectionHeading title="Work" />
          {workFields.length === 0 ? (
            <EmptyState>No work info yet.</EmptyState>
          ) : (
            <ul className="text-sm space-y-1">
              {person.jobTitle && <li>{person.jobTitle}</li>}
              {person.company && <li>{person.company}</li>}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <SectionHeading title="What they love" />
        {loveFields.length === 0 ? (
          <EmptyState>Nothing recorded yet.</EmptyState>
        ) : (
          <ul className="text-sm space-y-1">
            {loveFields.map((field) => (
              <li key={field as string}>{field}</li>
            ))}
          </ul>
        )}
      </Card>

      {/* Check-in cadence */}
      <Card className="p-5">
        <SectionHeading title="Staying in touch" />
        <div className="flex items-start justify-between gap-6">
          <div className="text-sm space-y-1">
            {person.checkIn ? (
              <>
                <p>
                  Check in every <strong>{person.checkIn.cadenceDays}</strong> days.
                </p>
                {person.checkIn.lastContactAt && (
                  <p className="text-muted">Last contact: {formatDate(person.checkIn.lastContactAt)}</p>
                )}
                <p className={daysUntilNextOccurrence(person.checkIn.nextDueAt) <= 0 ? "text-accent font-medium" : "text-muted"}>
                  Next due: {formatDate(person.checkIn.nextDueAt)}
                </p>
                <form action={markContacted.bind(null, person.id)} className="pt-2">
                  <button type="submit" className="text-accent hover:underline">
                    Mark as contacted today
                  </button>
                </form>
              </>
            ) : (
              <EmptyState>No check-in cadence set.</EmptyState>
            )}
          </div>
          <form action={setCheckInCadence.bind(null, person.id)} className="flex items-end gap-2">
            <Field label="Cadence (days)">
              <input
                type="number"
                name="cadenceDays"
                min={1}
                defaultValue={person.checkIn?.cadenceDays ?? 30}
                className={`${inputClasses} w-24`}
              />
            </Field>
            <SubmitButton>Save</SubmitButton>
          </form>
        </div>
      </Card>

      {/* Important dates */}
      <Card className="p-5">
        <SectionHeading title="Important dates" />
        {person.importantDates.length === 0 ? (
          <EmptyState>No dates recorded yet.</EmptyState>
        ) : (
          <ul className="space-y-2 mb-4">
            {person.importantDates.map((date) => {
              const daysAway = daysUntilNextOccurrence(date.date);
              return (
                <li key={date.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span>
                      <strong>{dateTypeLabels[date.type]}</strong>
                      {date.label ? ` — ${date.label}` : ""}: {formatDate(date.date, !date.recurring)}
                      {date.recurring && (
                        <span className="text-muted">
                          {" "}
                          ({daysAway === 0 ? "today!" : `in ${daysAway} day${daysAway === 1 ? "" : "s"}`})
                        </span>
                      )}
                    </span>
                    <form action={deleteImportantDate.bind(null, person.id, date.id)}>
                      <button type="submit" className="text-muted hover:text-red-600 text-xs">
                        Remove
                      </button>
                    </form>
                  </div>
                  {date.recurring && (
                    <details className="mt-0.5">
                      <summary className="cursor-pointer text-xs text-muted">
                        Notify me {date.reminderDaysBefore === 0 ? "the day of" : `${date.reminderDaysBefore} day${date.reminderDaysBefore === 1 ? "" : "s"} before`}
                      </summary>
                      <form
                        action={updateReminderLeadTime.bind(null, person.id, date.id)}
                        className="mt-2 flex items-end gap-2"
                      >
                        <Field label="Days before to notify">
                          <input
                            type="number"
                            name="reminderDaysBefore"
                            min={0}
                            max={365}
                            defaultValue={date.reminderDaysBefore}
                            className={`${inputClasses} w-24`}
                          />
                        </Field>
                        <SubmitButton>Save</SubmitButton>
                      </form>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <details className="text-sm">
          <summary className="cursor-pointer text-accent">Add a date</summary>
          <form action={addImportantDate.bind(null, person.id)} className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Type">
              <select name="type" className={inputClasses} defaultValue="BIRTHDAY">
                {Object.entries(dateTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Label (optional)">
              <input name="label" className={inputClasses} placeholder="e.g. Started at Acme" />
            </Field>
            <Field label="Date">
              <input type="date" name="date" required className={inputClasses} />
            </Field>
            <Field label="Notify me how many days before">
              <input type="number" name="reminderDaysBefore" min={0} max={365} defaultValue={7} className={inputClasses} />
            </Field>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="recurring" defaultChecked />
                Repeats yearly
              </label>
            </div>
            <div className="col-span-2">
              <SubmitButton>Add date</SubmitButton>
            </div>
          </form>
        </details>
      </Card>

      {/* Family & mutual friends */}
      <Card className="p-5">
        <SectionHeading title="Family & mutual friends" />
        {relationships.length === 0 ? (
          <EmptyState>No connections recorded yet.</EmptyState>
        ) : (
          <ul className="space-y-2 mb-4">
            {relationships.map((rel) => (
              <li key={rel.id} className="flex items-center justify-between text-sm">
                <span>
                  <Link href={`/people/${rel.other.id}`} className="text-accent hover:underline">
                    {rel.other.firstName} {rel.other.lastName}
                  </Link>{" "}
                  — {familyRelationLabels[rel.type]}
                  {rel.label ? ` (${rel.label})` : ""}
                </span>
                <form action={deleteRelationship.bind(null, person.id, rel.id)}>
                  <button type="submit" className="text-muted hover:text-red-600 text-xs">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        {otherPeople.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-accent">Add a connection</summary>
            <form action={addRelationship.bind(null, person.id)} className="mt-3 grid grid-cols-3 gap-3">
              <Field label="Person">
                <select name="relatedPersonId" required className={inputClasses}>
                  {otherPeople.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Relationship">
                <select name="type" className={inputClasses} defaultValue="OTHER">
                  {Object.entries(familyRelationLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Note (optional)">
                <input name="label" className={inputClasses} placeholder="e.g. mutual friend from college" />
              </Field>
              <div className="col-span-3">
                <SubmitButton>Add connection</SubmitButton>
              </div>
            </form>
          </details>
        )}
      </Card>

      {/* Memories */}
      <Card className="p-5">
        <SectionHeading title="Memories" />
        {person.memories.length === 0 ? (
          <EmptyState>No memories recorded yet.</EmptyState>
        ) : (
          <ul className="space-y-4 mb-4">
            {person.memories.map((memory) => (
              <li key={memory.id} className="border-b border-border pb-4 last:border-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {memory.title}{" "}
                      <span className="text-muted font-normal">
                        · {formatDate(memory.occurredOn)} ({yearsSince(memory.occurredOn)} yrs ago)
                      </span>
                    </p>
                    {memory.location && <p className="text-xs text-muted">{memory.location}</p>}
                    {memory.description && <p className="text-sm mt-1">{memory.description}</p>}
                    {memory.importantDates.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {memory.importantDates.map((mid) => (
                          <Badge key={mid.importantDateId}>
                            {dateTypeLabels[mid.importantDate.type]}
                            {mid.importantDate.label ? ` — ${mid.importantDate.label}` : ""}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {memory.photos.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {memory.photos.map((photo) => (
                          <div key={photo.id} className="group relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.url}
                              alt={photo.caption ?? memory.title}
                              className="h-20 w-20 object-cover rounded-lg border border-border"
                            />
                            <form action={deletePhoto.bind(null, person.id, photo.id)}>
                              <button
                                type="submit"
                                title="Remove photo"
                                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-surface border border-border text-xs leading-none opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                              >
                                ×
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <form action={deleteMemory.bind(null, person.id, memory.id)}>
                    <button type="submit" className="text-muted hover:text-red-600 text-xs">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <details className="text-sm">
          <summary className="cursor-pointer text-accent">Add a memory</summary>
          <form action={addMemory.bind(null, person.id)} className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Title">
                <input name="title" required className={inputClasses} placeholder="Weekend in the mountains" />
              </Field>
              <Field label="Date">
                <input type="date" name="occurredOn" required className={inputClasses} defaultValue={toDateInputValue(new Date())} />
              </Field>
            </div>
            <Field label="Location (optional)">
              <input name="location" className={inputClasses} />
            </Field>
            <Field label="Description">
              <textarea name="description" rows={2} className={inputClasses} />
            </Field>
            <Field label="Photos (optional, up to 8MB each)">
              <input type="file" name="photoFiles" accept="image/*" multiple className={inputClasses} />
            </Field>
            <Field label="…or paste photo URLs (one per line, optional)">
              <textarea name="photoUrls" rows={2} className={inputClasses} placeholder="https://…" />
            </Field>
            {person.importantDates.length > 0 && (
              <div>
                <span className={labelClasses}>Tag with an important date (optional)</span>
                <div className="flex gap-3 flex-wrap">
                  {person.importantDates.map((date) => (
                    <label key={date.id} className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" name="importantDateIds" value={date.id} />
                      {dateTypeLabels[date.type]}
                      {date.label ? ` — ${date.label}` : ""}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <SubmitButton>Add memory</SubmitButton>
          </form>
        </details>
      </Card>
    </div>
  );
}
