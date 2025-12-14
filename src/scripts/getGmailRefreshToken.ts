"use node";

import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const CLIENT_ID = process.env.GMAIL_CLIENT_ID!;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI!;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

async function main() {
    const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // force Google to return refresh token
    });

  console.log("1️⃣ Visit this URL in your browser:");
  console.log(authUrl);

  console.log("\n2️⃣ After allowing access, copy the `code` parameter from the URL you are redirected to.");

  // Wait for user input
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Enter the code here: ", async (code: string) => {
    rl.close();
    try {
      // Decode the URL-encoded code from the redirect URL
      const decodedCode = decodeURIComponent(code);
      const { tokens } = await oAuth2Client.getToken(decodedCode);
      console.log("\n✅ Here is your refresh token:");
      console.log(tokens.refresh_token);
      console.log("\n💡 Save it in your .env as GMAIL_REFRESH_TOKEN");
    } catch (error: any) {
      console.error("\n❌ Error getting refresh token:");
      console.error(error.message);
      console.log("\n💡 Tips:");
      console.log("   - Make sure you copied the entire code from the URL");
      console.log("   - The code should start with '4%2F' or similar");
      console.log("   - Try again with a fresh authorization URL");
    }
  });
}

main().catch(console.error);
