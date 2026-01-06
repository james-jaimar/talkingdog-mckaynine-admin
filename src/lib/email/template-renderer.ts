
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
  { key: "branch_email", label: "Branch Email", example: "info@mckaynine.co.za" },
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
 */
export function getSampleTemplate(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px;
    }
    .header { 
      background: #2c5530; 
      color: white; 
      padding: 30px 20px; 
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content { 
      padding: 30px 20px; 
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .custom-message {
      background: #f8f9fa;
      border-left: 4px solid #2c5530;
      padding: 15px;
      margin-bottom: 20px;
    }
    .highlight {
      background: #e8f5e9;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
    }
    .footer { 
      background: #f5f5f5; 
      padding: 20px; 
      font-size: 12px; 
      text-align: center;
      color: #666;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .footer a {
      color: #2c5530;
    }
    .btn {
      display: inline-block;
      background: #2c5530;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{branch_name}}</h1>
    </div>
    <div class="content">
      {{#if custom_message}}
      <div class="custom-message">
        {{custom_message}}
      </div>
      {{/if}}
      
      <p>Dear {{handler_name}},</p>
      
      <p>Congratulations on completing the <strong>{{completed_class}}</strong> class with {{dog_name}}! We're thrilled with the progress you've both made.</p>
      
      <div class="highlight">
        <h3 style="margin-top: 0;">What's Next: {{next_class}} Class</h3>
        <p>We're excited to share information about our <strong>{{next_class}}</strong> class, the next step in your training journey.</p>
      </div>
      
      <p>If you have any questions, please don't hesitate to reach out to us.</p>
      
      <p>Best regards,<br>The {{branch_name}} Team</p>
    </div>
    <div class="footer">
      <p><strong>{{branch_name}}</strong></p>
      <p>Email: <a href="mailto:{{branch_email}}">{{branch_email}}</a></p>
    </div>
  </div>
</body>
</html>`;
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
    custom_message: "We hope you and Buddy are doing well!",
  };
}
