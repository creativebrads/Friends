import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, inputClasses } from "@/components/ui";

const categoryLabels: Record<string, string> = {
  FAMILY: "Family",
  FRIEND: "Friend",
  COWORKER: "Coworker",
  ACQUAINTANCE: "Acquaintance",
  OTHER: "Other",
};

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const people = await prisma.person.findMany({
    where: query
      ? {
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { nickname: { contains: query } },
            { company: { contains: query } },
          ],
        }
      : undefined,
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">People</h1>
      </div>

      <form className="mb-6">
        <input
          type="search"
          name="q"
          placeholder="Search by name or company…"
          defaultValue={query}
          className={inputClasses}
        />
      </form>

      {people.length === 0 ? (
        <EmptyState>
          {query ? `No one matches "${query}".` : "Nobody in your rolodex yet — add your first person."}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {people.map((person) => (
            <Link key={person.id} href={`/people/${person.id}`}>
              <Card className="p-5 hover:border-accent/50 transition-colors h-full">
                <p className="font-display text-lg">
                  {person.firstName} {person.lastName}
                  {person.nickname ? (
                    <span className="text-muted text-sm font-sans"> &ldquo;{person.nickname}&rdquo;</span>
                  ) : null}
                </p>
                <p className="text-sm text-muted mt-1">
                  {[categoryLabels[person.category], person.company].filter(Boolean).join(" · ")}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
