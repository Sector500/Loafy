import { pgTable, serial, text, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { catsTable } from "./cats";

export const vetContactsTable = pgTable("vet_contacts", {
  id: serial("id").primaryKey(),
  catId: integer("cat_id").references(() => catsTable.id, { onDelete: "cascade" }),
  clinicName: text("clinic_name").notNull(),
  vetName: text("vet_name"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  isEmergency: boolean("is_emergency").notNull().default(false),
  notes: text("notes"),
});

export const insertVetContactSchema = createInsertSchema(vetContactsTable).omit({ id: true });
export type InsertVetContact = z.infer<typeof insertVetContactSchema>;
export type VetContact = typeof vetContactsTable.$inferSelect;
