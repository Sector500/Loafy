import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function getUserPlan(userId: string): Promise<"free" | "plus"> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const tier = user?.subscriptionTier;
  return tier === "plus" || tier === "premium" ? "plus" : "free";
}
