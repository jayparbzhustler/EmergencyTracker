import { 
  users, type User, type InsertUser, 
  settings, type Settings, type InsertSettings,
  scans, type Scan, type InsertScan,
  notifications, type Notification, type InsertNotification
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private settingsData: Settings | undefined;
  private scansData: Map<number, Scan>;
  private notificationsData: Map<number, Notification>;
  
  currentId: number;
  scanId: number;
  notificationId: number;

  constructor() {
    this.users = new Map();
    this.scansData = new Map();
    this.notificationsData = new Map();
    this.currentId = 1;
    this.scanId = 1;
    this.notificationId = 1;
  }

  // User methods (keeping from template)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Settings methods
  async getSettings(): Promise<Settings | undefined> {
    return this.settingsData;
  }
  
  async saveSettings(insertSettings: InsertSettings): Promise<Settings> {
    const settings: Settings = { ...insertSettings, id: 1 };
    this.settingsData = settings;
    return settings;
  }
  
  // Scan methods
  async createScan(insertScan: InsertScan): Promise<Scan> {
    const id = this.scanId++;
    const scan: Scan = { ...insertScan, id };
    this.scansData.set(id, scan);
    return scan;
  }
  
  async getLatestScan(): Promise<Scan | undefined> {
    const scans = Array.from(this.scansData.values());
    if (scans.length === 0) {
      return undefined;
    }
    
    // Sort by timestamp descending
    return scans.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    })[0];
  }
  
  // Notification methods
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationId++;
    const notification: Notification = { ...insertNotification, id };
    this.notificationsData.set(id, notification);
    return notification;
  }
  
  async updateNotificationStatus(id: number, status: string): Promise<void> {
    const notification = this.notificationsData.get(id);
    if (notification) {
      notification.status = status;
      this.notificationsData.set(id, notification);
    }
  }
}

export const storage = new MemStorage();
