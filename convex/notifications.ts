import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";


/**
 * Create a notification for a single user
 */
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    userType: v.union(v.literal("admin"), v.literal("designer"), v.literal("client")),
    message: v.string(),
    title: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, { userId, userType, message, title, type }) => {
    try {
      const userRecord = await ctx.db.get(userId);
      if (!userRecord) throw new Error(`User ${userId} not found`);

      await ctx.db.insert("notifications", {
        recipient_user_id: userId,
        recipient_user_type: userType,
        notif_content: message,
        created_at: Date.now(),
        is_read: false,
      });


       // 🟢 3. Send email notification (optional if user has an email)
      if (userRecord.email) {
        // Use Convex scheduler to call an ACTION (server-side email sender)
        await ctx.scheduler.runAfter(0, api.sendEmail.sendEmailAction, {
          to: userRecord.email,
          subject: "New Notification from TechShirt",
          text: message,
        });
      }

      // 🔔 4. Send push notification via Firebase Cloud Messaging
      // Get all FCM tokens for this user
      const fcmTokens = await ctx.db.query("fcmTokens")
        .withIndex("by_userId", (q: any) => q.eq("userId", userId))
        .collect();

      console.log(`📱 Found ${fcmTokens.length} FCM tokens for user ${userId}`);

      if (fcmTokens.length > 0) {
        // Send push notification to each device individually
        for (const fcmTokenRecord of fcmTokens) {
          console.log(`🚀 Sending push notification to device with token: ${fcmTokenRecord.token}`);

          // Schedule action to send push notification to single device
          await ctx.scheduler.runAfter(0, api.sendPushNotification.sendPushNotification, {
            fcmToken: fcmTokenRecord.token,
            title: title || "🔔 TechShirt Notification",
            body: message,
            data: {
              notificationId: userId.toString(),
              type: type || "notification",
            },
          });
        }
      } else {
        console.log(`⚠️ No FCM tokens found for user ${userId}`);
      }

    } catch (error: any) {
      console.error("Error creating notification:", error);
      return { success: false, error: error.message };
    }
  },
});

/**
 * Create notifications for multiple users
 */
export const createNotificationForMultipleUsers = mutation({
  args: {
    recipients: v.array(
      v.object({
        userId: v.id("users"),
        userType: v.union(v.literal("admin"), v.literal("designer"), v.literal("client")),
      })
    ),
    message: v.string(),
    title: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, { recipients, message, title, type }) => {
    const results: {
      userId: string;
      userType: "admin" | "designer" | "client";
      success: boolean;
      result?: any;
      error?: string;
    }[] = [];

    // Collect all FCM tokens for all recipients
    const allFcmTokens: { token: string; userId: string }[] = [];

    for (const recipient of recipients) {
      try {
        const userRecord = await ctx.db.get(recipient.userId);
        if (!userRecord) throw new Error(`User ${recipient.userId} not found`);

        // Insert notification to database
        await ctx.db.insert("notifications", {
          recipient_user_id: recipient.userId,
          recipient_user_type: recipient.userType,
          notif_content: message,
          created_at: Date.now(),
          is_read: false,
        });

        // Send email notification
        if (userRecord.email) {
          await ctx.scheduler.runAfter(0, api.sendEmail.sendEmailAction, {
            to: userRecord.email,
            subject: "New Notification from TechShirt",
            text: message,
          });
        }

        // Collect FCM tokens
        const fcmTokens = await ctx.db.query("fcmTokens")
          .withIndex("by_userId", (q: any) => q.eq("userId", recipient.userId))
          .collect();

        fcmTokens.forEach((t: any) => {
          allFcmTokens.push({ token: t.token, userId: recipient.userId.toString() });
        });

        results.push({ ...recipient, success: true });
      } catch (error: any) {
        results.push({ ...recipient, success: false, error: error.message });
      }
    }

    // Send all push notifications in a single batch (avoid duplicates)
    if (allFcmTokens.length > 0) {
      const tokens = allFcmTokens.map((t) => t.token);
      console.log(`🚀 Sending batch push notification to ${tokens.length} devices for ${recipients.length} users`);

      await ctx.scheduler.runAfter(0, api.sendPushNotification.sendPushNotificationToMultipleUsers, {
        fcmTokens: tokens,
        title: title || "🔔 TechShirt Notification",
        body: message,
        data: {
          type: type || "notification",
        },
      });
    }

    return {
      success: true,
      totalRecipients: recipients.length,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
      results,
    };
  },
});

/**
 * Get all notifications for a user
 */
export const getUserNotifications = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    try {
      const notifications = await ctx.db
        .query("notifications")
        .filter((q: any) => q.eq(q.field("recipient_user_id"), userId))
        .order("desc")
        .collect();

      return notifications.map((n) => ({
        id: n._id,
        content: n.notif_content,
        createdAt: n.created_at,
        isRead: n.is_read || false,
        recipientType: n.recipient_user_type,
      }));
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  },
});

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    try {
      const notification = await ctx.db.get(notificationId);
      if (!notification) throw new Error("Notification not found");

      await ctx.db.patch(notificationId, { is_read: true });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    try {
      const notifications = await ctx.db
        .query("notifications")
        .filter((q: any) =>
          q.and(
            q.eq(q.field("recipient_user_id"), userId),
            q.eq(q.field("is_read"), false)
          )
        )
        .collect();

      for (const n of notifications) {
        await ctx.db.patch(n._id, { is_read: true });
      }

      return { success: true, count: notifications.length };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

/**
 * Delete a notification
 */
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    try {
      const notification = await ctx.db.get(notificationId);
      if (!notification) throw new Error("Notification not found");

      await ctx.db.delete(notificationId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
