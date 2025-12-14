"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";

export const sendEmailAction = action({
  args: { to: v.string(), subject: v.string(), text: v.string() },
  handler: async (_ctx, { to, subject, text }) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER, // Gmail address
        pass: process.env.GMAIL_APP_PASSWORD, // App password (16 chars)
      },
    });

    // ✅ Use your HTML design here
    const htmlTemplate = `
      <table width="100%" bgcolor="#f4f6f8" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" bgcolor="#ffffff" cellpadding="0" cellspacing="0" style="border-radius: 8px; border: 1px solid #ddd;">
              <tr>
                <td align="center" style="padding: 24px;">
                  <h2 style="color: #008080; margin: 0;">TechShirt</h2>
                  <p style="color: #666; font-size: 14px; margin: 8px 0 0;">
                    Custom designs made simple.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="border-top: 1px solid #eee;"></td>
              </tr>

              <tr>
                <td style="padding: 24px; color: #333; font-size: 15px; line-height: 1.6;">
                  ${text}
                </td>
              </tr>

              <tr>
                <td align="center" style="padding: 20px;">
                  <a href="https://tech-shirt.vercel.app/notifications"
                    style="
                      background-color: #008080;
                      color: #ffffff;
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

              <tr>
                <td style="border-top: 1px solid #eee;"></td>
              </tr>

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

    const mailOptions = {
      from: `TuttiFrutti TechShirt <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text, // fallback (for plain clients)
      html: htmlTemplate, // ✅ key part: HTML content
    };

    await transporter.sendMail(mailOptions);
    return "✅ Email sent with styled HTML!";
  },
});
