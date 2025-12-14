import { google } from "googleapis";

const CLIENT_ID = process.env.GMAIL_CLIENT_ID!;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI!;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN!;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

export const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

/**
 * Send an email via Gmail API
 * @param to Recipient email
 * @param subject Email subject
 * @param html HTML content for email
 */
export async function sendEmail(to: string, subject: string, html: string) {
  // Gmail API expects base64 encoded email
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/html; charset=UTF-8`,
    "",
    html,
  ].join("\n");

  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  try {
    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });
    console.log(`✅ Email sent to ${to}:`, res.data.id);
  } catch (err) {
    console.error(`❌ Error sending email to ${to}:`, err);
  }
}
