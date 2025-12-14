// convex/mutations/designNotifications.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const notifyClientDesignUpdate = mutation({
  args: { designId: v.id("design"), previewImageId: v.optional(v.id("_storage")) },
  handler: async (ctx, { designId, previewImageId }) => {
    const design = await ctx.db.get(designId);
    if (!design) throw new Error("Design not found");

    const clientId = design.client_id;
    if (!clientId) throw new Error("Design has no associated client");

    // 1. Update design status
    await ctx.db.patch(designId, { status: "in_progress" });

    // 2. Send notification
    await ctx.runMutation(api.notifications.createNotification, {
      userId: clientId,
      userType: "client",
      title: "Design Update",
      message: `Your design has a new update from the designer.`,
      type: "design_update",
    });

    // 3. ✅ Send email with preview image if available
    if (previewImageId) {
      const client = await ctx.db.get(clientId);
      if (client?.email) {
        await ctx.scheduler.runAfter(0, api.sendEmailWithImage.sendEmailWithImageAction, {
          to: client.email,
          subject: "Your Design Has Been Updated",
          text: "Your design has a new update from the designer. Check it out now!",
          imageId: previewImageId,
        });
      }
    }

    return { success: true };
  },
});
