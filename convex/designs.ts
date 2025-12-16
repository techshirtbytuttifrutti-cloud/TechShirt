import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
// Get all designs
export const listAllDesigns = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("design").collect();
  },
});

// Get designs by client
export const getDesignsByClient = query({
  args: { clientId: v.id("users") },
  handler: async (ctx, { clientId }) => {
    return await ctx.db
      .query("design")
      .filter((q) => q.eq(q.field("client_id"), clientId))
      .collect();
  },
});

export const getDesignsByDesigner = query({
  args: { designerId: v.id("users") },
  handler: async (ctx, { designerId }) => {
    return await ctx.db
      .query("design")
      .filter((q) => q.eq(q.field("designer_id"), designerId))
      .collect();
  },
});

export const getDesignByRequestId = query({
  args: { requestId: v.id("design_requests") },
  handler: async (ctx, { requestId }) => {
    return await ctx.db
      .query("design")
      .withIndex("by_request", (q) => q.eq("request_id", requestId))
      .first();
  },
});

export const getById = query({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    return await ctx.db.get(designId);
  },
});


export const approveDesign = mutation({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");

    const request = await ctx.db.get(design.request_id);
    if (!request) throw new Error("Design request not found");

    if (!request.print_type) throw new Error("Print type not set on request");
    if (!request.tshirt_type) throw new Error("Tshirt type not set on request");

    const revisionCount = design.revision_count ?? 0;

    const requestSizes = await ctx.db
      .query("request_sizes")
      .withIndex("by_request", (q) => q.eq("request_id", design.request_id))
      .collect();

    if (!requestSizes.length) throw new Error("No shirt sizes found for request");

    const normalizedType = request.tshirt_type.trim();
    const shirtTypeDoc = await ctx.db
      .query("shirt_types")
      .filter((q) => q.eq(q.field("type_name"), normalizedType))
      .first();

    if (!shirtTypeDoc) throw new Error(`Shirt type "${normalizedType}" not found`);

    const allPricing = await ctx.db.query("print_pricing").collect();

    // --- Get default pricing for fallback ---
    const defaultPricing = allPricing.find((p) => p.print_id === "default");

    if (!defaultPricing) throw new Error("Default print pricing not set");

    const shirts = [];
    let shirtsTotal = 0;
    let shirtCount = 0;

    for (const rs of requestSizes) {
      let pricing = allPricing.find(
        (p) =>
          p.print_type === request.print_type &&
          p.size === rs.size_id &&
          p.shirt_type === shirtTypeDoc._id
      );

      // Use default if no pricing found or pricing amount is 0
      if (!pricing || pricing.amount === 0) {
        pricing = defaultPricing;
      }

      const totalPrice = pricing.amount * rs.quantity;

      shirts.push({
        shirt_type_id: shirtTypeDoc._id,
        size_id: rs.size_id,
        quantity: rs.quantity,
        unit_price: pricing.amount,
        total_price: totalPrice,
      });

      shirtsTotal += totalPrice;
      shirtCount += rs.quantity;
    }

    const designerProfile = await ctx.db
      .query("designers")
      .withIndex("by_user", (q) => q.eq("user_id", design.designer_id))
      .unique();

    if (!designerProfile) throw new Error("Designer profile not found");

    const pricing =
      (await ctx.db
        .query("designer_pricing")
        .withIndex("by_designer", (q) =>
          q.eq("designer_id", designerProfile._id)
        )
        .first()) ??
      (await ctx.db
        .query("designer_pricing")
        .withIndex("by_designer", (q) => q.eq("designer_id", "default"))
        .first());

    if (!pricing) throw new Error("Designer pricing not found");

    const baseDesignerFee = pricing.normal_amount ?? 0;
    const revisionFeeUnit = pricing.revision_fee ?? 0;

    const designerFee = shirtCount <= 15 ? baseDesignerFee : 0;

    const revisionFee =
      shirtCount >= 15
        ? revisionCount > 2
          ? (revisionCount - 2) * revisionFeeUnit
          : 0
        : revisionCount * revisionFeeUnit;

    const startingAmount =
      shirtsTotal + revisionFee + (shirtCount <= 15 ? designerFee : 0);

    await ctx.db.patch(designId, { status: "approved" });

    const existingBilling = await ctx.db
      .query("billing")
      .withIndex("by_design", (q) => q.eq("design_id", designId))
      .first();

    if (!existingBilling) {
      await ctx.db.insert("billing", {
        shirts,
        revision_fee: revisionFee,
        designer_fee: designerFee,
        starting_amount: startingAmount,
        final_amount: 0,
        negotiation_history: [],
        negotiation_rounds: 0,
        status: "pending",
        client_id: design.client_id,
        designer_id: design.designer_id,
        design_id: designId,
        created_at: Date.now(),
      });
    }

    await ctx.runMutation(api.notifications.createNotification, {
      userId: design.designer_id,
      userType: "designer",
      title: "Design Approved",
      message: `Your design for "${request.request_title}" has been approved.`,
      type: "design_approved",
    });

    await ctx.runMutation(api.history.addHistory, {
      userId: design.client_id,
      userType: "client",
      action: `Approved design for "${request.request_title}"`,
      actionType: "design_approval",
      relatedId: designId,
      relatedType: "design",
      details: {
        status: "approved",
        amount: startingAmount,
      },
    });

    return { success: true, startingAmount };
  },
});


export const reviseDesign = mutation({
  args: { designId: v.id("design") }, // ✅ singular, matches schema
  handler: async (ctx, { designId }) => {
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");

    // Ensure revision_count exists
    const revisionCount = (design.revision_count ?? 0) + 1;

    // 1. Update the design
    await ctx.db.patch(designId, {
      status: "pending_revision",
      revision_count: revisionCount,
    });

    // 2. Send notification to designer
    if (design.designer_id) {
      const request = await ctx.db.get(design.request_id);
      await ctx.runMutation(api.notifications.createNotification, {
        userId: design.designer_id,
        userType: "designer",
        title: "Revision Requested",
        message: `A revision has been requested for the design "${request?.request_title || "Untitled"}"`,
        type: "revision_requested",
      });

      // Log history for client requesting revision
      await ctx.runMutation(api.history.addHistory, {
        userId: design.client_id,
        userType: "client",
        action: `Requested revision for design "${request?.request_title || "Untitled"}"`,
        actionType: "update",
        relatedId: designId,
        relatedType: "design",
        details: {
          status: "pending_revision",
          previousStatus: "in_progress",
          reason: `Revision #${revisionCount}`,
        },
      });

      // Log history for designer seeing revision request
      await ctx.runMutation(api.history.addHistory, {
        userId: design.designer_id,
        userType: "designer",
        action: `Design revision requested: "${request?.request_title || "Untitled"}"`,
        actionType: "update",
        relatedId: designId,
        relatedType: "design",
        details: {
          status: "pending_revision",
          previousStatus: "in_progress",
          reason: `Revision #${revisionCount}`,
        },
      });
    }

    return { success: true };
  },
});





export const getDesignWithRequest = query({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    const design = await ctx.db.get(designId);
    if (!design) return null;

    // --- Get linked request
    const request = await ctx.db.get(design.request_id);

    // --- Get client user
    let client = null;
    if (design.client_id) {
      client = await ctx.db.get(design.client_id);
    }

    // --- Get selected colors
        const colors = request
      ? await ctx.db
          .query("selected_colors")
          .filter((q) => q.eq(q.field("request_id"), request._id))
          .collect()
      : [];

    // --- Get sizes (join request_sizes -> shirt_sizes)
    let sizes: { size_label: string; quantity: number }[] = [];
    if (request) {
      const reqSizes = await ctx.db
        .query("request_sizes")
        .withIndex("by_request" as any, (q) =>
          q.eq("request_id" as any, request._id)
        )
        .collect();

      sizes = await Promise.all(
        reqSizes.map(async (rs) => {
          const size = await ctx.db.get(rs.size_id);
          return size
            ? { size_label: size.size_label, quantity: rs.quantity }
            : null;
        })
      ).then((res) =>
        res.filter(
          (r): r is { size_label: string; quantity: number } => r !== null
        )
      );
    }

    return {
      request,
      client,
      status: design.status,
      created_at: design.created_at,
      colors,
      sizes,
    };
  },
});

// Get full design details (design + request + client + designer + sizes + colors)
export const getFullDesignDetails = query({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    const design = await ctx.db.get(designId);
    if (!design) return null;

    // --- Linked request ---
    const request = await ctx.db.get(design.request_id);

    // --- Client ---
    const client = design.client_id
      ? await ctx.db.get(design.client_id)
      : null;
    const fabric = request 
    ? await ctx.db.get(request.textile_id) 
    : null;
    // --- Designer ---
    const designer = design.designer_id
      ? await ctx.db.get(design.designer_id)
      : null;

    // --- Selected colors ---
    const colors = request
      ? await ctx.db
          .query("selected_colors")
          .filter((q) => q.eq(q.field("request_id"), request._id))
          .collect()
      : [];

    // --- Sizes (join request_sizes -> shirt_sizes) ---
    let sizes: { size_label: string; quantity: number }[] = [];
    if (request) {
      const reqSizes = await ctx.db
        .query("request_sizes")
        .withIndex("by_request", (q) => q.eq("request_id", request._id))
        .collect();

      sizes = await Promise.all(
        reqSizes.map(async (rs) => {
          const size = await ctx.db.get(rs.size_id);
          return size
            ? { size_label: size.size_label, quantity: rs.quantity }
            : null;
        })
      ).then((res) =>
        res.filter(
          (r): r is { size_label: string; quantity: number } => r !== null
        )
      );
    }

    return {
      design,
      request,
      client,
      fabric,
      designer,
      colors,
      sizes,
    };
  },
});

export const markAsInProduction = mutation({
  args: { designId: v.id("design"), userId: v.id("users") },
  handler: async (ctx, { designId }) => {

    const notifyUsers = async (requestTitle: string, userIds: Id<"users">[]) => {
      for (const uid of userIds) {
        await ctx.runMutation(api.notifications.createNotification, {
          userId: uid,
          userType: "client",
          title: "Production Started",
          message: `Production for your order "${requestTitle}" has now been started`,
          type: "production_started",
        });
      }
    };

     const notifyAdmin = async (requestTitle: string) => {
      const admins = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "admin"))
        .collect();

      if (admins.length > 0) {
        const adminRecipients = admins.map((admin) => ({
          userId: admin._id,
          userType: "admin" as const,
        }));

        await ctx.runMutation(api.notifications.createNotificationForMultipleUsers, {
          recipients: adminRecipients,
          title: "Production Started",
          message: `Production for order "${requestTitle}" has been started.`,
          type: "production_started_admin",
        });
      }
    };


    // 1. Get the design
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");

    // 2. Get the associated request
    const request = await ctx.db.get(design.request_id);
    if (!request) throw new Error("Request not found");
    if (!request.textile_id) throw new Error("No fabric selected for this request");

    

    // 9. Update fabric stock
    // 10. Notify client
    await notifyUsers(request.request_title, [request.client_id]);
    await notifyAdmin(request.request_title);

    // 11. Mark design as finished
    await ctx.db.patch(designId, { status: "in_production", created_at: Date.now() });

    // Log history for admin marking as in production
    const adminRecord = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    
    if (adminRecord) {
      await ctx.runMutation(api.history.addHistory, {
        userId: adminRecord._id,
        userType: "admin",
        action: `Marked design "${request.request_title}" as in production`,
        actionType: "update",
        relatedId: designId,
        relatedType: "design",
        details: {
          status: "in_production",
          previousStatus: "approved",
        },
      });
    }

    return {
      success: true,
    };
  },
});

export const markAsCompleted = mutation({
  args: { designId: v.id("design"), userId: v.id("users") },
  handler: async (ctx, { designId }) => {

    // --- Helper function to notify clients ---
    const notifyUsers = async (requestTitle: string, userIds: Id<"users">[]) => {
      for (const uid of userIds) {
        await ctx.runMutation(api.notifications.createNotification, {
          userId: uid,
          userType: "client",
          title: "Order Completed",
          message: `Order completed for "${requestTitle}". Thank you for your business!`,
          type: "order_completed",
        });
      }
    };

    // --- Helper function to notify admin and designer ---
    const notifyAdminAndDesigner = async (requestTitle: string, designerId: Id<"users">) => {
      const admins = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "admin"))
        .collect();

      const recipients = [
        ...admins.map((admin) => ({
          userId: admin._id,
          userType: "admin" as const,
        })),
        {
          userId: designerId,
          userType: "designer" as const,
        },
      ];

      if (recipients.length > 0) {
        await ctx.runMutation(api.notifications.createNotificationForMultipleUsers, {
          recipients,
          title: "Order Completed",
          message: `Order "${requestTitle}" has been completed.`,
          type: "order_completed_admin_designer",
        });
      }
    };


    // 1. Get the design
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");

    // 2. Get the associated request
    const request = await ctx.db.get(design.request_id);
    if (!request) throw new Error("Request not found");

    await notifyAdminAndDesigner(request.request_title, design.designer_id);

    // 10. Notify client
    await notifyUsers(request.request_title, [request.client_id]);

    // 11. Mark design as finished
    await ctx.db.patch(designId, { status: "completed", created_at: Date.now() });

    // Log history for admin marking as completed
    const adminRecord = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    
    if (adminRecord) {
      await ctx.runMutation(api.history.addHistory, {
        userId: adminRecord._id,
        userType: "admin",
        action: `Marked design "${request.request_title}" as completed`,
        actionType: "update",
        relatedId: designId,
        relatedType: "design",
        details: {
          status: "completed",
          previousStatus: "in_production",
        },
      });
    }

    return {
      success: true,
    };
  },
});

export const pendingPickup = mutation({
  args: { designId: v.id("design"), userId: v.id("users") },
  handler: async (ctx, { designId }) => {

    // --- Helper function to notify clients ---
    const notifyUsers = async (requestTitle: string, userIds: Id<"users">[]) => {
      for (const uid of userIds) {
        await ctx.runMutation(api.notifications.createNotification, {
          userId: uid,
          userType: "client",
          title: "Ready for Pickup",
          message: `Production for your order "${requestTitle}" is finished. You can now proceed to payment and pick up your order.`,
          type: "ready_for_pickup",
        });
      }
    };

    // --- Helper function to notify admin of restock needs ---


    // 1. Get the design
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");

    // 2. Get the associated request
    const request = await ctx.db.get(design.request_id);
    if (!request) throw new Error("Request not found");
    // 10. Notify client
    await notifyUsers(request.request_title, [request.client_id]);

    // 11. Mark design as finished
    await ctx.db.patch(designId, { status: "pending_pickup", created_at: Date.now() });

    // Log history for admin marking as pending pickup
    const adminRecord = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    
    if (adminRecord) {
      await ctx.runMutation(api.history.addHistory, {
        userId: adminRecord._id,
        userType: "admin",
        action: `Marked design "${request.request_title}" as pending pickup`,
        actionType: "update",
        relatedId: designId,
        relatedType: "design",
        details: {
          status: "pending_pickup",
          previousStatus: "completed",
        },
      });
    }

    return {
      success: true,
    };
  },
});


export const updateStatus = mutation({
  args: {
    designId: v.id("design"),
    status: v.union(
      v.literal("approved"),
      v.literal("in_progress"),
      v.literal("pending_revision"),
      v.literal("in_production"),
      v.literal("pending_pickup"),
      v.literal("completed")
    ),
    adminId: v.optional(v.id("users")),
  },
  handler: async (ctx, { designId, status, adminId }) => {
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");

    const previousStatus = design.status;

    await ctx.db.patch(designId, { status, created_at: Date.now() });

    // Log history if admin is provided
    if (adminId) {
      const request = await ctx.db.get(design.request_id);
      const requestTitle = request?.request_title || "Unknown Design";

      await ctx.runMutation(api.history.addHistory, {
        userId: adminId,
        userType: "admin",
        action: `Updated design status to ${status}`,
        actionType: "update",
        relatedId: designId,
        relatedType: "design",
        details: {
          status,
          previousStatus,
          reason: `Design "${requestTitle}"`,
        },
      });
    }

    return { success: true };
  },
});


// convex/design.ts
export const fetchAllDesigns = query({
  handler: async (ctx) => {
    const designs = await ctx.db.query("design").collect();
    return await Promise.all(designs.map(async (design) => {
      const designer = design.designer_id
        ? await ctx.db.get(design.designer_id)
        : null;
      return { ...design, designer };
    }));
  },
});

// Get add-ons sizes for a specific add-ons request
export const getAddOnsSizes = query({
  args: { addOnsId: v.id("addOns") },
  handler: async (ctx, { addOnsId }) => {
    return await ctx.db
      .query("addOnsSizes")
      .withIndex("by_addOns", (q) => q.eq("addOnsId", addOnsId))
      .collect();
  },
});
