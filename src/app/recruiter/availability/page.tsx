import RecruiterAvailabilityClient, {
  AvailabilityOperation,
} from "@/components/recruiter/recruiter-availability-progress";
import { recruiterAvailability } from "@/db/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  addAvailability,
  getAvailabilities,
  removeAvailability,
} from "@/lib/recruiter";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

export default async function RecruiterAvailabilityPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  async function confirm(availabilityOperations: AvailabilityOperation[]) {
    "use server";

    await db.transaction(async (tx) => {
      for (const operation of availabilityOperations) {
        if (operation.type === "add") {
          const existing = await tx
            .select()
            .from(recruiterAvailability)
            .where(
              and(
                eq(recruiterAvailability.start, operation.availability.start),
                eq(
                  recruiterAvailability.recruitmentYear,
                  operation.availability.recruitmentYear,
                ),
                eq(
                  recruiterAvailability.duration,
                  operation.availability.duration,
                ),
                eq(
                  recruiterAvailability.recruiterId,
                  operation.availability.recruiterId,
                ),
              ),
            );

          if (existing.length === 0)
            await addAvailability(operation.availability);
        } else {
          await removeAvailability(operation.availability);
        }
      }
    });

    return true;
  }

  const currentAvailabilities = await getAvailabilities(session?.user.id);

  return (
    <>
      <h1 className="text-4xl text-center font-bold">
        Marca as tuas disponibilidades
      </h1>
      <RecruiterAvailabilityClient
        currentAvailabilities={currentAvailabilities}
        saveAvailabilities={confirm}
        recruiterId={session?.user.id}
      />
    </>
  );
}
