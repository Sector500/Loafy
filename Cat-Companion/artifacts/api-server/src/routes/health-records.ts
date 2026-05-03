import { Router } from "express";
import { db } from "@workspace/db";
import { healthRecordsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListHealthRecordsParams,
  CreateHealthRecordParams,
  CreateHealthRecordBody,
  UpdateHealthRecordParams,
  DeleteHealthRecordParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/cats/:catId/health-records", async (req, res) => {
  const { catId } = ListHealthRecordsParams.parse(req.params);
  const records = await db
    .select()
    .from(healthRecordsTable)
    .where(eq(healthRecordsTable.catId, catId))
    .orderBy(healthRecordsTable.date);
  res.json(records);
});

router.post("/cats/:catId/health-records", async (req, res) => {
  const { catId } = CreateHealthRecordParams.parse(req.params);
  const body = CreateHealthRecordBody.parse(req.body);
  const [record] = await db
    .insert(healthRecordsTable)
    .values({
      catId,
      type: body.type,
      name: body.name,
      date: body.date,
      nextDueDate: body.nextDueDate ?? null,
      administeredBy: body.administeredBy ?? null,
      batchNumber: body.batchNumber ?? null,
      notes: body.notes ?? null,
    })
    .returning();
  res.status(201).json(record);
});

router.put("/health-records/:id", async (req, res) => {
  const { id } = UpdateHealthRecordParams.parse(req.params);
  const body = CreateHealthRecordBody.parse(req.body);
  const updateData: Record<string, unknown> = {};
  if (body.type !== undefined) updateData.type = body.type;
  if (body.name !== undefined) updateData.name = body.name;
  if (body.date !== undefined) updateData.date = body.date;
  if (body.nextDueDate !== undefined) updateData.nextDueDate = body.nextDueDate;
  if (body.administeredBy !== undefined) updateData.administeredBy = body.administeredBy;
  if (body.batchNumber !== undefined) updateData.batchNumber = body.batchNumber;
  if (body.notes !== undefined) updateData.notes = body.notes;
  const [record] = await db
    .update(healthRecordsTable)
    .set(updateData)
    .where(eq(healthRecordsTable.id, id))
    .returning();
  res.json(record);
});

router.delete("/health-records/:id", async (req, res) => {
  const { id } = DeleteHealthRecordParams.parse(req.params);
  await db.delete(healthRecordsTable).where(eq(healthRecordsTable.id, id));
  res.status(204).send();
});

export default router;
