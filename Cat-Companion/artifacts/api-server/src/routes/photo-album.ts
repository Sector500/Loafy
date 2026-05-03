import { Router } from "express";
import { db } from "@workspace/db";
import { photoAlbumTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListAlbumParams,
  CreateAlbumEntryParams,
  CreateAlbumEntryBody,
  UpdateAlbumEntryParams,
  UpdateAlbumEntryBody,
  DeleteAlbumEntryParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { getUserPlan } from "../middlewares/planCheck";

const router = Router();

const FREE_PHOTO_LIMIT = 20;

router.get("/cats/:catId/album", requireAuth, async (req, res) => {
  const { catId } = ListAlbumParams.parse(req.params);
  const entries = await db
    .select()
    .from(photoAlbumTable)
    .where(eq(photoAlbumTable.catId, catId))
    .orderBy(photoAlbumTable.capturedAt);
  res.json(entries);
});

router.post("/cats/:catId/album", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).userId;
  const { catId } = CreateAlbumEntryParams.parse(req.params);
  const body = CreateAlbumEntryBody.parse(req.body);

  const plan = await getUserPlan(userId);
  if (plan === "free") {
    const existing = await db
      .select()
      .from(photoAlbumTable)
      .where(eq(photoAlbumTable.catId, catId));
    if (existing.length >= FREE_PHOTO_LIMIT) {
      res.status(403).json({
        error: "free_tier_limit",
        limit: "photos",
        message: `Free accounts can store up to ${FREE_PHOTO_LIMIT} photos per cat. Upgrade to Loafing Plus for unlimited photo memories.`,
      });
      return;
    }
  }

  const [entry] = await db
    .insert(photoAlbumTable)
    .values({
      catId,
      photoUrl: body.photoUrl ?? null,
      caption: body.caption ?? null,
      capturedAt: body.capturedAt,
    })
    .returning();
  res.status(201).json(entry);
});

router.put("/album/:id", requireAuth, async (req, res): Promise<void> => {
  const { id } = UpdateAlbumEntryParams.parse(req.params);
  const body = UpdateAlbumEntryBody.parse(req.body);
  const updateData: Record<string, unknown> = {};
  if (body.photoUrl !== undefined) updateData.photoUrl = body.photoUrl;
  if (body.caption !== undefined) updateData.caption = body.caption;
  if (body.capturedAt !== undefined) updateData.capturedAt = body.capturedAt;
  const [entry] = await db
    .update(photoAlbumTable)
    .set(updateData)
    .where(eq(photoAlbumTable.id, id))
    .returning();
  if (!entry) {
    res.status(404).json({ error: "Album entry not found" });
    return;
  }
  res.json(entry);
});

router.delete("/album/:id", requireAuth, async (req, res) => {
  const { id } = DeleteAlbumEntryParams.parse(req.params);
  await db.delete(photoAlbumTable).where(eq(photoAlbumTable.id, id));
  res.status(204).send();
});

export default router;
