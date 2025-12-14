import { query } from "./_generated/server";
import { v } from "convex/values";

// ✅ Fetch user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});

export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
export const listDesigners = query(async ({ db }) => {
  // 1. Get all users with role = designer
  const users = await db.query("users")
    .filter((q) => q.eq(q.field("role"), "designer"))
    .collect();

  // 2. Get all designer records
  const designers = await db.query("designers").collect();

  // 3. Get all portfolios
  const portfolios = await db.query("portfolios").collect();

  // 4. Build enriched designer list
  return users.map((user) => {
    // Find designer record linked to this user
    const designer = designers.find((d) => d.user_id === user._id);

    // Find portfolio linked to this designer (if any)
    const portfolio = designer
      ? portfolios.find((p) => p.designer_id === designer._id)
      : null;

    return {
      ...user,
      specialization: portfolio?.specialization ?? "General",
      skills: portfolio?.skills ?? [],
      portfolioId: portfolio?._id ?? null,
    };
  });
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("users").collect();
    return all.map((u) => ({
      _id: u._id,
      first_name: u.firstName,
      last_name: u.lastName,
      email: u.email,
    }));
  },
});

export const getDesignersByIds = query({
  args: { ids: v.array(v.id("users")) },
  handler: async (ctx, { ids }) => {
    // Fetch all users with role = designer first
    const allDesigners = await ctx.db.query("users")
      .filter((q) => q.eq(q.field("role"), "designer"))
      .collect();

    // Only keep users whose _id is in ids
    const users = allDesigners.filter((user) => ids.includes(user._id));

    const designers = await ctx.db.query("designers").collect();
    const portfolios = await ctx.db.query("portfolios").collect();

    return users.map((user) => {
      const designer = designers.find((d) => d.user_id === user._id);
      const portfolio = designer
        ? portfolios.find((p) => p.designer_id === designer._id)
        : null;

      return {
        ...user,
        specialization: portfolio?.specialization ?? "General",
        skills: portfolio?.skills ?? [],
        portfolioId: portfolio?._id ?? null,
        full_name: `${user.firstName} ${user.lastName}`.trim(),
      };
    });
  },
});
