import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/* ------------------------- GET ALL ------------------------- */
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("print_pricing").collect();
  },
});

/* ------------------------- CREATE -------------------------- */
export const create = mutation({
  args: {
    print_id: v.id("prints"),
    shirt_type: v.id("shirt_types"),
    size: v.id("shirt_sizes"),
    print_type: v.string(),        // string cached for easy display
    description: v.optional(v.string()),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("print_pricing", {
      ...args,
      created_at: Date.now(),
    });
  },
});

export const upsertDefault = mutation({
    args: {
      print_id: v.id("prints"),
      shirt_type: v.id("shirt_types"),
      size: v.id("shirt_sizes"),
      print_type: v.string(),
      description: v.optional(v.string()),
      amount: v.number(),
    },
    handler: async (ctx, args) => {
      const existing = await ctx.db
        .query("print_pricing")
        .filter((q) => q.eq(q.field("print_id"), args.print_id))
        .filter((q) => q.eq(q.field("shirt_type"), args.shirt_type))
        .filter((q) => q.eq(q.field("size"), args.size))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...args,
          updated_at: Date.now(),
        });
        return existing._id;
      }

      return await ctx.db.insert("print_pricing", {
        ...args,
        created_at: Date.now(),
      });
    },
  });
/* ------------------------- UPDATE -------------------------- */
export const update = mutation({
  args: {
    id: v.id("print_pricing"),
    print_id: v.id("prints"),
    shirt_type: v.id("shirt_types"),
    size: v.id("shirt_sizes"),
    print_type: v.string(),
    description: v.optional(v.string()),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;

    await ctx.db.patch(id, {
      ...rest,
      updated_at: Date.now(),
    });
  },
});

/* ------------------------- REMOVE -------------------------- */
export const remove = mutation({
  args: {
    id: v.id("print_pricing"),
  },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});


export const getPriceBySize = query({
  args: {
    sizeId: v.id("shirt_sizes"),
    shirtType: v.union(v.id("shirt_types"), v.literal("default")),
    printType: v.string(),
  },
  handler: async (ctx, args) => {
    // Try to find specific match: printType + size + shirtType
    const records = await ctx.db
      .query("print_pricing")
      .withIndex("by_print_type", (q) => q.eq("print_type", args.printType))
      .collect();

    // Filter at runtime (Convex does not support composite indexes)
    const exact = records.find(
      (r) =>
        r.size === args.sizeId &&
        r.shirt_type === args.shirtType
    );

    if (exact) return exact.amount;

    // Fallback 1: printType + size, shirt_type default
    const fallbackType = records.find(
      (r) =>
        r.size === args.sizeId &&
        r.shirt_type === "default"
    );
    if (fallbackType) return fallbackType.amount;

    // Fallback 2: printType only (size=default, shirt_type=default)
    const fallback = records.find(
      (r) =>
        r.size === "default" &&
        r.shirt_type === "default"
    );
    if (fallback) return fallback.amount;

    return null; // not found
  },
});