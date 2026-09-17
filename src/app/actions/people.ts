"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RelationshipCategory } from "@/generated/prisma/enums";

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return null;
  return value.trim();
}

function personFields(formData: FormData) {
  return {
    firstName: str(formData, "firstName") ?? "",
    lastName: str(formData, "lastName"),
    nickname: str(formData, "nickname"),
    category: (str(formData, "category") as RelationshipCategory | null) ?? RelationshipCategory.FRIEND,
    howWeMet: str(formData, "howWeMet"),
    notes: str(formData, "notes"),
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    address: str(formData, "address"),
    jobTitle: str(formData, "jobTitle"),
    company: str(formData, "company"),
    favoriteMeals: str(formData, "favoriteMeals"),
    favoriteTreats: str(formData, "favoriteTreats"),
    favoriteDrinks: str(formData, "favoriteDrinks"),
    hobbies: str(formData, "hobbies"),
    activeProjects: str(formData, "activeProjects"),
  };
}

export async function createPerson(formData: FormData) {
  const fields = personFields(formData);
  if (!fields.firstName) throw new Error("First name is required");

  const person = await prisma.person.create({ data: fields });
  revalidatePath("/people");
  redirect(`/people/${person.id}`);
}

export async function updatePerson(personId: string, formData: FormData) {
  const fields = personFields(formData);
  if (!fields.firstName) throw new Error("First name is required");

  await prisma.person.update({ where: { id: personId }, data: fields });
  revalidatePath("/people");
  revalidatePath(`/people/${personId}`);
  redirect(`/people/${personId}`);
}

export async function deletePerson(personId: string) {
  await prisma.person.delete({ where: { id: personId } });
  revalidatePath("/people");
  redirect("/people");
}
