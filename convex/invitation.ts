import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const listInvites = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("revoked"),
        v.literal("accepted")
      )
    ),
  },
  handler: async (ctx, args) => {
    let invites = await ctx.db.query("invites").collect();

    // ✅ Filter (optional)
    if (args.status) {
      invites = invites.filter((i) => i.status === args.status);
    }

    // ✅ Sort newest → oldest
    invites.sort((a, b) => b.createdAt - a.createdAt);

    return invites;
  },
});


export const createInvite = mutation({
  args: {
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    invitedByUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, { email, token, expiresAt, invitedByUserId }) => {
    const inviteId = await ctx.db.insert("invites", {
      email,
      token,
      expiresAt,
      status: "pending",
      createdAt: Date.now(),
    });

    // Log history if admin is inviting
    if (invitedByUserId) {
     
      await ctx.runMutation(api.history.addHistory, {
        userId: invitedByUserId,
        userType: "admin",
        action: `Sent invitation to ${email}`,
        actionType: "invite",
        relatedId: inviteId,
        relatedType: "invite",
        details: {
          status: "pending",
          reason: `Invited ${email}`,
        },
      });
    }

    return inviteId;
  },
});

export const acceptInvite = mutation({
  args: {
    email: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { email, userId }) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_email", q => q.eq("email", email))
      .first();

    if (!invite) return;

    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedAt: Date.now(),
    });

    // Log history if user is provided
    if (userId) {
      const user = await ctx.db.get(userId);
      const userType = user?.role || "client";

      await ctx.runMutation(api.history.addHistory, {
        userId,
        userType: userType as "client" | "designer" | "admin",
        action: `Accepted invitation`,
        actionType: "invite",
        relatedId: invite._id,
        relatedType: "invite",
        details: {
          status: "accepted",
        },
      });
    }
  },
});

export const updateInviteStatus = mutation({
  args: {
    id: v.id("invites"),
    status: v.union(
      v.literal("pending"),
      v.literal("revoked"),
      v.literal("accepted")
    ),
    adminId: v.optional(v.id("users")),
  },
  handler: async (ctx, { id, status, adminId }) => {
    const invite = await ctx.db.get(id);
    if (!invite) throw new Error("Invite not found");

    await ctx.db.patch(id, { status });

    // Log history if admin is revoking or updating
    if (adminId && status === "revoked") {
      await ctx.runMutation(api.history.addHistory, {
        userId: adminId,
        userType: "admin",
        action: `Revoked invitation to ${invite.email}`,
        actionType: "invite",
        relatedId: id,
        relatedType: "invite",
        details: {
          status: "revoked",
          previousStatus: "pending",
        },
      });
    }
  },
});

