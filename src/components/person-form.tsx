import { RelationshipCategory } from "@/generated/prisma/enums";
import { Field, inputClasses, SubmitButton } from "@/components/ui";

type PersonDefaults = Partial<{
  firstName: string;
  lastName: string | null;
  nickname: string | null;
  category: RelationshipCategory;
  howWeMet: string | null;
  notes: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  jobTitle: string | null;
  company: string | null;
  favoriteMeals: string | null;
  favoriteTreats: string | null;
  favoriteDrinks: string | null;
  hobbies: string | null;
  activeProjects: string | null;
}>;

const categoryLabels: Record<RelationshipCategory, string> = {
  FAMILY: "Family",
  FRIEND: "Friend",
  COWORKER: "Coworker",
  ACQUAINTANCE: "Acquaintance",
  OTHER: "Other",
};

export function PersonForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaults?: PersonDefaults;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-8">
      <section className="space-y-4">
        <h3 className="font-display text-base">Basics</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name">
            <input
              name="firstName"
              required
              defaultValue={defaults?.firstName}
              className={inputClasses}
            />
          </Field>
          <Field label="Last name">
            <input name="lastName" defaultValue={defaults?.lastName ?? ""} className={inputClasses} />
          </Field>
          <Field label="Nickname">
            <input name="nickname" defaultValue={defaults?.nickname ?? ""} className={inputClasses} />
          </Field>
          <Field label="Category">
            <select
              name="category"
              defaultValue={defaults?.category ?? RelationshipCategory.FRIEND}
              className={inputClasses}
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="How we met">
          <input name="howWeMet" defaultValue={defaults?.howWeMet ?? ""} className={inputClasses} />
        </Field>
        <Field label="Notes">
          <textarea
            name="notes"
            rows={3}
            defaultValue={defaults?.notes ?? ""}
            className={inputClasses}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-base">Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <input name="email" type="email" defaultValue={defaults?.email ?? ""} className={inputClasses} />
          </Field>
          <Field label="Phone">
            <input name="phone" defaultValue={defaults?.phone ?? ""} className={inputClasses} />
          </Field>
        </div>
        <Field label="Address">
          <input name="address" defaultValue={defaults?.address ?? ""} className={inputClasses} />
        </Field>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-base">Work</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Job title">
            <input name="jobTitle" defaultValue={defaults?.jobTitle ?? ""} className={inputClasses} />
          </Field>
          <Field label="Company">
            <input name="company" defaultValue={defaults?.company ?? ""} className={inputClasses} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-base">What they love</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Favorite meals">
            <input
              name="favoriteMeals"
              defaultValue={defaults?.favoriteMeals ?? ""}
              className={inputClasses}
            />
          </Field>
          <Field label="Favorite treats">
            <input
              name="favoriteTreats"
              defaultValue={defaults?.favoriteTreats ?? ""}
              className={inputClasses}
            />
          </Field>
          <Field label="Favorite drinks">
            <input
              name="favoriteDrinks"
              defaultValue={defaults?.favoriteDrinks ?? ""}
              className={inputClasses}
            />
          </Field>
          <Field label="Hobbies & passions">
            <input name="hobbies" defaultValue={defaults?.hobbies ?? ""} className={inputClasses} />
          </Field>
        </div>
        <Field label="Active projects">
          <input
            name="activeProjects"
            defaultValue={defaults?.activeProjects ?? ""}
            className={inputClasses}
          />
        </Field>
      </section>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
