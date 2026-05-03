import { Router } from "express";
import { db } from "@workspace/db";
import { feedingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListFeedingsParams,
  LogFeedingParams,
  LogFeedingBody,
  DeleteFeedingParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/cats/:catId/feedings", async (req, res) => {
  const { catId } = ListFeedingsParams.parse(req.params);
  const feedings = await db
    .select()
    .from(feedingsTable)
    .where(eq(feedingsTable.catId, catId))
    .orderBy(feedingsTable.fedAt);
  res.json(
    feedings.map((f) => ({
      ...f,
      fedAt: f.fedAt.toISOString(),
    }))
  );
});

router.post("/cats/:catId/feedings", async (req, res) => {
  const { catId } = LogFeedingParams.parse(req.params);
  const body = LogFeedingBody.parse(req.body);
  const [feeding] = await db
    .insert(feedingsTable)
    .values({ ...body, catId, fedAt: new Date(body.fedAt) })
    .returning();
  res.status(201).json({ ...feeding, fedAt: feeding.fedAt.toISOString() });
});

router.delete("/feedings/:id", async (req, res) => {
  const { id } = DeleteFeedingParams.parse(req.params);
  await db.delete(feedingsTable).where(eq(feedingsTable.id, id));
  res.status(204).send();
});

export default router;
