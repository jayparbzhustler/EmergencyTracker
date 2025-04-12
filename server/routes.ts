import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertSettingsSchema, insertScanSchema } from "@shared/schema";

// Mock email service that logs emails to console instead of sending them
class MockEmailService {
  async sendMail(mailOptions: any) {
    console.log("========== MOCK EMAIL SENT ==========");
    console.log(`To: ${mailOptions.to}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log("Email body would contain the blocked exit image");
    console.log("=====================================");
    return { messageId: `mock-email-${Date.now()}` };
  }
}

// Create a mock email service
const transporter = new MockEmailService();

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  
  // Get application settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve settings" });
    }
  });

  // Save application settings
  app.post("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
      const settings = await storage.saveSettings(validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save settings" });
      }
    }
  });

  // Get latest scan
  app.get("/api/scans/latest", async (req, res) => {
    try {
      const scan = await storage.getLatestScan();
      if (!scan) {
        return res.status(404).json({ message: "No scans found" });
      }
      res.json(scan);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve latest scan" });
    }
  });

  // Save a new scan
  app.post("/api/scans", async (req, res) => {
    try {
      const validatedData = insertScanSchema.parse(req.body);
      const scan = await storage.createScan(validatedData);
      res.json(scan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid scan data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save scan" });
      }
    }
  });

  // Send a notification
  app.post("/api/notifications", async (req, res) => {
    try {
      // Validate request data
      const schema = z.object({
        image: z.string(),
        timestamp: z.string(),
        blocked: z.boolean()
      });
      
      const { image, timestamp, blocked } = schema.parse(req.body);
      
      // Get notification settings
      const settings = await storage.getSettings();
      if (!settings) {
        return res.status(400).json({ message: "Notification settings not configured" });
      }
      
      let recipient = settings.notificationEmail;
      
      // Check if we have a notification email or phone
      if (!recipient && !settings.notificationPhone) {
        return res.status(400).json({ message: "No notification recipient configured" });
      }
      
      // Default to email if both are available
      if (!recipient && settings.notificationPhone) {
        recipient = settings.notificationPhone;
      }
      
      // Create notification record
      const notification = await storage.createNotification({
        timestamp: new Date(timestamp),
        recipient: recipient,
        status: "pending",
        imageUrl: image
      });

      // If using email, send the notification
      if (settings.notificationEmail) {
        // Send email
        const mailOptions = {
          from: '"SafeExit System" <safeexit@warehouse.com>',
          to: settings.notificationEmail,
          subject: "Blocked Emergency Exit Detected",
          html: `
            <h2>Emergency Exit Blocked</h2>
            <p>A blocked emergency exit was detected in your facility.</p>
            <p><strong>Date & Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
            <p><strong>Status:</strong> Exit blocked - requires immediate attention</p>
            <p>Please check the attached image and clear the obstruction as soon as possible.</p>
            <p>This is a safety violation that should be addressed immediately.</p>
            <img src="${image}" alt="Blocked emergency exit" style="max-width: 100%; height: auto;">
          `,
          attachments: [
            {
              filename: 'blocked-exit.jpg',
              path: image,
              cid: 'blocked-exit'
            }
          ]
        };

        try {
          // Send mail with defined transport object
          await transporter.sendMail(mailOptions);
          console.log("Email notification sent to:", settings.notificationEmail);
        } catch (emailError) {
          console.error("Email sending error:", emailError);
          // Don't fail the entire operation if email fails
        }
      }
      
      // If using SMS/phone notification, we would add that code here
      if (settings.notificationPhone) {
        // SMS functionality would be implemented here
        console.log("SMS notification would be sent to:", settings.notificationPhone);
        // You would need to integrate with a service like Twilio for SMS
      }
      
      // Update notification status
      await storage.updateNotificationStatus(notification.id, "sent");
      
      res.json({ success: true });
    } catch (error) {
      console.error("Notification error:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
