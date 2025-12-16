import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * 🧾 Get all print pricing entries
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("prints").collect();
  },
});


export const getPrintTypes = query({
  handler: async (ctx) => {
    return await ctx.db.query("prints").collect();
  },
});

/**
 * ➕ Create a new print pricing record
 */
export const create = mutation({
  args: {
    print_type: v.optional(v.string()),
    description: v.optional(v.string()),
    recommended_for: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.print_type) {
      throw new Error("print_type is required");
    }

    // 1️⃣ Create the print
    const printId = await ctx.db.insert("prints", {
      print_type: args.print_type,
      description: args.description,
      recommended_for: args.recommended_for,
      created_at: Date.now(),
    });

    // 2️⃣ Fetch all existing shirt sizes
    const sizes = await ctx.db.query("shirt_sizes").collect();

    // 3️⃣ Create print pricing for EACH size (FULL SCHEMA)
    for (const size of sizes) {
      await ctx.db.insert("print_pricing", {
        print_id: printId,
        print_type: args.print_type,      // ✅ REQUIRED
        shirt_type: size.type,            // ✅ comes from shirt_sizes.type
        size: size._id,                   // ✅ correct field name
        amount: 0,                        // default
        created_at: Date.now(),
      });
    }

    return printId;
  },
});

/**
 * ✏️ Update an existing print pricing record
 */
export const update = mutation({
  args: {
    id: v.id("prints"),
    print_type:  v.optional(v.string()),
    description: v.optional(v.string()),
    recommended_for: v.optional(v.string()), // ✅ Added this
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Print pricing not found");

    await ctx.db.patch(id, {
      ...updates,
      updated_at: Date.now(),
    });

    return id;
  },
});

/**
 * 🗑️ Delete a print pricing record
 */
export const remove = mutation({
  args: { id: v.id("prints") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
