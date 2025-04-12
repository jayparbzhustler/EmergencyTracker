import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User account schema - keeping this from template
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Settings for notification recipients
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  notificationEmail: text("notification_email"),
  notificationPhone: text("notification_phone"),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  sensitivity: integer("sensitivity").default(3),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

// Scans record
export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  blocked: boolean("blocked").default(false),
  imageUrl: text("image_url"),
});

export const insertScanSchema = createInsertSchema(scans).omit({
  id: true,
});

// Notifications record
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  recipient: text("recipient"),
  status: text("status").default("sent"),
  imageUrl: text("image_url"),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scans.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
