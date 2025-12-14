import { mutation, action, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const addOnsRequest = mutation({
  args: {
    designId: v.id("design"),
    userId: v.id("users"),
    addOnsType: v.union(
      v.literal("add_quantity"),
      v.literal("add_design"),
      v.literal("add_design_and_quantity")
    ),
    requestTitle: v.string(),
    reason: v.string(),
    price: v.number(),
    
  },

  handler: async (ctx, args) => {
    const {
      designId,
      userId,
      addOnsType,
      requestTitle,
      reason,
      price
    } = args;

    // ---------------------------
    // 1. Determine status & type
    // ---------------------------
    let newStatus: "in_production" | "in_progress";
    let type: "design" | "quantity" | "designAndQuantity";

    if (addOnsType === "add_quantity") {
      type = "quantity";
      newStatus = "in_production";
    } else if (addOnsType === "add_design") {
      type = "design";
      newStatus = "in_progress";
    } else {
      type = "designAndQuantity";
      newStatus = "in_progress";
    }

    // ---------------------------
    // 2. Update Design Status
    // ---------------------------
    await ctx.db.patch(designId, {
      status: newStatus,
    });

    // ---------------------------
    // 3. INSERT INTO addOns TABLE
    // ---------------------------
    const addOnsId = await ctx.db.insert("addOns", {
      userId,
      designId,
      status: "pending",
      reason,
      type,
      fee: 0,
      price,
      created_at: Date.now(),
    });

    // ---------------------------
    // 4. Notify All Admins
    // ---------------------------
    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();

    const recipients = admins.map((admin) => ({
      userId: admin._id,
      userType: "admin" as const,
    }));

    const client = await ctx.db.get(userId);
    const clientName = client
      ? `${client.firstName} ${client.lastName}`
      : "A client";

    await ctx.runMutation(api.notifications.createNotificationForMultipleUsers, {
      recipients,
      message: `${clientName} submitted a request for (${type}): "${requestTitle}". Reason: ${reason}`,
    });

    // ---------------------------
    // 5. IMPORTANT:
    // Return addOnsId so images can be uploaded
    // ONLY for add_design & add_design_and_quantity
    // ---------------------------
    if (type === "design" || type === "designAndQuantity") {
      return { addOnsId };
    }

    return { addOnsId: null };
  },
});

export const addAddOnsImage = mutation({
  args: { addOnsId: v.id("addOns"), image: v.id("_storage") },
  handler: async (ctx, { addOnsId, image }) => {
    const now = Date.now();
    return await ctx.db.insert("addOnsImages", {
      addOnsId,
      image,
      created_at: now,
    });
  },
});

// DO NOT TOUCH — follows your required syntax
export const saveAddOnsImage = action({
  args: { galleryId: v.id("addOns"), image: v.bytes() },
  handler: async (ctx, { image }) => {
    const blob = new Blob([new Uint8Array(image)], { type: "image/png" });
    const storageId = await ctx.storage.store(blob);
    return storageId;
  },
});

export const submitAddOns = mutation({
  args: {
    designId: v.id("design"),
    userId: v.id("users"),
    addOnType: v.union(
      v.literal("design"),
      v.literal("quantity"),
      v.literal("both")
    ),
    reason: v.string(),
    sizeUpdates: v.array(
      v.object({
        sizeId: v.id("shirt_sizes"),
        quantity: v.number(),
      })
    ),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
  },

  handler: async (ctx, args) => {
    const {
      designId,
      userId,
      addOnType,
      reason,
      sizeUpdates,
      imageStorageIds,
    } = args;

    // Determine type for database
    let dbType: "design" | "quantity" | "designAndQuantity";
    if (addOnType === "both") {
      dbType = "designAndQuantity";
    } else {
      dbType = addOnType;
    }

    // Create add-ons record
    const addOnsId = await ctx.db.insert("addOns", {
      userId,
      designId,
      status: "pending",
      reason,
      type: dbType,
      fee: 0,
      price: 0, // Default price, can be updated by admins
      created_at: Date.now(),
    });

    // Insert size updates if provided
    if (sizeUpdates && sizeUpdates.length > 0) {
      for (const sizeUpdate of sizeUpdates) {
        await ctx.db.insert("addOnsSizes", {
          addOnsId,
          sizeId: sizeUpdate.sizeId,
          quantity: sizeUpdate.quantity,
          created_at: Date.now(),
        });
      }
    }

    // Insert images if provided
    if (imageStorageIds && imageStorageIds.length > 0) {
      for (const imageId of imageStorageIds) {
        await ctx.db.insert("addOnsImages", {
          addOnsId,
          image: imageId,
          created_at: Date.now(),
        });
      }
    }

    // Notify all admins
    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();

    const recipients = admins.map((admin) => ({
      userId: admin._id,
      userType: "admin" as const,
    }));

    const client = await ctx.db.get(userId);
    const clientName = client
      ? `${client.firstName} ${client.lastName}`
      : "A client";

    const typeLabel = dbType === "designAndQuantity" 
      ? "design and quantity" 
      : dbType;

    await ctx.runMutation(api.notifications.createNotificationForMultipleUsers, {
      recipients,
      message: `${clientName} submitted ${typeLabel} add-ons for design #${designId}. Reason: ${reason}`,
    });

    // Log history for client
    await ctx.runMutation(api.history.addHistory, {
      userId,
      userType: "client",
      action: `Submitted ${typeLabel} add-ons request`,
      actionType: "addon_request",
      relatedId: addOnsId,
      relatedType: "addon",
      details: {
        status: "pending",
        reason,
      },
    });

    return { addOnsId };
  },
});

export const updateAddOnsStatus = mutation({
  args: {
    addOnsId: v.id("addOns"),
    status: v.union(v.literal("approved"), v.literal("declined"), v.literal("cancelled")),
    fee: v.number(),
    adminReason: v.optional(v.string()),
    adminId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const { addOnsId, status, fee, adminId, adminReason } = args;

    const addOns = await ctx.db.get(addOnsId);
    if (!addOns) throw new Error("Add-ons request not found.");

    // Calculate quantity-based pricing for "quantity" and "designAndQuantity" types
    let quantityPrice = 0;
    if ((addOns.type === "quantity" || addOns.type === "designAndQuantity") && status === "approved") {
      // Get add-on sizes
      const addOnSizes = await ctx.db
        .query("addOnsSizes")
        .filter((q) => q.eq(q.field("addOnsId"), addOnsId))
        .collect();

      // Get print pricing data
      const printPricing = await ctx.db.query("print_pricing").collect();

      // Create price map: sizeId -> price
      const priceMap: Record<string, number> = {};
      printPricing.forEach((p) => {
        priceMap[p.size as string] = p.amount;
      });

      // Calculate total quantity price
      quantityPrice = addOnSizes.reduce((total, s) => {
        const unitPrice = priceMap[s.sizeId as string] || 0;
        return total + unitPrice * s.quantity;
      }, 0);
    }

    // Patch add-ons status and price
    await ctx.db.patch(addOnsId, {
      status,
      price: fee,
      updated_at: Date.now(),
    });

    // Notify client
    const adminUser = await ctx.db.get(adminId);

    const adminName = adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : "An admin";

    const message =
      status === "approved"
        ? `${adminName} approved your add-ons request (${addOns.type}).`
        : `${adminName} declined your add-ons request (${addOns.type}). Reason: ${adminReason || "No reason provided"}`;

    await ctx.runMutation(api.notifications.createNotification, {
      userId: addOns.userId,
      userType: "client",
      message,
    });

    // Log history for admin approving/declining
    await ctx.runMutation(api.history.addHistory, {
      userId: adminId,
      userType: "admin",
      action: `${status === "approved" ? "Approved" : "Declined"} add-ons request (${addOns.type})`,
      actionType: "addon_approval",
      relatedId: addOnsId,
      relatedType: "addon",
      details: {
        status,
        previousStatus: "pending",
        reason: adminReason,
        amount: fee,
      },
    });

    // Log history for client seeing the approval/decline
    await ctx.runMutation(api.history.addHistory, {
      userId: addOns.userId,
      userType: "client",
      action: `Your add-ons request was ${status}${status === "declined" ? ` (Reason: ${adminReason || "No reason provided"})` : ""}`,
      actionType: "addon_approval",
      relatedId: addOnsId,
      relatedType: "addon",
      details: {
        status,
        previousStatus: "pending",
        reason: adminReason,
        amount: fee,
      },
    });

    // Update billing if approved
    if (status === "approved") {
      const design = await ctx.db.get(addOns.designId);
      if (!design) throw new Error("Design not found.");

      // Get or create billing record
      const billing = await ctx.db
        .query("billing")
        .withIndex("by_design", (q) => q.eq("design_id", addOns.designId))
        .first();

      if (billing) {
        // Update existing billing with add-ons pricing
        const newAddonsShirtPrice = (billing.addons_shirt_price || 0) + quantityPrice;
        const newAddonsFee = (billing.addons_fee || 0) + fee;
        const newFinalAmount = billing.final_amount + quantityPrice + fee;

        await ctx.db.patch(billing._id, {
          addons_shirt_price: newAddonsShirtPrice,
          addons_fee: newAddonsFee,
          final_amount: newFinalAmount,
        });
      }

      // Update design status based on add-on type
      type DesignStatus =
        | "approved"
        | "in_progress"
        | "pending_revision"
        | "in_production"
        | "pending_pickup"
        | "completed";

      let newDesignStatus: DesignStatus | undefined;

      const quantityStatusesNoChange: DesignStatus[] = ["in_progress", "pending_revision", "approved"];
      const revertToProductionStatuses: DesignStatus[] = ["completed", "pending_pickup"];

      if (addOns.type === "quantity") {
        if (revertToProductionStatuses.includes(design.status as DesignStatus)) {
          newDesignStatus = "in_production";
        } else if (!quantityStatusesNoChange.includes(design.status as DesignStatus)) {
          newDesignStatus = design.status as DesignStatus;
        }
      } else if (addOns.type === "design" || addOns.type === "designAndQuantity") {
        newDesignStatus = "in_progress";
      }

      if (newDesignStatus && newDesignStatus !== design.status) {
        await ctx.db.patch(addOns.designId, {
          status: newDesignStatus,
        });
      }
    }
  },
});


export const getAllPendingAddOns = query({
  args: {},
  handler: async (ctx) => {
    const addOns = await ctx.db
      .query("addOns")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    return addOns;
  },
});


export const getAddOnsImages = query({
  args: { addOnsId: v.id("addOns") },
  handler: async (ctx, { addOnsId }) => {
    const images = await ctx.db
      .query("addOnsImages")
      .filter((q) => q.eq(q.field("addOnsId"), addOnsId))
      .collect();

    return images.map((i) => i.image);
  },
});


export const listByDesign = query({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    return await ctx.db
      .query("addOns")
      .filter((q) => q.eq(q.field("designId"), designId))
      .order("desc")
      .collect();
  },
});


export const cancelAddOn = mutation({
  args: { addOnsId: v.id("addOns") },
  handler: async (ctx, { addOnsId }) => {
    await ctx.db.patch(addOnsId, { status: "cancelled" });
    return true;
  },
});