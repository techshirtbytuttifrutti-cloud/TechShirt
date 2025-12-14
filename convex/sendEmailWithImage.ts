"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";

export const sendEmailWithImageAction = action({
  args: {
    to: v.string(),
    subject: v.string(),
    text: v.string(),
    imageId: v.id("_storage"), // FIXED ✅
  },
  handler: async (ctx, { to, subject, text, imageId }) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Fetch file from Convex storage
    const imageBuffer = await ctx.storage.get(imageId);

    if (!imageBuffer) {
      throw new Error("Image not found in Convex storage.");
    }

    const arrayBuffer = await imageBuffer.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imageBuffer.type || "image/png";


    const htmlTemplate = `
      <table width="100%" bgcolor="#f4f6f8" cellpadding="0" cellspacing="0" 
        style="font-family: Arial, sans-serif; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" bgcolor="#ffffff" cellpadding="0" cellspacing="0" 
              style="border-radius: 8px; border: 1px solid #ddd;">
              
              <tr>
                <td align="center" style="padding: 24px;">
                  <h2 style="color: #008080; margin: 0;">TechShirt</h2>
                  <p style="color: #666; font-size: 14px; margin: 8px 0 0;">
                    Custom designs made simple.
                  </p>
                </td>
              </tr>

              <tr><td style="border-top: 1px solid #eee;"></td></tr>

              <tr>
                <td style="padding: 24px; color: #333; font-size: 15px; line-height: 1.6;">
                  ${text}
                </td>
              </tr>

              <tr>
                <td align="center" style="padding: 20px;">
                  <img 
                    src="data:${mimeType};base64,${base64Image}" 
                    alt="Uploaded Design"
                    style="max-width: 100%; border-radius: 8px; border: 1px solid #ccc;"
                  />
                </td>
              </tr>

              <tr>
                <td align="center" style="padding: 20px;">
                  <a href="https://techshirt-by-tuttifrutti.vercel.app/notifications"
                    style="
                      background-color: #008080;
                      color: white;
                      text-decoration: none;
                      padding: 10px 22px;
                      border-radius: 6px;
                      display: inline-block;
                      font-weight: 600;
                    ">
                    View Notification
                  </a>
                </td>
              </tr>

              <tr><td style="border-top: 1px solid #eee;"></td></tr>

              <tr>
                <td align="center" style="padding: 16px; color: #999; font-size: 12px;">
                  © ${new Date().getFullYear()} TechShirt • All rights reserved
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    `;

    await transporter.sendMail({
      from: `TuttiFrutti TechShirt <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html: htmlTemplate,
      text,
    });

    return "📨 Email sent with embedded image!";
  },
});
