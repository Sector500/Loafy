import { Router } from "express";
import { db } from "@workspace/db";
import { milestonesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListMilestonesParams,
  CreateMilestoneParams,
  CreateMilestoneBody,
  UpdateMilestoneParams,
  UpdateMilestoneBody,
  DeleteMilestoneParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { getUserPlan } from "../middlewares/planCheck";

const router = Router();

const FREE_MILESTONE_LIMIT = 5;

router.get("/cats/:catId/milestones", requireAuth, async (req, res) => {
  const { catId } = ListMilestonesParams.parse(req.params);
  const milestones = await db
    .select()
    .from(milestonesTable)
    .where(eq(milestonesTable.catId, catId))
    .orderBy(milestonesTable.capturedAt);
  res.json(milestones);
});

router.post("/cats/:catId/milestones", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).userId;
  const { catId } = CreateMilestoneParams.parse(req.params);
  const body = CreateMilestoneBody.parse(req.body);

  const plan = await getUserPlan(userId);
  if (plan === "free") {
    const existing = await db
      .select()
      .from(milestonesTable)
      .where(eq(milestonesTable.catId, catId));
    if (existing.length >= FREE_MILESTONE_LIMIT) {
      res.status(403).json({
        error: "free_tier_limit",
        limit: "milestones",
        message: `Free accounts can store up to ${FREE_MILESTONE_LIMIT} milestones per cat. Upgrade to Loafing Plus for unlimited milestones.`,
      });
      return;
    }
  }

  const [milestone] = await db
    .insert(milestonesTable)
    .values({
      catId,
      title: body.title,
      ageDescription: body.ageDescription ?? null,
      photoUrl: body.photoUrl ?? null,
      notes: body.notes ?? null,
      capturedAt: body.capturedAt,
    })
    .returning();
  res.status(201).json(milestone);
});

router.put("/milestones/:id", requireAuth, async (req, res): Promise<void> => {
  const { id } = UpdateMilestoneParams.parse(req.params);
  const body = UpdateMilestoneBody.parse(req.body);
  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.ageDescription !== undefined) updateData.ageDescription = body.ageDescription;
  if (body.photoUrl !== undefined) updateData.photoUrl = body.photoUrl;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.capturedAt !== undefined) updateData.capturedAt = body.capturedAt;
  const [milestone] = await db
    .update(milestonesTable)
    .set(updateData)
    .where(eq(milestonesTable.id, id))
    .returning();
  if (!milestone) {
    res.status(404).json({ error: "Milestone not found" });
    return;
  }
  res.json(milestone);
});

router.delete("/milestones/:id", requireAuth, async (req, res) => {
  const { id } = DeleteMilestoneParams.parse(req.params);
  await db.delete(milestonesTable).where(eq(milestonesTable.id, id));
  res.status(204).send();
});

export default router;
