import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all history records for a user, newest first
 */
export const getHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const docs = await ctx.db
      .query("history")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .collect();

    return docs.sort((a, b) => b.timestamp - a.timestamp);
  },
});

/**
 * Get history by action type
 */
export const getHistoryByActionType = query({
  args: { userType: v.union(v.literal("client"), v.literal("designer"), v.literal("admin")) },
  handler: async (ctx, { userType }) => {
    const docs = await ctx.db
      .query("history")
      .withIndex("by_user_type", (q) => q.eq("userType", userType))
      .collect();

    return docs.sort((a, b) => b.timestamp - a.timestamp);
  },
});

/**
 * Get all history for a specific related entity (e.g., all updates for a design)
 */
export const getHistoryByRelated = query({
  args: { relatedId: v.string() },
  handler: async (ctx, { relatedId }) => {
    const docs = await ctx.db
      .query("history")
      .filter((q) => q.eq(q.field("relatedId"), relatedId))
      .collect();

    return docs.sort((a, b) => b.timestamp - a.timestamp);
  },
});

/**
 * Internal function to log history - called by mutations
 */

export const addHistory = mutation({
  args: {
    userId: v.id("users"),
    userType: v.union(v.literal("client"), v.literal("designer"), v.literal("admin")),
    action: v.string(),
    actionType: v.union(
      v.literal("submit"),
      v.literal("approve"),
      v.literal("decline"),
      v.literal("assign"),
      v.literal("update"),
      v.literal("post"),
      v.literal("comment"),
      v.literal("invite"),
      v.literal("design_approval"),
      v.literal("design_request"),
      v.literal("addon_request"),
      v.literal("addon_approval")
    ),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
    details: v.optional(v.object({
      status: v.optional(v.string()),
      previousStatus: v.optional(v.string()),
      reason: v.optional(v.string()),
      amount: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("history", {
      user_id: args.userId,
      userType: args.userType,
      action: args.action,
      actionType: args.actionType,
      relatedId: args.relatedId,
      relatedType: args.relatedType,
      details: args.details,
      timestamp: Date.now(),
    });
  },
});
