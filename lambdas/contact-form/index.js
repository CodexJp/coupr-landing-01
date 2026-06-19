const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const { DynamoDBClient, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const crypto = require("crypto");

const ses = new SESClient();
const ddb = new DynamoDBClient();
const LEADS_TABLE = process.env.LEADS_TABLE || "coupr-landing-leads";

const DEMO_REQUIRED_FIELDS = ["fullName", "email", "organization", "role", "mobile"];
const PAPER_REQUIRED_FIELDS = ["name", "email", "company"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD_LENGTH = 500;

// Paper catalog: maps a paper_id (sent by the frontend) to its public PDF URL
// and display title. Add new papers here as the library grows.
const PAPER_PDFS = {
  "consideration-moment": "https://coupr.io/report/papers/coupr-report.pdf",
};
const PAPER_TITLES = {
  "consideration-moment": "Measuring the Consideration Moment",
};
const DEFAULT_PAPER_ID = "consideration-moment";

// Where the internal "new paper request" notification goes. Defaults to Julian.
// julian@coupr.io is a verified SES identity, so this delivers even in sandbox.
const RESEARCH_NOTIFY_EMAIL = process.env.RESEARCH_NOTIFY_EMAIL || "julian@coupr.io";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const formType = (body && body.form_type) || "contact";

    if (formType === "contact") return await sendDemoEmail(body);
    if (formType === "research-access") return await sendResearchAccessEmail(body);
    if (formType === "research-paper-request") return await sendResearchPaperRequestEmail(body);
    if (formType === "newsletter") return await handleNewsletter(body);

    return jsonResponse(400, { message: `Unsupported form_type: ${formType}` });
  } catch (error) {
    console.error("Error sending email:", error);
    return jsonResponse(500, { message: "Internal server error" });
  }
};

async function sendDemoEmail(body) {
  const missing = DEMO_REQUIRED_FIELDS.filter((f) => !body[f] || !body[f].trim());
  if (missing.length > 0) {
    return jsonResponse(400, { message: `Missing required fields: ${missing.join(", ")}` });
  }
  if (!EMAIL_REGEX.test(body.email)) {
    return jsonResponse(400, { message: "Invalid email address" });
  }

  const truncate = (val) => (val ? val.slice(0, MAX_FIELD_LENGTH) : "");
  const fullName = truncate(body.fullName);
  const email = truncate(body.email);
  const organization = truncate(body.organization);
  const role = truncate(body.role);
  const mobile = truncate(body.mobile);
  const message = truncate(body.message);

  const htmlBody = wrapEmail(
    "New Demo Request",
    `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        ${row("Full Name", escapeHtml(fullName))}
        ${row("Email", `<a href="mailto:${encodeURIComponent(email)}" style="color: #E1701A; text-decoration: none;">${escapeHtml(email)}</a>`)}
        ${row("Organization", escapeHtml(organization))}
        ${row("Role", escapeHtml(role))}
        ${row("Mobile", `<a href="tel:${encodeURIComponent(mobile)}" style="color: #E1701A; text-decoration: none;">${escapeHtml(mobile)}</a>`)}
        ${message ? row("Message", escapeHtml(message)) : ""}
      </table>
    `
  );

  await sendEmail({
    subject: `New Demo Request from ${fullName} - ${organization}`,
    html: htmlBody,
  });

  return jsonResponse(200, { message: "Email sent successfully" });
}

async function sendResearchAccessEmail(body) {
  if (!body.email || !body.email.trim()) {
    return jsonResponse(400, { message: "Missing email" });
  }
  if (!EMAIL_REGEX.test(body.email)) {
    return jsonResponse(400, { message: "Invalid email address" });
  }

  const truncate = (val) => (val ? val.slice(0, MAX_FIELD_LENGTH) : "");
  const email = truncate(body.email);
  const source = truncate(body.source || "coupr.io/report/");
  const ts = truncate(body.ts || new Date().toISOString());

  const htmlBody = wrapEmail(
    "New Research Access",
    `
      <p style="margin: 0 0 16px; font-size: 14px; color: #1F2937; line-height: 1.6;">Someone unlocked the Coupr Research library with a corporate email.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        ${row("Email", `<a href="mailto:${encodeURIComponent(email)}" style="color: #E1701A; text-decoration: none;">${escapeHtml(email)}</a>`)}
        ${row("Source", escapeHtml(source))}
        ${row("Timestamp", escapeHtml(ts))}
      </table>
    `
  );

  await sendEmail({
    subject: `New Research Access: ${email}`,
    html: htmlBody,
  });

  return jsonResponse(200, { message: "Access notification sent" });
}

async function sendResearchPaperRequestEmail(body) {
  const missing = PAPER_REQUIRED_FIELDS.filter((f) => !body[f] || !body[f].trim());
  if (missing.length > 0) {
    return jsonResponse(400, { message: `Missing required fields: ${missing.join(", ")}` });
  }
  if (!EMAIL_REGEX.test(body.email)) {
    return jsonResponse(400, { message: "Invalid email address" });
  }

  const truncate = (val) => (val ? val.slice(0, MAX_FIELD_LENGTH) : "");
  const name = truncate(body.name);
  const email = truncate(body.email);
  const company = truncate(body.company);
  const role = truncate(body.role);
  const note = truncate(body.note);
  const paperId = truncate(body.paper_id || DEFAULT_PAPER_ID);
  const source = truncate(body.source || "coupr.io/report/");
  const ts = truncate(body.ts || new Date().toISOString());

  const paperTitle = PAPER_TITLES[paperId] || "the Coupr Research paper";
  const paperUrl = PAPER_PDFS[paperId] || PAPER_PDFS[DEFAULT_PAPER_ID];

  // ---- 0) Persist the lead (source of truth + dedupe). Best-effort: a store
  // failure must not block the reader. Stores email_sha256 as the GA4 join key.
  await saveLead({
    email, action: "paper:" + paperId, formType: "research-paper-request",
    name, company, role, note, paperId, source, ts,
  });

  // ---- 1) Critical-ish: email the paper link to the lead. -------------------
  // In SES sandbox this fails for unverified (external) recipients; we catch it
  // and fall back to manual handling via the internal notification below. Once
  // SES production access is granted, this succeeds automatically — no redeploy.
  let leadSent = false;
  let leadError = "";
  const leadHtml = buildLeadEmail({ name, paperTitle, paperUrl });
  try {
    await sendEmail({
      to: email,
      subject: `Your Coupr Research paper: ${paperTitle}`,
      html: leadHtml,
    });
    leadSent = true;
  } catch (err) {
    leadError = String((err && err.message) || err);
    console.error("Lead paper email failed (SES sandbox / unverified recipient?):", leadError);
  }

  // ---- 2) Internal notification (to Julian), reporting the auto-send status -
  let notifySent = false;
  const statusBanner = leadSent
    ? `<p style="margin: 0 0 16px; padding: 10px 14px; background: #ECFDF3; border-radius: 8px; font-size: 13px; color: #027A48; line-height: 1.5;">&#10003; The paper was automatically emailed to the lead.</p>`
    : `<p style="margin: 0 0 16px; padding: 10px 14px; background: #FEF3F2; border-radius: 8px; font-size: 13px; color: #B42318; line-height: 1.5;">&#9888; Auto-send unavailable (likely SES sandbox). Please send the PDF to the lead manually: <a href="${paperUrl}" style="color: #B42318;">${paperUrl}</a></p>`;

  const internalHtml = wrapEmail(
    `New Paper Request: ${escapeHtml(paperId)}`,
    `
      ${statusBanner}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        ${row("Name", escapeHtml(name))}
        ${row("Email", `<a href="mailto:${encodeURIComponent(email)}" style="color: #E1701A; text-decoration: none;">${escapeHtml(email)}</a>`)}
        ${row("Company", escapeHtml(company))}
        ${role ? row("Role", escapeHtml(role)) : ""}
        ${note ? row("Note", escapeHtml(note)) : ""}
        ${row("Paper", escapeHtml(paperId))}
        ${row("Source", escapeHtml(source))}
        ${row("Timestamp", escapeHtml(ts))}
      </table>
    `
  );
  try {
    await sendEmail({
      to: RESEARCH_NOTIFY_EMAIL,
      subject: `New paper request: ${name} (${company})`,
      html: internalHtml,
    });
    notifySent = true;
  } catch (err) {
    console.error("Internal notification failed:", String((err && err.message) || err));
  }

  // Total failure (neither the lead nor the team got anything) → ask for retry.
  if (!leadSent && !notifySent) {
    return jsonResponse(500, { message: "Could not process the request, please try again" });
  }

  return jsonResponse(200, {
    message: leadSent ? "Paper sent" : "Paper request received",
  });
}

// Newsletter signup: record the subscriber + notify the team. Front-end already
// enforces corporate-only; we validate format server-side.
async function handleNewsletter(body) {
  if (!body.email || !body.email.trim()) {
    return jsonResponse(400, { message: "Missing email" });
  }
  if (!EMAIL_REGEX.test(body.email)) {
    return jsonResponse(400, { message: "Invalid email address" });
  }

  const truncate = (val) => (val ? val.slice(0, MAX_FIELD_LENGTH) : "");
  const email = truncate(body.email);
  const source = truncate(body.source || "coupr.io/report/");
  const ts = truncate(body.ts || new Date().toISOString());

  await saveLead({ email, action: "newsletter", formType: "newsletter", source, ts });

  try {
    const html = wrapEmail(
      "New Newsletter Subscriber",
      `
        <p style="margin: 0 0 16px; font-size: 14px; color: #1F2937; line-height: 1.6;">A new subscriber joined the Coupr Research newsletter.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          ${row("Email", `<a href="mailto:${encodeURIComponent(email)}" style="color: #E1701A; text-decoration: none;">${escapeHtml(email)}</a>`)}
          ${row("Source", escapeHtml(source))}
          ${row("Timestamp", escapeHtml(ts))}
        </table>
      `
    );
    await sendEmail({ to: RESEARCH_NOTIFY_EMAIL, subject: `New newsletter subscriber: ${email}`, html });
  } catch (err) {
    console.error("Newsletter notification failed:", String((err && err.message) || err));
  }

  return jsonResponse(200, { message: "Subscribed" });
}

// Upsert a lead into DynamoDB, keyed by (email, action). Dedupes naturally and
// counts re-submissions. email_sha256 is the non-PII join key shared with GA4
// (user_id = sha256(lowercased email)). Best-effort: callers don't depend on it.
async function saveLead({ email, action, formType, name, company, role, note, paperId, source, ts }) {
  try {
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized) return false;
    const hash = crypto.createHash("sha256").update(normalized).digest("hex");
    const now = ts || new Date().toISOString();

    const names = { "#src": "source" };
    const sets = [
      "first_ts = if_not_exists(first_ts, :ts)",
      "last_ts = :ts",
      "email_sha256 = :hash",
      "form_type = :ft",
      "#src = :src",
    ];
    const vals = {
      ":ts": { S: now },
      ":hash": { S: hash },
      ":ft": { S: String(formType || "") },
      ":src": { S: String(source || "") },
      ":one": { N: "1" },
    };
    if (name) { sets.push("#nm = :nm"); names["#nm"] = "name"; vals[":nm"] = { S: name }; }
    if (company) { sets.push("company = :co"); vals[":co"] = { S: company }; }
    if (role) { sets.push("#rl = :rl"); names["#rl"] = "role"; vals[":rl"] = { S: role }; }
    if (note) { sets.push("note = :note"); vals[":note"] = { S: note }; }
    if (paperId) { sets.push("paper_id = :pid"); vals[":pid"] = { S: paperId }; }

    await ddb.send(new UpdateItemCommand({
      TableName: LEADS_TABLE,
      Key: { email: { S: normalized }, action: { S: action } },
      UpdateExpression: "SET " + sets.join(", ") + " ADD submissions :one",
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: vals,
    }));
    return true;
  } catch (err) {
    console.error("saveLead failed:", String((err && err.message) || err));
    return false;
  }
}

// SES send. `to` defaults to RECIPIENT_EMAIL (internal) for the demo/access
// flows; the paper flow passes an explicit recipient (the lead or Julian).
async function sendEmail({ to, subject, html }) {
  const command = new SendEmailCommand({
    Source: process.env.SENDER_EMAIL,
    Destination: { ToAddresses: [to || process.env.RECIPIENT_EMAIL] },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: { Html: { Data: html, Charset: "UTF-8" } },
    },
  });
  await ses.send(command);
}

// ---- HTML helpers ----------------------------------------------------------

const LOGO_URL = "https://coupr.io/assets/brand/coupr-logo.png";

// Standard internal/notification shell: teal header + orange title bar + body.
function wrapEmail(title, innerHtml) {
  return `
    <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #F8F8F8;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F8F8; padding: 24px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background-color: #1A4E5E; padding: 28px 32px; text-align: center;">
                    <img src="${LOGO_URL}" alt="Coupr" width="120" style="display: block; margin: 0 auto;" />
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #E1701A; padding: 14px 32px;">
                    <h2 style="margin: 0; color: #FFFFFF; font-size: 18px; font-weight: 600;">${title}</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 28px 32px;">
                    ${innerHtml}
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #F8F8F8; padding: 20px 32px; border-top: 2px solid #E5E7EB; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #6B7280;">Coupr Research &middot; <a href="https://coupr.io/report/" style="color: #E1701A; text-decoration: none;">coupr.io/report</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function row(label, valueHtml) {
  return `
    <tr>
      <td style="padding: 14px 0; border-bottom: 1px solid #E5E7EB; width: 140px; font-weight: 600; color: #1A4E5E; font-size: 14px; vertical-align: top;">${label}</td>
      <td style="padding: 14px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-size: 14px; word-break: break-word;">${valueHtml}</td>
    </tr>
  `;
}

// Lead-facing email: friendly copy + a prominent download button.
function buildLeadEmail({ name, paperTitle, paperUrl }) {
  return `
    <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #F8F8F8;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F8F8; padding: 24px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background-color: #1A4E5E; padding: 28px 32px; text-align: center;">
                    <img src="${LOGO_URL}" alt="Coupr" width="120" style="display: block; margin: 0 auto;" />
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #E1701A; padding: 14px 32px;">
                    <h2 style="margin: 0; color: #FFFFFF; font-size: 18px; font-weight: 600;">Coupr Research</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 16px; font-size: 16px; color: #1F2937; line-height: 1.6;">Hi ${escapeHtml(name)},</p>
                    <p style="margin: 0 0 16px; font-size: 14px; color: #1F2937; line-height: 1.6;">Thanks for your interest in <strong>${escapeHtml(paperTitle)}</strong>. Here's your copy of the full methodology paper.</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                      <tr>
                        <td style="border-radius: 999px; background-color: #E1701A;">
                          <a href="${paperUrl}" style="display: inline-block; padding: 14px 32px; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; letter-spacing: 0.03em;">Download the paper (PDF)</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 16px 0 0; font-size: 13px; color: #6B7280; line-height: 1.6;">Or copy this link: <a href="${paperUrl}" style="color: #E1701A;">${paperUrl}</a></p>
                    <p style="margin: 24px 0 0; font-size: 14px; color: #1F2937; line-height: 1.6;">Questions or want to discuss the methodology? Just reply to this email or write to <a href="mailto:hello@coupr.io" style="color: #E1701A;">hello@coupr.io</a>.</p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #F8F8F8; padding: 20px 32px; border-top: 2px solid #E5E7EB; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #6B7280;">Coupr Research &middot; Miami, FL &middot; <a href="https://coupr.io/report/" style="color: #E1701A; text-decoration: none;">coupr.io/report</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
