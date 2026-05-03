import { Router } from "express";
import { db } from "@workspace/db";
import { vetAppointmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListVetAppointmentsParams,
  CreateVetAppointmentParams,
  CreateVetAppointmentBody,
  UpdateVetAppointmentParams,
  UpdateVetAppointmentBody,
  DeleteVetAppointmentParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/cats/:catId/vet-appointments", async (req, res) => {
  const { catId } = ListVetAppointmentsParams.parse(req.params);
  const appts = await db
    .select()
    .from(vetAppointmentsTable)
    .where(eq(vetAppointmentsTable.catId, catId))
    .orderBy(vetAppointmentsTable.date);
  res.json(
    appts.map((a) => ({
      ...a,
      completed: a.completed === "true",
    }))
  );
});

router.post("/cats/:catId/vet-appointments", async (req, res) => {
  const { catId } = CreateVetAppointmentParams.parse(req.params);
  const body = CreateVetAppointmentBody.parse(req.body);
  const [appt] = await db
    .insert(vetAppointmentsTable)
    .values({
      catId,
      date: body.date,
      type: body.type,
      vetName: body.vetName ?? null,
      notes: body.notes ?? null,
      completed: body.completed ? "true" : "false",
    })
    .returning();
  res.status(201).json({ ...appt, completed: appt.completed === "true" });
});

router.put("/vet-appointments/:id", async (req, res) => {
  const { id } = UpdateVetAppointmentParams.parse(req.params);
  const body = UpdateVetAppointmentBody.parse(req.body);
  const updateData: Record<string, unknown> = {};
  if (body.date !== undefined) updateData.date = body.date;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.vetName !== undefined) updateData.vetName = body.vetName;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.completed !== undefined)
    updateData.completed = body.completed ? "true" : "false";
  const [appt] = await db
    .update(vetAppointmentsTable)
    .set(updateData)
    .where(eq(vetAppointmentsTable.id, id))
    .returning();
  if (!appt) return res.status(404).json({ error: "Appointment not found" });
  res.json({ ...appt, completed: appt.completed === "true" });
});

router.delete("/vet-appointments/:id", async (req, res) => {
  const { id } = DeleteVetAppointmentParams.parse(req.params);
  await db.delete(vetAppointmentsTable).where(eq(vetAppointmentsTable.id, id));
  res.status(204).send();
});

export default router;
