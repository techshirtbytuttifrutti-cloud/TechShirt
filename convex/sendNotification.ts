// convex/mutations/sendNotification.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const sendNotification = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, { userId, title, body }) => {
    // Add `any` type to avoid TS error for `q`
    const tokenEntry = await ctx.db.query("fcmTokens")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .unique();

    if (!tokenEntry) return;

    await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${process.env.FCM_SERVER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: tokenEntry.token,
        notification: { title, body },
      }),
    });
  },
});
