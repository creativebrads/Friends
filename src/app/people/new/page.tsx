import { createPerson } from "@/app/actions/people";
import { PersonForm } from "@/components/person-form";
import { Card } from "@/components/ui";

export default function NewPersonPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl mb-6">Add someone new</h1>
      <Card className="p-6">
        <PersonForm action={createPerson} submitLabel="Add person" />
      </Card>
    </div>
  );
}
