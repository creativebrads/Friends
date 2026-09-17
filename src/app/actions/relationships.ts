"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { FamilyRelationType } from "@/generated/prisma/enums";

export async function addRelationship(personId: string, formData: FormData) {
  const relatedPersonId = formData.get("relatedPersonId") as string;
  const type = formData.get("type") as FamilyRelationType;
  const label = (formData.get("label") as string)?.trim() || null;

  if (!relatedPersonId) throw new Error("Related person is required");
  if (relatedPersonId === personId) throw new Error("Cannot relate a person to themselves");

  await prisma.personRelationship.create({
    data: { personId, relatedPersonId, type, label },
  });

  revalidatePath(`/people/${personId}`);
  revalidatePath(`/people/${relatedPersonId}`);
}

export async function deleteRelationship(personId: string, relationshipId: string) {
  const relationship = await prisma.personRelationship.delete({
    where: { id: relationshipId },
  });
  revalidatePath(`/people/${personId}`);
  revalidatePath(`/people/${relationship.relatedPersonId}`);
}
