import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/* -------------------------------------------------
   BILLING BREAKDOWN (MULTI-SHIRT SUPPORT)
-------------------------------------------------- */
export const getBillingBreakdown = query({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    const billingDoc = await ctx.db
      .query("billing")
      .withIndex("by_design", (q) => q.eq("design_id", designId))
      .first();

    if (!billingDoc) {
      return {
        shirtCount: 0,
        printFee: 0,
        revisionFee: 0,
        designerFee: 0,
        total: 0,
      };
    }

    // Total shirts & printing cost from shirts[]
    const shirtCount = billingDoc.shirts.reduce(
      (sum, s) => sum + s.quantity,
      0
    );

    const printFee = billingDoc.shirts.reduce(
      (sum, s) => sum + s.total_price,
      0
    );

    return {
      shirtCount,
      printFee,
      revisionFee: billingDoc.revision_fee,
      designerFee: billingDoc.designer_fee,
      total: billingDoc.starting_amount,
    };
  },
});

/* -------------------------------------------------
   APPROVE BILL
-------------------------------------------------- */
export const approveBill = mutation({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    const billingDoc = await ctx.db
      .query("billing")
      .withIndex("by_design", (q) => q.eq("design_id", designId))
      .first();

    if (!billingDoc) {
      throw new Error("No billing record found for this design");
    }

    let finalAmount = billingDoc.final_amount;
    if (billingDoc.final_amount === 0) {

       finalAmount = billingDoc.starting_amount;
    }else{
       finalAmount = billingDoc.final_amount;
    }

    
    await ctx.db.patch(billingDoc._id, {
      status: "approved",
      final_amount: finalAmount,
      created_at: Date.now(),
    });

    return { success: true, billingId: billingDoc._id, finalAmount };
  },
});

/* -------------------------------------------------
   GET BILLING BY DESIGN
-------------------------------------------------- */
export const getBillingByDesign = query({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    const billingDoc = await ctx.db
      .query("billing")
      .withIndex("by_design", (q) => q.eq("design_id", designId))
      .first();

    if (!billingDoc) return null;

    // Invoice number
    const allBillings = await ctx.db.query("billing").collect();
    allBillings.sort((a, b) => a._creationTime - b._creationTime);
    const invoiceNo =
      allBillings.findIndex((b) => b._id === billingDoc._id) + 1;

    // Shirt totals
    const shirtCount = billingDoc.shirts.reduce(
      (sum, s) => sum + s.quantity,
      0
    );

    const printFee = billingDoc.shirts.reduce(
      (sum, s) => sum + s.total_price,
      0
    );

    return {
      ...billingDoc,
      createdAt: new Date(billingDoc._creationTime).toISOString(),
      invoiceNo,
      breakdown: {
        shirts: billingDoc.shirts, // ✅ expose full breakdown
        shirtCount,
        printFee,
        revisionFee: billingDoc.revision_fee,
        designerFee: billingDoc.designer_fee,
        total: billingDoc.starting_amount,
      },
    };
  },
});

/* -------------------------------------------------
   CLIENT INFO
-------------------------------------------------- */
export const getClientInfoByDesign = query({
  args: { designId: v.id("design") },
  handler: async (ctx, { designId }) => {
    const designDoc = await ctx.db.get(designId);
    if (!designDoc) return null;

    const userDoc = await ctx.db.get(designDoc.client_id);
    if (!userDoc) return null;

    const clientProfile = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("user_id", userDoc._id))
      .first();

    return {
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
      email: userDoc.email,
      phone: clientProfile?.phone ?? null,
      address: clientProfile?.address ?? null,
    };
  },
});

/* -------------------------------------------------
   NEGOTIATION (STORE DISCOUNT DELTA)
-------------------------------------------------- */
export const submitNegotiation = mutation({
  args: { designId: v.id("design"), newAmount: v.number() },
  handler: async (ctx, { designId, newAmount }) => {
    const billing = await ctx.db
      .query("billing")
      .withIndex("by_design", (q) => q.eq("design_id", designId))
      .first();

    if (!billing) throw new Error("Billing not found");

    const rounds = billing.negotiation_rounds ?? 0;
    if (rounds >= 5) {
      throw new Error("Maximum negotiation rounds reached (5).");
    }

    const identity = await ctx.auth.getUserIdentity();
    const userDoc = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
          .first()
      : null;

    // DISCOUNT = starting_amount - proposed final amount
    

    const newEntry = {
      amount: newAmount,
      date: Date.now(),
      added_by: userDoc?._id,
    };

    await ctx.db.patch(billing._id, {
      negotiation_history: billing.negotiation_history
        ? [...billing.negotiation_history, newEntry]
        : [newEntry],
      final_amount: 0,
      negotiation_rounds: rounds + 1,
      status: "pending",
    });

    return { success: true, negotiation: newEntry };
  },
});

/* -------------------------------------------------
   SET FINAL AMOUNT
-------------------------------------------------- */
export const UpdateFinalAmount = mutation({
  args: { billingId: v.id("billing"), finalAmount: v.number() },
  handler: async (ctx, { billingId, finalAmount }) => {
    const billing = await ctx.db.get(billingId);
    if (!billing) throw new Error("Billing not found");

    await ctx.db.patch(billingId, {
      final_amount: finalAmount,
      status: "billed",
    });

    return { success: true };
  },
});

/* -------------------------------------------------
   LIST ALL BILLINGS
-------------------------------------------------- */
export const listAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("billing").collect();
  },
});
