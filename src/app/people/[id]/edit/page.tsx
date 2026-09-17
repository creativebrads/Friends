import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePerson } from "@/app/actions/people";
import { PersonForm } from "@/components/person-form";
import { Card } from "@/components/ui";

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await prisma.person.findUnique({ where: { id } });
  if (!person) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl mb-6">
        Edit {person.firstName} {person.lastName}
      </h1>
      <Card className="p-6">
        <PersonForm action={updatePerson.bind(null, person.id)} defaults={person} submitLabel="Save changes" />
      </Card>
    </div>
  );
}
