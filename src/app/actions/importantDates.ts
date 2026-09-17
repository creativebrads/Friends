"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DateType } from "@/generated/prisma/enums";
import { parseDateInput } from "@/lib/dates";

function parseReminderDaysBefore(formData: FormData): number {
  const raw = formData.get("reminderDaysBefore");
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > 365) {
    throw new Error("Reminder lead time must be a whole number of days between 0 and 365");
  }
  return value;
}

export async function addImportantDate(personId: string, formData: FormData) {
  const type = formData.get("type") as DateType;
  const label = (formData.get("label") as string)?.trim() || null;
  const dateValue = formData.get("date") as string;
  const recurring = formData.get("recurring") === "on";
  const reminderDaysBefore = parseReminderDaysBefore(formData);

  if (!dateValue) throw new Error("Date is required");

  await prisma.importantDate.create({
    data: {
      personId,
      type,
      label,
      date: parseDateInput(dateValue),
      recurring,
      reminderDaysBefore,
    },
  });

  revalidatePath(`/people/${personId}`);
}

export async function updateReminderLeadTime(personId: string, importantDateId: string, formData: FormData) {
  const reminderDaysBefore = parseReminderDaysBefore(formData);

  await prisma.importantDate.update({
    where: { id: importantDateId },
    data: { reminderDaysBefore },
  });

  revalidatePath(`/people/${personId}`);
}

export async function deleteImportantDate(personId: string, importantDateId: string) {
  await prisma.importantDate.delete({ where: { id: importantDateId } });
  revalidatePath(`/people/${personId}`);
}
