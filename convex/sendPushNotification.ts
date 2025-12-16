"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import axios from "axios";
import * as jwt from "jsonwebtoken";

/**
 * Get access token from Firebase service account
 */
async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 3600; // 1 hour

  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + expiresIn,
    iat: now,
  };

  // Sign the JWT with the private key
  const token = jwt.sign(payload, serviceAccount.private_key, {
    algorithm: "RS256",
  });

  // Exchange JWT for access token
  const response = await axios.post("https://oauth2.googleapis.com/token", {
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: token,
  });

  return response.data.access_token;
}

/**
 * Send a push notification via Firebase Cloud Messaging (FCM)
 * This action sends a notification to a specific FCM token
 */
export const sendPushNotification = action({
  args: {
    fcmToken: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.object({
      notificationId: v.optional(v.string()),
      userId: v.optional(v.string()),
      type: v.optional(v.string()),
    })),
  },
  handler: async (_ctx, { fcmToken, title, body, data }) => {
    try {
      const serverKeyJson = process.env.FIREBASE_SERVER_KEY;

      console.log("🔍 Checking FIREBASE_SERVER_KEY...");

      if (!serverKeyJson) {
        console.error("❌ FIREBASE_SERVER_KEY not found in environment");
        throw new Error("FIREBASE_SERVER_KEY is not configured. Please add it to .env.local and restart the dev server.");
      }

      console.log("✅ FIREBASE_SERVER_KEY found in environment");

      // Parse the service account JSON
      let serviceAccount: any;
      try {
        serviceAccount = JSON.parse(serverKeyJson);
      } catch (e) {
        throw new Error("FIREBASE_SERVER_KEY is not valid JSON");
      }

      // Get access token using service account
      const accessToken = await getAccessToken(serviceAccount);

      const message = {
        webpush: {
          notification: {
            title,
            body,
            icon: "https://techshirt.app/logo192.png",
            badge: "https://techshirt.vercel.app/logo192.png",
            tag: data?.type || "notification",
            requireInteraction: false,
            vibrate: [200, 100, 200],
            actions: [
              {
                action: "open",
                title: "Open",
              },
              {
                action: "close",
                title: "Close",
              },
            ],
          },
          fcmOptions: {
            link: "https://techshirt.app/notifications",
          },
        },
        data: data || {},
        token: fcmToken,
      };

      // Send via Firebase Cloud Messaging REST API v1
      const response = await axios.post(
        "https://fcm.googleapis.com/v1/projects/techshirt-32583/messages:send",
        { message },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Push notification sent successfully:", response.data);
      return { success: true, messageId: response.data.name };
    } catch (error: any) {
      console.error("❌ Error sending push notification:", error.message);
      return {
        success: false,
        error: error.message || "Failed to send push notification"
      };
    }
  },
});

/**
 * Send push notifications to multiple users
 */
export const sendPushNotificationToMultipleUsers = action({
  args: {
    fcmTokens: v.array(v.string()),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.object({
      notificationId: v.optional(v.string()),
      userId: v.optional(v.string()),
      type: v.optional(v.string()),
    })),
  },
  handler: async (_ctx, { fcmTokens, title, body, data }) => {
    const results = [];

    const serverKeyJson = process.env.FIREBASE_SERVER_KEY;

    console.log("🔍 Checking FIREBASE_SERVER_KEY...");
    console.log("Env vars available:", Object.keys(process.env).filter(k => k.includes("FIREBASE") || k.includes("firebase")).length);

    if (!serverKeyJson) {
      console.error("❌ FIREBASE_SERVER_KEY not found in environment");
      console.error("Available env keys:", Object.keys(process.env).slice(0, 10));
      throw new Error("FIREBASE_SERVER_KEY is not configured. Please add it to .env.local and restart the dev server.");
    }

    console.log("✅ FIREBASE_SERVER_KEY found in environment");

    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(serverKeyJson);
    } catch (e) {
      throw new Error("FIREBASE_SERVER_KEY is not valid JSON");
    }

    const accessToken = await getAccessToken(serviceAccount);

    for (const token of fcmTokens) {
      try {
        const message = {
          webpush: {
            notification: {
              title,
              body,
              icon: "https://techshirt.vercel.app/logo192.png",
              badge: "https://techshirt.vercel.app/logo192.png",
              tag: data?.type || "notification",
              requireInteraction: false,
              vibrate: [200, 100, 200],
              actions: [
                {
                  action: "open",
                  title: "Open",
                },
                {
                  action: "close",
                  title: "Close",
                },
              ],
            },
            fcmOptions: {
              link: "https://techshirt.vercel.app/notifications",
            },
          },
          data: data || {},
          token,
        };

        // Send via Firebase Cloud Messaging REST API v1
        const response = await axios.post(
          "https://fcm.googleapis.com/v1/projects/techshirt-32583/messages:send",
          { message },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        results.push({
          token,
          success: true,
          messageId: response.data.name
        });
      } catch (error: any) {
        results.push({
          token,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return {
      success: true,
      totalTokens: fcmTokens.length,
      successCount,
      failureCount,
      results,
    };
  },
});

