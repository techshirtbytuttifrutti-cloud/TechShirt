import { action } from "../_generated/server";
import { v } from "convex/values";
import { clerkClient } from "@clerk/clerk-sdk-node";

/**
 * Fetch a user's profile image URL from Clerk using their Clerk ID
 */
export const getClerkProfileImage = action({
  args: {
    clerkId: v.string(),
  },
  handler: async (_ctx, { clerkId }) => {
    try {
      const user = await clerkClient.users.getUser(clerkId);
      
      // Return the image URL from Clerk
      return {
        success: true,
        imageUrl: user.imageUrl || "",
      };
    } catch (err: any) {
      console.error("Error fetching Clerk profile image:", err);
      return {
        success: false,
        imageUrl: "",
        error: err.message,
      };
    }
  },
});

