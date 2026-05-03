import { Router } from "express";
import { db } from "@workspace/db";
import { weightLogsTable } from "@workspace/db";
import { eq, and, gte } from "drizzle-orm";
import {
  ListWeightLogsParams,
  LogWeightParams,
  LogWeightBody,
  DeleteWeightLogParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { getUserPlan } from "../middlewares/planCheck";

const router = Router();

const FREE_WEIGHT_DAYS = 30;

router.get("/cats/:catId/weight-logs", requireAuth, async (req, res) => {
  const userId = (req as AuthRequest).userId;
  const { catId } = ListWeightLogsParams.parse(req.params);

  const plan = await getUserPlan(userId);

  let logs;
  if (plan === "free") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - FREE_WEIGHT_DAYS);
    logs = await db
      .select()
      .from(weightLogsTable)
      .where(and(eq(weightLogsTable.catId, catId), gte(weightLogsTable.loggedAt, cutoff)))
      .orderBy(weightLogsTable.loggedAt);
  } else {
    logs = await db
      .select()
      .from(weightLogsTable)
      .where(eq(weightLogsTable.catId, catId))
      .orderBy(weightLogsTable.loggedAt);
  }

  res.json(logs.map((l) => ({ ...l, loggedAt: l.loggedAt.toISOString() })));
});

router.post("/cats/:catId/weight-logs", requireAuth, async (req, res) => {
  const { catId } = LogWeightParams.parse(req.params);
  const body = LogWeightBody.parse(req.body);
  const [log] = await db
    .insert(weightLogsTable)
    .values({ catId, weightKg: body.weightKg, loggedAt: new Date(body.loggedAt), notes: body.notes ?? null })
    .returning();
  res.status(201).json({ ...log, loggedAt: log.loggedAt.toISOString() });
});

router.delete("/weight-logs/:id", requireAuth, async (req, res) => {
  const { id } = DeleteWeightLogParams.parse(req.params);
  await db.delete(weightLogsTable).where(eq(weightLogsTable.id, id));
  res.status(204).send();
});

export default router;
