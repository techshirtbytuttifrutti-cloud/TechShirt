"use node";
import { google } from "googleapis";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

export async function sendGmail(to: string, subject: string, text: string) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token || "",
      },
    });

    const htmlTemplate = `
      <table width="100%" bgcolor="#f4f6f8" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" bgcolor="#ffffff" cellpadding="0" cellspacing="0" style="border-radius: 8px; border: 1px solid #ddd;">
              <tr>
                <td align="center" style="padding: 24px;">
                  <h2 style="color: #008080; margin: 0;">TuttiFrutti TechShirt</h2>
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
                  <a href="https://techshirt.vercel.app"
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
                  © ${new Date().getFullYear()} TuttiFrutti TechShirt • All rights reserved
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
      text,
      html: htmlTemplate,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", result.response);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error };
  }
}
