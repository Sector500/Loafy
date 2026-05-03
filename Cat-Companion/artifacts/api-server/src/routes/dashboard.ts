import { Router } from "express";
import { db } from "@workspace/db";
import {
  catsTable,
  feedingsTable,
  vetAppointmentsTable,
  milestonesTable,
  medicationsTable,
} from "@workspace/db";
import { sql, eq, and, gte, lt, isNotNull } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayStr = today.toISOString().split("T")[0];

  const [{ totalCats }] = await db
    .select({ totalCats: sql<number>`count(*)::int` })
    .from(catsTable);

  const [{ feedingsToday }] = await db
    .select({ feedingsToday: sql<number>`count(*)::int` })
    .from(feedingsTable)
    .where(and(gte(feedingsTable.fedAt, today), lt(feedingsTable.fedAt, tomorrow)));

  const allPendingAppts = await db
    .select()
    .from(vetAppointmentsTable)
    .where(eq(vetAppointmentsTable.completed, "false"));

  const upcomingAppointments = allPendingAppts.filter((a) => a.date >= todayStr).length;
  const overdueAppointments = allPendingAppts.filter((a) => a.date < todayStr).length;

  res.json({ totalCats, feedingsToday, upcomingAppointments, overdueAppointments });
});

router.get("/dashboard/upcoming-appointments", async (req, res) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const rows = await db
    .select({
      id: vetAppointmentsTable.id,
      catId: vetAppointmentsTable.catId,
      catName: catsTable.name,
      catPhotoUrl: catsTable.photoUrl,
      date: vetAppointmentsTable.date,
      type: vetAppointmentsTable.type,
      vetName: vetAppointmentsTable.vetName,
      notes: vetAppointmentsTable.notes,
      completed: vetAppointmentsTable.completed,
    })
    .from(vetAppointmentsTable)
    .innerJoin(catsTable, eq(vetAppointmentsTable.catId, catsTable.id))
    .where(and(eq(vetAppointmentsTable.completed, "false"), gte(vetAppointmentsTable.date, todayStr)))
    .orderBy(vetAppointmentsTable.date)
    .limit(10);

  res.json(rows.map((r) => ({ ...r, completed: r.completed === "true" })));
});

router.get("/dashboard/recent-feedings", async (req, res) => {
  const rows = await db
    .select({
      id: feedingsTable.id,
      catId: feedingsTable.catId,
      catName: catsTable.name,
      catPhotoUrl: catsTable.photoUrl,
      fedAt: feedingsTable.fedAt,
      foodType: feedingsTable.foodType,
      amountGrams: feedingsTable.amountGrams,
      notes: feedingsTable.notes,
    })
    .from(feedingsTable)
    .innerJoin(catsTable, eq(feedingsTable.catId, catsTable.id))
    .orderBy(sql`${feedingsTable.fedAt} DESC`)
    .limit(10);

  res.json(rows.map((r) => ({ ...r, fedAt: r.fedAt.toISOString() })));
});

router.get("/dashboard/recent-milestones", async (req, res) => {
  const rows = await db
    .select({
      id: milestonesTable.id,
      catId: milestonesTable.catId,
      catName: catsTable.name,
      catPhotoUrl: catsTable.photoUrl,
      title: milestonesTable.title,
      ageDescription: milestonesTable.ageDescription,
      photoUrl: milestonesTable.photoUrl,
      notes: milestonesTable.notes,
      capturedAt: milestonesTable.capturedAt,
    })
    .from(milestonesTable)
    .innerJoin(catsTable, eq(milestonesTable.catId, catsTable.id))
    .orderBy(sql`${milestonesTable.capturedAt} DESC`)
    .limit(6);

  res.json(rows);
});

router.get("/dashboard/medications-due", async (req, res) => {
  const now = new Date().toISOString();
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const rows = await db
    .select({
      id: medicationsTable.id,
      catId: medicationsTable.catId,
      catName: catsTable.name,
      catPhotoUrl: catsTable.photoUrl,
      name: medicationsTable.name,
      dose: medicationsTable.dose,
      frequencyLabel: medicationsTable.frequencyLabel,
      startDate: medicationsTable.startDate,
      endDate: medicationsTable.endDate,
      notes: medicationsTable.notes,
      isActive: medicationsTable.isActive,
      nextDoseAt: medicationsTable.nextDoseAt,
    })
    .from(medicationsTable)
    .innerJoin(catsTable, eq(medicationsTable.catId, catsTable.id))
    .where(and(eq(medicationsTable.isActive, true), isNotNull(medicationsTable.nextDoseAt)))
    .orderBy(medicationsTable.nextDoseAt);

  const due = rows.filter((r) => r.nextDoseAt && r.nextDoseAt <= in24h);
  res.json(due);
});

export default router;
