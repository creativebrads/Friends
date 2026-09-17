"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DateType } from "@/generated/prisma/enums";
import { parseDateInput } from "@/lib/dates";

export async function addImportantDate(personId: string, formData: FormData) {
  const type = formData.get("type") as DateType;
  const label = (formData.get("label") as string)?.trim() || null;
  const dateValue = formData.get("date") as string;
  const recurring = formData.get("recurring") === "on";

  if (!dateValue) throw new Error("Date is required");

  await prisma.importantDate.create({
    data: {
      personId,
      type,
      label,
      date: parseDateInput(dateValue),
      recurring,
    },
  });

  revalidatePath(`/people/${personId}`);
}

export async function deleteImportantDate(personId: string, importantDateId: string) {
  await prisma.importantDate.delete({ where: { id: importantDateId } });
  revalidatePath(`/people/${personId}`);
}
