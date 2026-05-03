import { Router } from "express";
import { db } from "@workspace/db";
import { catsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateCatBody,
  UpdateCatBody,
  GetCatParams,
  UpdateCatParams,
  DeleteCatParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/cats", requireAuth, async (req, res) => {
  const userId = (req as AuthRequest).userId;
  const cats = await db
    .select()
    .from(catsTable)
    .where(eq(catsTable.userId, userId))
    .orderBy(catsTable.createdAt);
  res.json(cats.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })));
});

router.post("/cats", requireAuth, async (req, res) => {
  const userId = (req as AuthRequest).userId;

  // Enforce free-tier cat limit (max 1)
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const isPremium = user?.subscriptionTier === "premium";

  if (!isPremium) {
    const existing = await db
      .select()
      .from(catsTable)
      .where(eq(catsTable.userId, userId));
    if (existing.length >= 1) {
      return res.status(403).json({
        error: "free_tier_limit",
        message: "Free accounts can only add 1 cat. Upgrade to Premium for unlimited cats.",
      });
    }
  }

  const body = CreateCatBody.parse(req.body);
  const [cat] = await db.insert(catsTable).values({ ...body, userId }).returning();
  res.status(201).json({ ...cat, createdAt: cat.createdAt.toISOString() });
});

router.get("/cats/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthRequest).userId;
  const { id } = GetCatParams.parse(req.params);
  const [cat] = await db
    .select()
    .from(catsTable)
    .where(and(eq(catsTable.id, id), eq(catsTable.userId, userId)));
  if (!cat) return res.status(404).json({ error: "Cat not found" });
  res.json({ ...cat, createdAt: cat.createdAt.toISOString() });
});

router.put("/cats/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthRequest).userId;
  const { id } = UpdateCatParams.parse(req.params);
  const body = UpdateCatBody.parse(req.body);
  const [cat] = await db
    .update(catsTable)
    .set(body)
    .where(and(eq(catsTable.id, id), eq(catsTable.userId, userId)))
    .returning();
  if (!cat) return res.status(404).json({ error: "Cat not found" });
  res.json({ ...cat, createdAt: cat.createdAt.toISOString() });
});

router.delete("/cats/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthRequest).userId;
  const { id } = DeleteCatParams.parse(req.params);
  await db.delete(catsTable).where(and(eq(catsTable.id, id), eq(catsTable.userId, userId)));
  res.status(204).send();
});

export default router;
