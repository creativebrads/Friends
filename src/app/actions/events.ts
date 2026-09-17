"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseDateInput } from "@/lib/dates";

export async function createEvent(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const startsAtValue = formData.get("startsAt") as string;
  const interestedPersonIds = formData.getAll("interestedPersonIds") as string[];

  if (!title) throw new Error("Title is required");
  if (!startsAtValue) throw new Error("Date is required");

  await prisma.event.create({
    data: {
      title,
      description,
      location,
      startsAt: parseDateInput(startsAtValue),
      interestedPeople: {
        create: interestedPersonIds.map((personId) => ({ personId })),
      },
    },
  });

  revalidatePath("/events");
  revalidatePath("/");
  redirect("/events");
}

export async function deleteEvent(eventId: string) {
  await prisma.event.delete({ where: { id: eventId } });
  revalidatePath("/events");
  revalidatePath("/");
}
