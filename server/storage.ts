import { 
  users, type User, type InsertUser, 
  settings, type Settings, type InsertSettings,
  scans, type Scan, type InsertScan,
  notifications, type Notification, type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User methods (keeping from template)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Settings methods
  getSettings(): Promise<Settings | undefined>;
  saveSettings(settings: InsertSettings): Promise<Settings>;
  
  // Scan methods
  createScan(scan: InsertScan): Promise<Scan>;
  getLatestScan(): Promise<Scan | undefined>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotificationStatus(id: number, status: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Settings methods
  async getSettings(): Promise<Settings | undefined> {
    const allSettings = await db.select().from(settings);
    // Always return the first settings record or undefined if none exists
    return allSettings.length > 0 ? allSettings[0] : undefined;
  }
  
  async saveSettings(insertSettings: InsertSettings): Promise<Settings> {
    // Check if settings already exist
    const existingSettings = await this.getSettings();
    
    if (existingSettings) {
      // Update existing settings
      const [updated] = await db
        .update(settings)
        .set(insertSettings)
        .where(eq(settings.id, existingSettings.id))
        .returning();
      return updated;
    } else {
      // Create new settings
      const [created] = await db
        .insert(settings)
        .values(insertSettings)
        .returning();
      return created;
    }
  }
  
  // Scan methods
  async createScan(insertScan: InsertScan): Promise<Scan> {
    const [scan] = await db
      .insert(scans)
      .values(insertScan)
      .returning();
    return scan;
  }
  
  async getLatestScan(): Promise<Scan | undefined> {
    const [latestScan] = await db
      .select()
      .from(scans)
      .orderBy(desc(scans.timestamp))
      .limit(1);
    
    return latestScan || undefined;
  }
  
  // Notification methods
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }
  
  async updateNotificationStatus(id: number, status: string): Promise<void> {
    await db
      .update(notifications)
      .set({ status })
      .where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
