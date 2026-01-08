
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
  [key: string]: string | undefined;
}

/**
 * Render a template by replacing merge fields with actual values
 */
export function renderTemplate(template: string, variables: TemplateVariables): string {
  let rendered = template;
  
  // Replace all {{variable}} patterns
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    rendered = rendered.replace(regex, value || "");
  });
  
  // Handle conditional blocks: {{#if variable}}...{{/if}}
  rendered = rendered.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/gi,
    (match, variable, content) => {
      const value = variables[variable];
      return value ? content : "";
    }
  );
  
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
  
  <div style="background-color: #f0f5f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin: 0 0 12px 0; color: #2c5530;">What's Next: {{next_class}} Class</h3>
    <p style="margin: 0;">We're excited to share information about our <strong>{{next_class}}</strong> class, the next step in your training journey.</p>
  </div>
  
  <p>Should you wish to enroll, please let us know by sending a confirmation email along with your proof of payment. Since you are McKaynine graduates, spaces are reserved for a limited time, but we do require confirmation as soon as possible as the classes fill up very quickly.</p>
  
  <p>If you have any questions, please don't hesitate to reach out to us.</p>
  
  <p>Kind regards,<br>The {{branch_name}} Team</p>
</div>`;
}

/**
 * Generate sample variables for preview
 */
export function getSampleVariables(): TemplateVariables {
  return {
    handler_name: "John",
    handler_full_name: "John Smith",
    handler_email: "john@example.com",
    dog_name: "Buddy",
    completed_class: "Puppy",
    next_class: "EO",
    branch_name: "McKaynine Training",
    branch_email: "info@mckaynine.co.za",
    branch_phone: "082 123 4567",
    class_day_time: "Saturdays 09h00 - 10h00",
    class_dates: "18 Jan - 22 Mar 2026",
    banking_details: "McKaynine (Pty) Ltd, FNB, Acc: 12345678, Branch: 250655",
    base_url: window.location.origin,
    custom_message: "We hope you and Buddy are doing well!",
  };
}
