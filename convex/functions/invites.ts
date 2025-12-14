import { action } from "../_generated/server";
import { v } from "convex/values";
import type { ActionCtx } from "../_generated/server";
import { api } from "../_generated/api";


export const sendClerkInvite = action({
  args: v.object({
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("client"), v.literal("designer")),
  }),
  handler: async (_ctx: ActionCtx, { email, role }) => {
    if (!email) throw new Error("Email is required");

    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
    const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || "http://localhost:5173";
    if (!CLERK_SECRET_KEY) throw new Error("Missing Clerk secret key");

    const headers = {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    };

    try {
      // ✅ Check if there’s already a pending invitation for this email
      const listResponse = await fetch("https://api.clerk.com/v1/invitations", { headers });
      const listData = await listResponse.json();

      const pending = listData.data?.find(
        (inv: any) => inv.email_address === email && inv.status === "pending"
      );

      if (pending) {
        // ✅ Resend existing invite instead of creating a new one
        const resendResponse = await fetch(
          `https://api.clerk.com/v1/invitations/${pending.id}/resend`,
          { method: "POST", headers }
        );
        const resendData = await resendResponse.json();
        return {
          clerkInvitation: resendData,
          emailSent: true,
          message: `Existing invitation resent to ${email}`,
        };
      }

      // ✅ Dynamic redirect based on role
      const roleRedirectMap: Record<string, string> = {
        admin: `${CLIENT_BASE_URL}/register/admin`,
        client: `${CLIENT_BASE_URL}/register/client`,
        designer: `${CLIENT_BASE_URL}/register/designer`,
      };

      const redirect_url = roleRedirectMap[role] || `${CLIENT_BASE_URL}/signup`;

      // ✅ Create a new invitation
      const createResponse = await fetch("https://api.clerk.com/v1/invitations", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email_address: email,
          redirect_url,
          public_metadata: { role },
          notify: true, // Sends the email invite automatically
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create invite: ${errorText}`);
      }

      const createData = await createResponse.json();

      await _ctx.runMutation(api.invitation.createInvite, {
        email,
        token: createData.id,   // <- Clerk invitation ID
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // example: 7 days
      });


      return {
        clerkInvitation: createData,
        emailSent: true,
        message: `Invitation sent to ${email} as ${role}`,
      };
    } catch (err: any) {
      console.error("Error sending invite:", err);
      return {
        clerkInvitation: null,
        emailSent: false,
        message: `Error: ${err.message || err}`,
      };
    }
  },
});


export const revokeInvite = action({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
    if (!CLERK_SECRET_KEY) throw new Error("Missing Clerk secret key");

    const headers = {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    };

    // ✅ Find invite in Convex DB (using a query)
    const invite = await ctx.runQuery(api.invitation.listInvites, {}); // or use ctx.runQuery on your custom lookup
    const targetInvite = invite.find((i) => i.email === email);

    if (!targetInvite) {
      console.warn("No invite found in Convex for email:", email);
      return { success: false, message: "Invite not found" };
    }

    try {
      // ✅ Revoke in Clerk
      await fetch(`https://api.clerk.com/v1/invitations/${targetInvite.token}/revoke`, {
        method: "POST",
        headers,
      });

      // ✅ Update in Convex (mutations are allowed from actions)
      await ctx.runMutation(api.invitation.updateInviteStatus, {
        id: targetInvite._id,
        status: "revoked",
      });

      return { success: true, message: "Invite revoked successfully" };
    } catch (err: any) {
      console.error("Failed to revoke Clerk invite:", err);
      return { success: false, message: err.message };
    }
  },
});