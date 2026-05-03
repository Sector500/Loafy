import { pgTable, serial, text, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof usersTable.$inferSelect;

export const catsTable = pgTable("cats", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  breed: text("breed"),
  birthdate: text("birthdate"),
  weightKg: real("weight_kg"),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  favouriteToy: text("favourite_toy"),
  favouriteFood: text("favourite_food"),
  personalityTraits: text("personality_traits"),
  favouriteSpot: text("favourite_spot"),
  favouriteSound: text("favourite_sound"),
  favouriteHuman: text("favourite_human"),
  traitScores: text("trait_scores"),
  awards: text("awards"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCatSchema = createInsertSchema(catsTable).omit({ id: true, createdAt: true });
export type InsertCat = z.infer<typeof insertCatSchema>;
export type Cat = typeof catsTable.$inferSelect;

export const feedingsTable = pgTable("feedings", {
  id: serial("id").primaryKey(),
  catId: serial("cat_id").notNull().references(() => catsTable.id, { onDelete: "cascade" }),
  fedAt: timestamp("fed_at").notNull(),
  foodType: text("food_type"),
  amountGrams: real("amount_grams"),
  notes: text("notes"),
});

export const insertFeedingSchema = createInsertSchema(feedingsTable).omit({ id: true });
export type InsertFeeding = z.infer<typeof insertFeedingSchema>;
export type Feeding = typeof feedingsTable.$inferSelect;

export const vetAppointmentsTable = pgTable("vet_appointments", {
  id: serial("id").primaryKey(),
  catId: serial("cat_id").notNull().references(() => catsTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  type: text("type").notNull(),
  vetName: text("vet_name"),
  notes: text("notes"),
  completed: text("completed").notNull().default("false"),
});

export const insertVetAppointmentSchema = createInsertSchema(vetAppointmentsTable).omit({ id: true });
export type InsertVetAppointment = z.infer<typeof insertVetAppointmentSchema>;
export type VetAppointment = typeof vetAppointmentsTable.$inferSelect;

export const weightLogsTable = pgTable("weight_logs", {
  id: serial("id").primaryKey(),
  catId: serial("cat_id").notNull().references(() => catsTable.id, { onDelete: "cascade" }),
  weightKg: real("weight_kg").notNull(),
  loggedAt: timestamp("logged_at").notNull(),
  notes: text("notes"),
});

export const insertWeightLogSchema = createInsertSchema(weightLogsTable).omit({ id: true });
export type InsertWeightLog = z.infer<typeof insertWeightLogSchema>;
export type WeightLog = typeof weightLogsTable.$inferSelect;

export const milestonesTable = pgTable("milestones", {
  id: serial("id").primaryKey(),
  catId: serial("cat_id").notNull().references(() => catsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  ageDescription: text("age_description"),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  capturedAt: text("captured_at").notNull(),
});

export const insertMilestoneSchema = createInsertSchema(milestonesTable).omit({ id: true });
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestonesTable.$inferSelect;

export const photoAlbumTable = pgTable("photo_album", {
  id: serial("id").primaryKey(),
  catId: serial("cat_id").notNull().references(() => catsTable.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url"),
  caption: text("caption"),
  capturedAt: text("captured_at").notNull(),
});

export const insertPhotoAlbumSchema = createInsertSchema(photoAlbumTable).omit({ id: true });
export type InsertPhotoAlbum = z.infer<typeof insertPhotoAlbumSchema>;
export type PhotoAlbum = typeof photoAlbumTable.$inferSelect;

export const medicationsTable = pgTable("medications", {
  id: serial("id").primaryKey(),
  catId: serial("cat_id").notNull().references(() => catsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dose: text("dose"),
  frequencyLabel: text("frequency_label"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  nextDoseAt: text("next_dose_at"),
});

export const insertMedicationSchema = createInsertSchema(medicationsTable).omit({ id: true });
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medicationsTable.$inferSelect;

export const healthRecordsTable = pgTable("health_records", {
  id: serial("id").primaryKey(),
  catId: serial("cat_id").notNull().references(() => catsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  name: text("name").notNull(),
  date: text("date").notNull(),
  nextDueDate: text("next_due_date"),
  administeredBy: text("administered_by"),
  batchNumber: text("batch_number"),
  notes: text("notes"),
});

export const insertHealthRecordSchema = createInsertSchema(healthRecordsTable).omit({ id: true });
export type InsertHealthRecord = z.infer<typeof insertHealthRecordSchema>;
export type HealthRecord = typeof healthRecordsTable.$inferSelect;
