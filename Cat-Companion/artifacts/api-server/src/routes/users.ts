import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as AuthRequest).userId;

  let [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (!user) {
    [user] = await db
      .insert(usersTable)
      .values({ id: userId, subscriptionTier: "free" })
      .returning();
  }

  const isPlus = user.subscriptionTier === "plus" || user.subscriptionTier === "premium";

  res.json({
    id: user.id,
    subscriptionTier: isPlus ? "plus" : "free",
    isPlus,
    isPremium: isPlus,
    limits: {
      cats: isPlus ? null : 1,
      milestones: isPlus ? null : 5,
      photos: isPlus ? null : 20,
      weightHistoryDays: isPlus ? null : 30,
    },
  });
});

export default router;
