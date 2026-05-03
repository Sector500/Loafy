import { Router } from "express";
import { db } from "@workspace/db";
import { medicationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListMedicationsParams,
  CreateMedicationParams,
  CreateMedicationBody,
  UpdateMedicationParams,
  UpdateMedicationBody,
  DeleteMedicationParams,
  MarkMedicationGivenParams,
  MarkMedicationGivenBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/cats/:catId/medications", async (req, res) => {
  const { catId } = ListMedicationsParams.parse(req.params);
  const meds = await db
    .select()
    .from(medicationsTable)
    .where(eq(medicationsTable.catId, catId))
    .orderBy(medicationsTable.startDate);
  res.json(meds);
});

router.post("/cats/:catId/medications", async (req, res) => {
  const { catId } = CreateMedicationParams.parse(req.params);
  const body = CreateMedicationBody.parse(req.body);
  const [med] = await db
    .insert(medicationsTable)
    .values({
      catId,
      name: body.name,
      dose: body.dose ?? null,
      frequencyLabel: body.frequencyLabel ?? null,
      startDate: body.startDate,
      endDate: body.endDate ?? null,
      notes: body.notes ?? null,
      isActive: body.isActive ?? true,
      nextDoseAt: body.nextDoseAt ?? null,
    })
    .returning();
  res.status(201).json(med);
});

router.put("/medications/:id", async (req, res) => {
  const { id } = UpdateMedicationParams.parse(req.params);
  const body = UpdateMedicationBody.parse(req.body);
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.dose !== undefined) updateData.dose = body.dose;
  if (body.frequencyLabel !== undefined) updateData.frequencyLabel = body.frequencyLabel;
  if (body.startDate !== undefined) updateData.startDate = body.startDate;
  if (body.endDate !== undefined) updateData.endDate = body.endDate;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.nextDoseAt !== undefined) updateData.nextDoseAt = body.nextDoseAt;
  const [med] = await db
    .update(medicationsTable)
    .set(updateData)
    .where(eq(medicationsTable.id, id))
    .returning();
  if (!med) return res.status(404).json({ error: "Medication not found" });
  res.json(med);
});

router.delete("/medications/:id", async (req, res) => {
  const { id } = DeleteMedicationParams.parse(req.params);
  await db.delete(medicationsTable).where(eq(medicationsTable.id, id));
  res.status(204).send();
});

router.post("/medications/:id/mark-given", async (req, res) => {
  const { id } = MarkMedicationGivenParams.parse(req.params);
  const body = MarkMedicationGivenBody.parse(req.body);
  const [med] = await db
    .update(medicationsTable)
    .set({ nextDoseAt: body.nextDoseAt ?? null })
    .where(eq(medicationsTable.id, id))
    .returning();
  if (!med) return res.status(404).json({ error: "Medication not found" });
  res.json(med);
});

export default router;
