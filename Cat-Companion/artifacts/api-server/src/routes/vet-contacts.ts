import { Router } from "express";
import { db } from "@workspace/db";
import { vetContactsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListVetContactsQueryParams,
  CreateVetContactBody,
  UpdateVetContactParams,
  UpdateVetContactBody,
  DeleteVetContactParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/vet-contacts", async (req, res) => {
  const parsed = ListVetContactsQueryParams.parse(req.query);
  const contacts = await db.select().from(vetContactsTable).orderBy(vetContactsTable.clinicName);
  if (parsed.catId) {
    return res.json(contacts.filter((c) => c.catId === parsed.catId || c.catId === null));
  }
  res.json(contacts);
});

router.post("/vet-contacts", async (req, res) => {
  const body = CreateVetContactBody.parse(req.body);
  const [contact] = await db
    .insert(vetContactsTable)
    .values({
      catId: body.catId ?? null,
      clinicName: body.clinicName,
      vetName: body.vetName ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      address: body.address ?? null,
      isEmergency: body.isEmergency ?? false,
      notes: body.notes ?? null,
    })
    .returning();
  res.status(201).json(contact);
});

router.put("/vet-contacts/:id", async (req, res) => {
  const { id } = UpdateVetContactParams.parse(req.params);
  const body = UpdateVetContactBody.parse(req.body);
  const updateData: Record<string, unknown> = {};
  if (body.catId !== undefined) updateData.catId = body.catId;
  if (body.clinicName !== undefined) updateData.clinicName = body.clinicName;
  if (body.vetName !== undefined) updateData.vetName = body.vetName;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.email !== undefined) updateData.email = body.email;
  if (body.address !== undefined) updateData.address = body.address;
  if (body.isEmergency !== undefined) updateData.isEmergency = body.isEmergency;
  if (body.notes !== undefined) updateData.notes = body.notes;
  const [contact] = await db
    .update(vetContactsTable)
    .set(updateData)
    .where(eq(vetContactsTable.id, id))
    .returning();
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  res.json(contact);
});

router.delete("/vet-contacts/:id", async (req, res) => {
  const { id } = DeleteVetContactParams.parse(req.params);
  await db.delete(vetContactsTable).where(eq(vetContactsTable.id, id));
  res.status(204).send();
});

export default router;
