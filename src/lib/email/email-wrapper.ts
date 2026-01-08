/**
 * Professional email wrapper with consistent styling
 * Includes branch logo and banking details footer
 */

import { getBranchLogo } from "@/lib/branchLogo";

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

  const bankingSection = includeBankingDetails
    ? `
    <div style="background-color: #f0f5f1; border-radius: 8px; padding: 20px; margin-top: 20px;">
      <h3 style="margin: 0 0 12px 0; color: #2c5530; font-size: 16px; font-weight: 600;">Banking Details</h3>
      <table style="width: 100%; font-size: 14px; color: #333;">
        <tr>
          <td style="padding: 4px 0; color: #666;">Account Holder:</td>
          <td style="padding: 4px 0; font-weight: 500;">${BANKING_DETAILS.accountHolder}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #666;">Bank:</td>
          <td style="padding: 4px 0; font-weight: 500;">${BANKING_DETAILS.bank}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #666;">Account Number:</td>
          <td style="padding: 4px 0; font-weight: 500;">${BANKING_DETAILS.accountNumber}</td>
        </tr>
      </table>
      <p style="margin: 12px 0 0 0; font-size: 13px; color: #2c5530; font-style: italic;">
        ${BANKING_DETAILS.reference}
      </p>
    </div>
    `
    : "";

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
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f4;
    }
    a {
      color: #2c5530;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 16px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 30px 40px 20px 40px; text-align: center; border-bottom: 1px solid #eee;">
              <img src="${emailLogoUrl}" alt="${branchName}" style="max-width: 200px; height: auto;" />
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 30px 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Banking Details -->
          ${
            includeBankingDetails
              ? `
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              ${bankingSection}
            </td>
          </tr>
          `
              : ""
          }
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #2c5530; border-radius: 0 0 12px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="color: #ffffff; font-size: 14px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-weight: 600;">${branchName}</p>
                    ${branchEmail ? `<p style="margin: 0 0 4px 0;"><a href="mailto:${branchEmail}" style="color: #ffffff; text-decoration: none;">${branchEmail}</a></p>` : ""}
                    ${branchPhone ? `<p style="margin: 0;">${branchPhone}</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Post-footer text -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <tr>
            <td style="padding: 20px 40px; text-align: center; color: #999; font-size: 12px;">
              <p style="margin: 0;">This email was sent by ${branchName}.</p>
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
      .email-content .highlight { background-color: #f0f5f1; padding: 16px; border-radius: 8px; margin: 16px 0; }
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
