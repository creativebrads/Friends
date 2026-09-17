"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function setCheckInCadence(personId: string, formData: FormData) {
  const cadenceDays = Number(formData.get("cadenceDays"));
  if (!cadenceDays || cadenceDays < 1) throw new Error("Cadence must be a positive number of days");

  const existing = await prisma.checkIn.findUnique({ where: { personId } });
  const lastContactAt = existing?.lastContactAt ?? new Date();
  const nextDueAt = new Date(lastContactAt.getTime() + cadenceDays * 24 * 60 * 60 * 1000);

  await prisma.checkIn.upsert({
    where: { personId },
    create: { personId, cadenceDays, lastContactAt, nextDueAt },
    update: { cadenceDays, nextDueAt },
  });

  revalidatePath(`/people/${personId}`);
  revalidatePath("/");
}

export async function markContacted(personId: string) {
  const checkIn = await prisma.checkIn.findUnique({ where: { personId } });
  if (!checkIn) return;

  const lastContactAt = new Date();
  const nextDueAt = new Date(lastContactAt.getTime() + checkIn.cadenceDays * 24 * 60 * 60 * 1000);

  await prisma.checkIn.update({
    where: { personId },
    data: { lastContactAt, nextDueAt },
  });

  revalidatePath(`/people/${personId}`);
  revalidatePath("/");
}
