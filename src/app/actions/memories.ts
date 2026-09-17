"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseDateInput } from "@/lib/dates";

export async function addMemory(personId: string, formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const occurredOnValue = formData.get("occurredOn") as string;
  const photoUrlsRaw = (formData.get("photoUrls") as string) ?? "";
  const importantDateIds = formData.getAll("importantDateIds") as string[];

  if (!title) throw new Error("Title is required");
  if (!occurredOnValue) throw new Error("Date is required");

  const photoUrls = photoUrlsRaw
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean);

  await prisma.memory.create({
    data: {
      personId,
      title,
      description,
      location,
      occurredOn: parseDateInput(occurredOnValue),
      photos: { create: photoUrls.map((url) => ({ url })) },
      importantDates: {
        create: importantDateIds.map((importantDateId) => ({ importantDateId })),
      },
    },
  });

  revalidatePath(`/people/${personId}`);
}

export async function deleteMemory(personId: string, memoryId: string) {
  await prisma.memory.delete({ where: { id: memoryId } });
  revalidatePath(`/people/${personId}`);
}
