import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/* ================================
   GET ALL SHIRT SIZES
================================ */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("shirt_sizes").collect();
  },
});

/* ================================
   GET BY ID
================================ */
export const getById = query({
  args: { id: v.id("shirt_sizes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/* ================================
   GET BY SHIRT TYPE (NOW ID)
================================ */
export const getByType = query({
  args: { typeId: v.id("shirt_types") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("shirt_sizes")
      .filter(q => q.eq(q.field("type"), args.typeId))
      .collect();
  },
});

/* ================================
   GET BY CATEGORY (kids | adult)
================================ */
export const getByCategory = query({
  args: {
    category: v.union(
      v.literal("kids"),
      v.literal("adult")
    )
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("shirt_sizes")
      .filter(q => q.eq(q.field("category"), args.category))
      .collect();
  },
});

/* ================================
   CREATE SIZE
================================ */
export const create =  mutation({
  args: {
    type: v.id("shirt_types"),
    size_label: v.string(),
    w: v.number(),
    h: v.number(),
    sleeves_w: v.optional(v.number()),
    sleeves_h: v.optional(v.number()),
    category: v.union(v.literal("kids"), v.literal("adult")),

    // default amount per print type
    default_amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const {
      default_amount = 0,
      ...sizeData
    } = args;

    /* 1️⃣ Create shirt size */
    const sizeId = await ctx.db.insert("shirt_sizes", {
      ...sizeData,
      created_at: Date.now(),
    });

    /* 2️⃣ Get all print definitions */
    const prints = await ctx.db
      .query("prints")
      .collect();

    /* 3️⃣ Create pricing per print */
    for (const print of prints) {
      await ctx.db.insert("print_pricing", {
        print_id: print._id,
        print_type: print.print_type ?? "default", // assumes `type` exists in prints table
        amount: default_amount,
        description: `Auto-created pricing for ${sizeData.size_label}`,
        shirt_type: args.type,
        size: sizeId,
        created_at: Date.now(),
      });
    }

    return {
      sizeId,
      pricingCreated: prints.length,
    };
  },
});

/* ================================
   UPDATE SIZE
================================ */
export const update = mutation({
  args: {
    id: v.id("shirt_sizes"),
    type: v.optional(v.id("shirt_types")), // ✅ now ID
    size_label: v.optional(v.string()),
    w: v.optional(v.number()),
    h: v.optional(v.number()),
    sleeves_w: v.optional(v.number()),
    sleeves_h: v.optional(v.number()),
    category: v.optional(
      v.union(v.literal("kids"), v.literal("adult"))
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Shirt size not found");

    await ctx.db.patch(id, updates);
    return id;
  },
});

/* ================================
   DELETE SIZE
================================ */
export const remove = mutation({
  args: { id: v.id("shirt_sizes") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Shirt size not found");

    // Prevent deleting used size
    const used = await ctx.db
      .query("request_sizes")
      .withIndex("by_size", q => q.eq("size_id", args.id))
      .collect();

    if (used.length > 0) {
      throw new Error("Cannot delete shirt size used in design requests");
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});
