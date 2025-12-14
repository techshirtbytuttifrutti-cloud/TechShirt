import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const saveFcmToken = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
  },
  handler: async (ctx, { userId, token }) => {
    // Convert Convex ID to string for storage
    const userIdStr = userId.toString();

    // Check if user already has ANY FCM token
    const existingToken = await ctx.db.query("fcmTokens")
      .withIndex("by_userId", (q: any) => q.eq("userId", userIdStr))
      .first();

    // Only insert if user doesn't already have a token
    if (!existingToken) {
      console.log(`💾 Saving FCM token for user ${userIdStr}`);
      await ctx.db.insert("fcmTokens", {
        userId: userIdStr,
        token,
      });
      console.log(`✅ FCM token saved successfully`);
      return { success: true, message: "FCM token saved" };
    } else {
      console.log(`⚠️ User ${userIdStr} already has an FCM token. Cannot create another one.`);
      return { success: false, message: "User already has an FCM token" };
    }
  },
});
