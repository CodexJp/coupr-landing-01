const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const ses = new SESClient();

const REQUIRED_FIELDS = ["fullName", "email", "organization", "role", "mobile"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD_LENGTH = 500;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    // Validate required fields
    const missing = REQUIRED_FIELDS.filter((f) => !body[f] || !body[f].trim());
    if (missing.length > 0) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Missing required fields: ${missing.join(", ")}`,
        }),
      };
    }

    // Validate email format
    if (!EMAIL_REGEX.test(body.email)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Invalid email address" }),
      };
    }

    // Truncate fields to prevent abuse
    const truncate = (val) => (val ? val.slice(0, MAX_FIELD_LENGTH) : "");
    const fullName = truncate(body.fullName);
    const email = truncate(body.email);
    const organization = truncate(body.organization);
    const role = truncate(body.role);
    const mobile = truncate(body.mobile);
    const message = truncate(body.message);

    const logoUrl = "https://coupr.io/assets/brand/coupr-logo.png";

    const htmlBody = `
      <html>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #F8F8F8;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F8F8; padding: 24px 0;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #1A4E5E; padding: 28px 32px; text-align: center;">
                      <img src="${logoUrl}" alt="Coupr" width="120" style="display: block; margin: 0 auto;" />
                    </td>
                  </tr>
                  <!-- Title bar -->
                  <tr>
                    <td style="background-color: #E1701A; padding: 14px 32px;">
                      <h2 style="margin: 0; color: #FFFFFF; font-size: 18px; font-weight: 600;">New Demo Request</h2>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding: 28px 32px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        <tr>
                          <td style="padding: 14px 0; border-bottom: 1px solid #E5E7EB; width: 140px; font-weight: 600; color: #1A4E5E; font-size: 14px; vertical-align: top;">Full Name</td>
                          <td style="padding: 14px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-size: 14px;">${escapeHtml(fullName)}</td>
                        </tr>
                        <tr>
                          <td style="padding: 14px 0; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #1A4E5E; font-size: 14px; vertical-align: top;">Email</td>
                          <td style="padding: 14px 0; border-bottom: 1px solid #E5E7EB; font-size: 14px;"><a href="mailto:${encodeURIComponent(email)}" style="color: #E1701A; text-decoration: none;">${escapeHtml(email)}</a></td>
                        </tr>
                        <tr>
                          <td style="padding: 14px 0; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #1A4E5E; font-size: 14px; vertical-align: top;">Organization</td>
                          <td style="padding: 14px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-size: 14px;">${escapeHtml(organization)}</td>
                        </tr>
                        <tr>
                          <td style="padding: 14px 0; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #1A4E5E; font-size: 14px; vertical-align: top;">Role</td>
                          <td style="padding: 14px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-size: 14px;">${escapeHtml(role)}</td>
                        </tr>
                        <tr>
                          <td style="padding: 14px 0; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #1A4E5E; font-size: 14px; vertical-align: top;">Mobile</td>
                          <td style="padding: 14px 0; border-bottom: 1px solid #E5E7EB; font-size: 14px;"><a href="tel:${encodeURIComponent(mobile)}" style="color: #E1701A; text-decoration: none;">${escapeHtml(mobile)}</a></td>
                        </tr>
                        ${message ? `
                        <tr>
                          <td style="padding: 14px 0; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #1A4E5E; font-size: 14px; vertical-align: top;">Message</td>
                          <td style="padding: 14px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-size: 14px;">${escapeHtml(message)}</td>
                        </tr>` : ""}
                      </table>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #F8F8F8; padding: 20px 32px; border-top: 2px solid #E5E7EB; text-align: center;">
                      <p style="margin: 0; font-size: 12px; color: #6B7280;">Sent from Coupr Landing Page</p>
                      <p style="margin: 6px 0 0; font-size: 12px; color: #6B7280;">New York, NY &middot; <a href="https://coupr.io" style="color: #E1701A; text-decoration: none;">coupr.io</a></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const command = new SendEmailCommand({
      Source: process.env.SENDER_EMAIL,
      Destination: {
        ToAddresses: [process.env.RECIPIENT_EMAIL],
      },
      Message: {
        Subject: {
          Data: `New Demo Request from ${fullName} - ${organization}`,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
        },
      },
    });

    await ses.send(command);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Email sent successfully" }),
    };
  } catch (error) {
    console.error("Error sending email:", error);

    return {
      statusCode: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
