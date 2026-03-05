import { getEmailSignature } from "./email-wrapper";

/**
 * Available merge fields for email templates
 */
export const AVAILABLE_MERGE_FIELDS = [
  { key: "handler_name", label: "Handler First Name", example: "John" },
  { key: "handler_full_name", label: "Handler Full Name", example: "John Smith" },
  { key: "handler_email", label: "Handler Email", example: "john@example.com" },
  { key: "dog_name", label: "Dog Name", example: "Buddy" },
  { key: "completed_class", label: "Completed Class", example: "Puppy" },
  { key: "next_class", label: "Next Class", example: "EO" },
  { key: "branch_name", label: "Branch Name", example: "McKaynine Delta" },
  { key: "branch_email", label: "Branch Email", example: "info@talkingdog.co.za" },
  { key: "branch_phone", label: "Branch Phone", example: "082 123 4567" },
  { key: "class_day_time", label: "Class Day & Time", example: "Saturdays 09h00 - 10h00" },
  { key: "class_dates", label: "Class Dates", example: "18 Jan - 22 Mar 2026" },
  { key: "banking_details", label: "Banking Details", example: "McKaynine (Pty) Ltd, FNB, Acc: 12345678" },
  { key: "base_url", label: "Base URL (for images)", example: "https://mckaynine.talkingdog.co.za" },
  { key: "custom_message", label: "Custom Message", example: "Your personalized message here" },
  { key: "signature", label: "Email Signature", example: "Ady Hawkins, Branch Manager..." },
  // Payment receipt fields
  { key: "invoice_number", label: "Invoice Number", example: "INV-2026-001" },
  { key: "payment_summary", label: "Payment Summary Box", example: "[Payment summary with dates and amounts]" },
  { key: "items_breakdown", label: "Items Breakdown", example: "[Itemized list with totals]" },
] as const;

export type MergeFieldKey = typeof AVAILABLE_MERGE_FIELDS[number]["key"];

export interface TemplateVariables {
  handler_name?: string;
  handler_full_name?: string;
  handler_email?: string;
  dog_name?: string;
  completed_class?: string;
  next_class?: string;
  branch_name?: string;
  branch_email?: string;
  branch_phone?: string;
  class_day_time?: string;
  class_dates?: string;
  banking_details?: string;
  base_url?: string;
  custom_message?: string;
  signature?: string;
  [key: string]: string | undefined;
}

/**
 * Get variables with auto-generated signature based on branch
 */
export function getVariablesWithSignature(variables: TemplateVariables): TemplateVariables {
  return {
    ...variables,
    signature: variables.signature || getEmailSignature(variables.branch_name),
  };
}

/**
 * Render a template by replacing merge fields with actual values
 */
export function renderTemplate(template: string, variables: TemplateVariables): string {
  let rendered = template;
  
  // FIRST: Handle conditional blocks: {{#if variable}}...{{/if}}
  // This must happen before variable replacement so we can check if the variable has a value
  rendered = rendered.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/gi,
    (match, variable, content) => {
      const value = variables[variable];
      return value ? content : "";
    }
  );
  
  // THEN: Replace all {{variable}} patterns
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    rendered = rendered.replace(regex, value || "");
  });
  
  // Clean up any remaining unmatched merge fields
  rendered = rendered.replace(/\{\{[^}]+\}\}/g, "");
  
  return rendered;
}

/**
 * Get sample template with all merge fields filled
 * Professional design with logo and banking details
 */
export function getSampleTemplate(): string {
  return `<div class="email-content">
  <p>Dear {{handler_name}},</p>
  
  <p>Congratulations on completing the <strong>{{completed_class}}</strong> class with {{dog_name}}! We're thrilled with the progress you've both made.</p>
  
  {{#if custom_message}}
  <p>{{custom_message}}</p>
  {{/if}}
  
  <div style="background-color: #e8f0fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin: 0 0 12px 0; color: #2c5530;">What's Next: {{next_class}} Class</h3>
    <p style="margin: 0;">We're excited to share information about our <strong>{{next_class}}</strong> class, the next step in your training journey.</p>
  </div>
  
  <p>Should you wish to enroll, please let us know by sending a confirmation email along with your proof of payment. Since you are McKaynine graduates, spaces are reserved for a limited time, but we do require confirmation as soon as possible as the classes fill up very quickly.</p>
  
  <p>If you have any questions, please don't hesitate to reach out to us.</p>
  
  {{signature}}
</div>`;
}

/**
 * Generate sample payment summary HTML for preview
 */
function getSamplePaymentSummaryHtml(): string {
  return `
    <div style="background-color: #f8f9fa; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #2c5530;">
      <h2 style="margin: 0 0 16px; color: #2c5530; font-size: 18px; font-weight: 600;">💳 Payment Summary</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #555; font-size: 14px;"><strong>Receipt Number:</strong></td>
          <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">INV-2026-001</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #555; font-size: 14px;"><strong>Invoice Date:</strong></td>
          <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">15 January 2026</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #555; font-size: 14px;"><strong>Payment Date:</strong></td>
          <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">18 January 2026</td>
        </tr>
        <tr style="border-top: 2px solid #2c5530;">
          <td style="padding: 12px 0 0; color: #2c5530; font-size: 18px; font-weight: 700;"><strong>Amount Paid:</strong></td>
          <td style="padding: 12px 0 0; color: #2c5530; font-size: 18px; font-weight: 700; text-align: right;">R 2,500.00</td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Generate sample items breakdown HTML for preview
 */
function getSampleItemsBreakdownHtml(): string {
  return `
    <div style="margin: 24px 0;">
      <h3 style="margin: 0 0 16px; color: #2c5530; font-size: 16px; font-weight: 600;">📋 Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 12px 0; color: #555; font-size: 12px; text-align: left; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
            <th style="padding: 12px 0; color: #555; font-size: 12px; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
            <th style="padding: 12px 0; color: #555; font-size: 12px; text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
            <th style="padding: 12px 0; color: #555; font-size: 12px; text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px 0; color: #333; font-size: 14px; border-bottom: 1px solid #eee;">Puppy Class - Enrollment Fee</td>
            <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: center; border-bottom: 1px solid #eee;">1</td>
            <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right; border-bottom: 1px solid #eee;">R 500.00</td>
            <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right; border-bottom: 1px solid #eee;">R 500.00</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #333; font-size: 14px; border-bottom: 1px solid #eee;">Puppy Class - Course Fee (Term 1)</td>
            <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: center; border-bottom: 1px solid #eee;">1</td>
            <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right; border-bottom: 1px solid #eee;">R 2,000.00</td>
            <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right; border-bottom: 1px solid #eee;">R 2,000.00</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 10px 0; color: #555; font-size: 14px; text-align: right;"><strong>Subtotal:</strong></td>
            <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right;">R 2,500.00</td>
          </tr>
          <tr style="background-color: #e8f4e9;">
            <td colspan="3" style="padding: 14px 10px; color: #2c5530; font-size: 16px; font-weight: 700; text-align: right;"><strong>Total Paid:</strong></td>
            <td style="padding: 14px 10px; color: #2c5530; font-size: 16px; font-weight: 700; text-align: right;">R 2,500.00</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 10px 0; color: #555; font-size: 14px; text-align: right;"><strong>Balance Due:</strong></td>
            <td style="padding: 10px 0; color: #28a745; font-size: 14px; font-weight: 600; text-align: right;">R 0.00</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}

/**
 * Generate sample variables for preview
 */
export function getSampleVariables(branchName?: string): TemplateVariables {
  const effectiveBranchName = branchName || "McKaynine Delta";
  return {
    handler_name: "John",
    handler_full_name: "John Smith",
    handler_email: "john@example.com",
    dog_name: "Buddy",
    completed_class: "Puppy",
    next_class: "EO",
    branch_name: effectiveBranchName,
    branch_email: "info@mckaynine.co.za",
    branch_phone: "082 123 4567",
    class_day_time: "Saturdays 09h00 - 10h00",
    class_dates: "18 Jan - 22 Mar 2026",
    banking_details: "McKaynine (Pty) Ltd, FNB, Acc: 12345678, Branch: 250655",
    base_url: window.location.origin,
    custom_message: "We hope you and Buddy are doing well!",
    signature: getEmailSignature(effectiveBranchName),
    // Payment receipt fields
    invoice_number: "INV-2026-001",
    payment_summary: getSamplePaymentSummaryHtml(),
    items_breakdown: getSampleItemsBreakdownHtml(),
  };
}
