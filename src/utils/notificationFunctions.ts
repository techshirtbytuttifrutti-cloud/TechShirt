import type { Id } from "../../convex/_generated/dataModel";

/**
 * Notify designer when a client adds a comment
 */
export const notifyDesignerOnComment = async (
  createNotification: any,
  designerUserId: Id<"users">,
  clientName: string
) => {
  try {
    await createNotification({
      userId: designerUserId,
      userType: "designer",
      message: `${clientName} added a comment on your design`,
      title: "New Comment",
      type: "comment",
    });
  } catch (error) {
    console.error("Failed to notify designer on comment:", error);
  }
};

/**
 * Notify designer when a client requests price negotiation
 */
export const notifyDesignerOnNegotiationRequest = async (
  createNotification: any,
  designerUserId: Id<"users">,
  clientName: string,
  proposedAmount: number
) => {
  try {
    await createNotification({
      userId: designerUserId,
      userType: "designer",
      message: `${clientName} requested a price negotiation. Proposed amount: ₱${proposedAmount.toLocaleString()}`,
      title: "Price Negotiation Request",
      type: "negotiation",
    });
  } catch (error) {
    console.error("Failed to notify designer on negotiation request:", error);
  }
};

/**
 * Notify client when designer updates design status
 */
export const notifyClientOnStatusUpdate = async (
  createNotification: any,
  clientUserId: Id<"users">,
  newStatus: string
) => {
  try {
    const statusMessages: { [key: string]: string } = {
      in_progress: "Your design is now in progress",
      pending_revision: "Your design is pending revision",
      in_production: "Your design has moved to production",
      pending_pickup: "Your design is ready for pickup",
      completed: "Your design is completed",
      approved: "Your design has been approved",
    };

    const message =
      statusMessages[newStatus] || `Your design status has been updated to ${newStatus}`;

    await createNotification({
      userId: clientUserId,
      userType: "client",
      message,
      title: "Design Status Update",
      type: "status_update",
    });
  } catch (error) {
    console.error("Failed to notify client on status update:", error);
  }
};

