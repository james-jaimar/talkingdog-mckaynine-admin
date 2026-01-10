/**
 * Professional email wrapper with consistent styling
 * Includes branch logo and banking details footer
 * Standard email width: 600px (industry best practice)
 */

import { getBranchLogo } from "@/lib/branchLogo";

// McKaynine brand blue color
const BRAND_BLUE = "#3b82f6";
const BRAND_BLUE_DARK = "#2563eb";

interface EmailWrapperOptions {
  branchName?: string;
  branchEmail?: string;
  branchPhone?: string;
  includeBankingDetails?: boolean;
  logoUrl?: string;
}

// Banking details for the organization
export const BANKING_DETAILS = {
  accountHolder: "Adrienne Hawkins",
  bank: "FNB, Sandton City",
  accountNumber: "6212 7520 189",
  reference: "Please use your name as reference.",
};

// Branch-specific signature configurations
export interface BranchSignature {
  name: string;
  title: string;
  phone: string;
  company: string;
  email: string;
  website: string;
}

export const BRANCH_SIGNATURES: Record<string, BranchSignature> = {
  "Delta": {
    name: "Ady Hawkins",
    title: "Branch Manager",
    phone: "083 400 2987",
    company: "McKaynine Training Centre",
    email: "delta@mckaynine.co.za",
    website: "www.mckaynine.co.za",
  },
  "Randburg": {
    name: "Ady Hawkins",
    title: "Branch Manager",
    phone: "083 400 2987",
    company: "McKaynine Training Centre",
    email: "randburg@mckaynine.co.za",
    website: "www.mckaynine.co.za",
  },
};

/**
 * Get signature HTML for a branch
 * Uses branch name to determine which signature to use
 */
export function getEmailSignature(branchName?: string): string {
  // Determine which branch signature to use
  let signature: BranchSignature;
  
  if (branchName?.toLowerCase().includes("randburg")) {
    signature = BRANCH_SIGNATURES["Randburg"];
  } else {
    // Default to Delta for all other branches
    signature = BRANCH_SIGNATURES["Delta"];
  }
  
  return `<p style="margin: 20px 0 0 0; font-size: 14px; color: #333333; line-height: 1.6;">
    <strong style="color: #2c5530;">${signature.name}</strong><br>
    ${signature.title}<br>
    📞 ${signature.phone}<br>
    ${signature.company}<br>
    ✉️ <a href="mailto:${signature.email}" style="color: #3b82f6; text-decoration: none;">${signature.email}</a><br>
    🌐 <a href="https://${signature.website}" style="color: #3b82f6; text-decoration: none;">${signature.website}</a>
  </p>`;
}

/**
 * Get signature as plain text (for edge functions that build their own HTML)
 */
export function getEmailSignatureText(branchName?: string): BranchSignature {
  if (branchName?.toLowerCase().includes("randburg")) {
    return BRANCH_SIGNATURES["Randburg"];
  }
  return BRANCH_SIGNATURES["Delta"];
}

/**
 * Generate the logo URL for emails
 * Uses absolute URL for email compatibility
 */
export function getEmailLogoUrl(branchName?: string): string {
  const logoPath = getBranchLogo(branchName, 'jpg');
  // For emails, we need the full absolute URL
  return `https://mckaynine.talkingdog.co.za${logoPath}`;
}

/**
 * Wrap email content in a professional template
 * Uses 600px max width (email industry standard)
 * Logo constrained to 180px width
 */
export function wrapEmailContent(
  content: string,
  options: EmailWrapperOptions = {}
): string {
  const {
    branchName = "McKaynine",
    branchEmail = "",
    branchPhone = "",
    includeBankingDetails = true,
    logoUrl,
  } = options;

  const emailLogoUrl = logoUrl || getEmailLogoUrl(branchName);
  
  // Auto-generate signature for the branch
  const signatureHtml = getEmailSignature(branchName);

  const bankingSection = includeBankingDetails
    ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${BRAND_BLUE}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px 24px;">
          <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;">Banking Details</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #ffffff;">
            <tr>
              <td style="padding: 6px 0; color: rgba(255,255,255,0.85); width: 140px;">Account Holder:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${BANKING_DETAILS.accountHolder}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: rgba(255,255,255,0.85);">Bank:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${BANKING_DETAILS.bank}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: rgba(255,255,255,0.85);">Account Number:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${BANKING_DETAILS.accountNumber}</td>
            </tr>
          </table>
          <p style="margin: 14px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9); font-style: italic; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 14px;">
            ${BANKING_DETAILS.reference}
          </p>
        </td>
      </tr>
    </table>
    `
    : "";

  // Check if content already has {{signature}} placeholder - if so, don't add another
  const contentHasSignature = content.includes('{{signature}}') || content.includes(signatureHtml);
  
  // Add signature before content ends if not already included
  const contentWithSignature = contentHasSignature 
    ? content 
    : content + signatureHtml;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${branchName}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
      -webkit-font-smoothing: antialiased;
    }
    a {
      color: ${BRAND_BLUE};
    }
    /* Table styles for rich content */
    table.content-table, .content-cell table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    table.content-table th, table.content-table td,
    .content-cell table th, .content-cell table td {
      border: 1px solid #d1d5db;
      padding: 8px 12px;
      text-align: left;
    }
    table.content-table th, .content-cell table th {
      background-color: #f3f4f6;
      font-weight: 600;
    }
    /* Text formatting */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.3;
      color: #1a1a1a;
    }
    h1 { font-size: 1.75em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    p { margin: 0.5em 0; }
    ul, ol { margin: 0.5em 0; padding-left: 1.5em; }
    li { margin: 0.25em 0; }
    strong, b { font-weight: 600; }
    em, i { font-style: italic; }
    u { text-decoration: underline; }
    mark { padding: 0.125em 0.25em; border-radius: 0.125em; }
    blockquote {
      border-left: 3px solid #d1d5db;
      margin: 1em 0;
      padding-left: 1em;
      color: #4b5563;
    }
    hr {
      border: none;
      border-top: 1px solid #d1d5db;
      margin: 1.5em 0;
    }
    @media only screen and (max-width: 620px) {
      .container {
        width: 100% !important;
        padding: 12px !important;
      }
      .content-cell {
        padding: 24px 20px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <!--[if mso]>
        <table role="presentation" align="center" width="600" cellspacing="0" cellpadding="0" border="0">
        <tr>
        <td>
        <![endif]-->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; text-align: center; border-bottom: 1px solid #eaeaea;">
              <img src="${emailLogoUrl}" alt="${branchName}" width="180" style="display: block; margin: 0 auto; max-width: 180px; width: 180px; height: auto; border: 0;" />
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td class="content-cell" style="padding: 28px 32px;">
              ${contentWithSignature}
            </td>
          </tr>
          
          <!-- Banking Details -->
          ${
            includeBankingDetails
              ? `
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              ${bankingSection}
            </td>
          </tr>
          `
              : ""
          }
          
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
        
        <!-- Post-footer text -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <tr>
            <td style="padding: 16px 32px; text-align: center; color: #999999; font-size: 11px;">
              <p style="margin: 0;">This email was sent by ${branchName} McKaynine.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Simple content wrapper (no full HTML structure, for embedding in existing templates)
 */
export function getContentStyles(): string {
  return `
    <style>
      .email-content p { margin: 0 0 16px 0; }
      .email-content h1, .email-content h2, .email-content h3 { color: #2c5530; margin: 0 0 16px 0; }
      .email-content ul, .email-content ol { margin: 0 0 16px 0; padding-left: 24px; }
      .email-content li { margin-bottom: 8px; }
      .email-content .highlight { background-color: #e8f0fe; padding: 16px; border-radius: 8px; margin: 16px 0; }
      .email-content .cta-button {
        display: inline-block;
        background-color: #2c5530;
        color: #ffffff !important;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: 600;
        margin: 8px 0;
      }
    </style>
  `;
}
