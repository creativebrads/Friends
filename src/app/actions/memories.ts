"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseDateInput } from "@/lib/dates";
import { saveUploadedPhoto, deleteUploadedPhoto } from "@/lib/uploads";

export async function addMemory(personId: string, formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const occurredOnValue = formData.get("occurredOn") as string;
  const photoUrlsRaw = (formData.get("photoUrls") as string) ?? "";
  const importantDateIds = formData.getAll("importantDateIds") as string[];
  const uploadedFiles = (formData.getAll("photoFiles") as File[]).filter((file) => file.size > 0);

  if (!title) throw new Error("Title is required");
  if (!occurredOnValue) throw new Error("Date is required");

  const pastedUrls = photoUrlsRaw
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean);

  const uploadedUrls = await Promise.all(uploadedFiles.map(saveUploadedPhoto));
  const photoUrls = [...uploadedUrls, ...pastedUrls];

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
  const memory = await prisma.memory.delete({
    where: { id: memoryId },
    include: { photos: true },
  });
  await Promise.all(memory.photos.map((photo) => deleteUploadedPhoto(photo.url)));
  revalidatePath(`/people/${personId}`);
}

export async function deletePhoto(personId: string, photoId: string) {
  const photo = await prisma.photo.delete({ where: { id: photoId } });
  await deleteUploadedPhoto(photo.url);
  revalidatePath(`/people/${personId}`);
}
