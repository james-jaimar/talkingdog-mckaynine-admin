// Pre-built Email Template Library
// These templates are designed by developers and configured by admins

import { EO3_JAN_2026_SUBJECT, EO3_JAN_2026_TEMPLATE } from "./eo3-jan-2026";

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date-range' | 'currency';
  placeholder?: string;
  defaultValue?: string;
  helpText?: string;
}

export interface PrebuiltTemplate {
  code: string;
  name: string;
  description: string;
  classType: string;
  subject: string;
  fields: TemplateField[];
  getHtml: (variables: Record<string, string>) => string;
}

// Common HTML wrapper for all templates
function wrapEmailHtml(content: string, branchName: string = 'McKaynine Training'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${branchName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #333;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 800px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      text-align: center;
      padding: 20px;
      background-color: #3b7dc4;
    }
    .header img {
      max-width: 400px;
      height: auto;
    }
    .content-wrapper {
      display: table;
      width: 100%;
    }
    .left-column {
      display: table-cell;
      width: 150px;
      vertical-align: top;
    }
    .left-column img {
      width: 150px;
      height: auto;
      display: block;
    }
    .main-content {
      display: table-cell;
      vertical-align: top;
      padding: 20px;
    }
    h1 {
      color: #3b7dc4;
      font-size: 18px;
      margin: 0 0 10px 0;
      border-bottom: 2px solid #3b7dc4;
      padding-bottom: 5px;
    }
    h2 {
      color: #3b7dc4;
      font-size: 16px;
      margin: 20px 0 10px 0;
    }
    .intro-text {
      font-style: italic;
      color: #555;
      margin-bottom: 15px;
    }
    .benefits-list {
      margin: 10px 0;
      padding-left: 20px;
    }
    .benefits-list li {
      margin-bottom: 8px;
      color: #444;
    }
    .section {
      margin-bottom: 20px;
    }
    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    .pricing-table td {
      padding: 8px;
      border: 1px solid #ddd;
      font-size: 13px;
    }
    .pricing-table td:first-child {
      width: 60%;
    }
    .booking-note {
      background-color: #f0f7ff;
      padding: 15px;
      border-left: 4px solid #3b7dc4;
      margin: 15px 0;
    }
    .footer {
      background-color: #3b7dc4;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .footer-content {
      display: table;
      width: 100%;
    }
    .footer-left {
      display: table-cell;
      vertical-align: middle;
      text-align: left;
      width: 60%;
    }
    .footer-right {
      display: table-cell;
      vertical-align: middle;
      text-align: right;
      width: 40%;
    }
    .footer img {
      max-height: 50px;
      margin: 5px;
    }
    .footer a {
      color: white;
    }
    .badge-container {
      text-align: center;
      margin: 20px 0;
    }
    .badge-container img {
      max-width: 180px;
    }
    .custom-message {
      background-color: #fff9e6;
      border: 1px solid #f5c518;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
    }
    .custom-message h3 {
      color: #b8860b;
      margin: 0 0 10px 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    ${content}
  </div>
</body>
</html>`;
}

// EO3 Class Info Pack Template
export const eoInfoPackTemplate: PrebuiltTemplate = {
  code: 'eo_info_pack',
  name: 'EO3 Class Info Pack',
  description: 'Information pack for Elementary Obedience 3 (EO3) class',
  classType: 'EO',
  subject: EO3_JAN_2026_SUBJECT,
  fields: [
    { key: 'class_day_time', label: 'Class Day & Time', type: 'text', placeholder: 'e.g., Saturdays 09h00 - 10h00', defaultValue: 'Saturdays 09h00 - 10h00' },
    { key: 'class_dates', label: 'Class Dates', type: 'text', placeholder: 'e.g., 18 Jan - 22 Mar 2026', defaultValue: '18 Jan - 22 Mar 2026' },
    { key: 'new_enrolment_price', label: 'New Enrolment Price', type: 'currency', placeholder: 'e.g., R1 680.00', defaultValue: 'R1 680.00' },
    { key: 'enrolment_fee', label: 'Enrolment Fee', type: 'currency', placeholder: 'e.g., R265.00', defaultValue: 'R265.00' },
    { key: 'total_price', label: 'Total (New enrolment)', type: 'currency', placeholder: 'e.g., R1 945.00', defaultValue: 'R1 945.00' },
    { key: 'graduate_price', label: 'Graduate Price', type: 'currency', placeholder: 'e.g., R1 680.00', defaultValue: 'R1 680.00' },
    { key: 'banking_details', label: 'Banking Details', type: 'textarea', placeholder: 'Bank name, account number, etc.', defaultValue: 'McKaynine (Pty) Ltd, FNB, Acc: 62792137827, Branch: 250655' },
  ],
  getHtml: () => EO3_JAN_2026_TEMPLATE,
};

// Puppy Class Info Pack Template
export const puppyInfoPackTemplate: PrebuiltTemplate = {
  code: 'puppy_info_pack',
  name: 'Puppy Class Info Pack',
  description: 'Information pack for Puppy class (8-16 weeks)',
  classType: 'Puppy',
  subject: 'Puppy Class Information - {{class_dates}}',
  fields: [
    { key: 'class_day_time', label: 'Class Day & Time', type: 'text', placeholder: 'e.g., Saturdays 10h00 - 11h00', defaultValue: 'Saturdays 10h00 - 11h00' },
    { key: 'class_dates', label: 'Class Dates', type: 'text', placeholder: 'e.g., 18 Jan - 22 Mar 2026', defaultValue: '18 Jan - 22 Mar 2026' },
    { key: 'course_price', label: 'Course Price', type: 'currency', placeholder: 'e.g., R1,200.00', defaultValue: 'R1,200.00' },
    { key: 'banking_details', label: 'Banking Details', type: 'textarea', placeholder: 'Bank name, account number, etc.', defaultValue: 'McKaynine (Pty) Ltd, FNB, Acc: 62792137827, Branch: 250655' },
  ],
  getHtml: (vars) => {
    const content = `
    <!-- Header -->
    <div class="header">
      <img src="{{base_url}}/email-assets/puppy_header.png" alt="Puppy Class - Ages 8-16 weeks">
    </div>

    {{#if custom_message}}
    <div class="custom-message">
      <h3>Message from {{branch_name}}:</h3>
      <p>{{custom_message}}</p>
    </div>
    {{/if}}

    <div class="content-wrapper">
      <div class="main-content" style="padding: 20px;">
        <p class="intro-text">Dear {{handler_name}},</p>
        
        <p class="intro-text"><strong>Start your puppy's training journey off right!</strong> Our Puppy Class provides essential socialisation and foundational training.</p>

        <ul class="benefits-list">
          <li>✓ Critical socialisation during the key developmental window</li>
          <li>✓ Basic manners and puppy-appropriate obedience</li>
          <li>✓ Handling exercises for vet visits and grooming</li>
          <li>✓ Play-based learning in a safe, supervised environment</li>
        </ul>

        <div class="section">
          <h1>When Are the Classes Held?</h1>
          <p><strong>Day & Time:</strong> ${vars.class_day_time || '{{class_day_time}}'}</p>
          <p><strong>Dates:</strong> ${vars.class_dates || '{{class_dates}}'}</p>
        </div>

        <div class="section">
          <h1>What Is The Entry Criteria?</h1>
          <p>Puppies must be between 8-16 weeks old at the start of the course and have had their first vaccination at least 7 days before the first class.</p>
        </div>

        <div class="section">
          <h1>How Much Does the Course Cost?</h1>
          <table class="pricing-table">
            <tr>
              <td>Puppy Course (6 weeks):</td>
              <td><strong>${vars.course_price || 'R1,200.00'}</strong></td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h1>How Do I Book?</h1>
          <div class="booking-note">
            <p>Secure your spot by making payment and emailing proof to us.</p>
            <p><strong>Payment can be made to:</strong><br>${vars.banking_details || '{{banking_details}}'}</p>
          </div>
        </div>

        <div class="badge-container">
          <img src="{{base_url}}/email-assets/spaces_are_limited.png" alt="Spaces are limited - book now!">
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-content">
        <div class="footer-left">
          <img src="{{base_url}}/email-assets/mckaynine_training_logo.jpg" alt="McKaynine Training" style="max-height: 60px;">
        </div>
        <div class="footer-right">
          <p style="margin: 0;">
            📱 {{branch_phone}}<br>
            ✉️ {{branch_email}}<br>
            🌐 www.mckaynine.co.za
          </p>
        </div>
      </div>
    </div>`;

    return wrapEmailHtml(content);
  }
};

// CGC Bronze Info Pack Template  
export const cgcBronzeInfoPackTemplate: PrebuiltTemplate = {
  code: 'cgc_bronze_info_pack',
  name: 'CGC Bronze Info Pack',
  description: 'Information pack for Canine Good Citizen Bronze class',
  classType: 'CGC Bronze',
  subject: 'CGC Bronze Class Information - {{class_dates}}',
  fields: [
    { key: 'class_day_time', label: 'Class Day & Time', type: 'text', placeholder: 'e.g., Saturdays 11h00 - 12h00', defaultValue: 'Saturdays 11h00 - 12h00' },
    { key: 'class_dates', label: 'Class Dates', type: 'text', placeholder: 'e.g., 18 Jan - 22 Mar 2026', defaultValue: '18 Jan - 22 Mar 2026' },
    { key: 'new_enrolment_price', label: 'New Enrolment Price', type: 'currency', placeholder: 'e.g., R1,850.00', defaultValue: 'R1,850.00' },
    { key: 'enrolment_fee', label: 'Enrolment Fee', type: 'currency', placeholder: 'e.g., R265.00', defaultValue: 'R265.00' },
    { key: 'graduate_price', label: 'EO Graduate Price', type: 'currency', placeholder: 'e.g., R1,850.00', defaultValue: 'R1,850.00' },
    { key: 'banking_details', label: 'Banking Details', type: 'textarea', placeholder: 'Bank name, account number, etc.', defaultValue: 'McKaynine (Pty) Ltd, FNB, Acc: 62792137827, Branch: 250655' },
  ],
  getHtml: (vars) => {
    const content = `
    <!-- Header -->
    <div class="header">
      <img src="{{base_url}}/email-assets/cgc_bronze_header.png" alt="CGC Bronze - Canine Good Citizen">
    </div>

    {{#if custom_message}}
    <div class="custom-message">
      <h3>Message from {{branch_name}}:</h3>
      <p>{{custom_message}}</p>
    </div>
    {{/if}}

    <div class="content-wrapper">
      <div class="main-content" style="padding: 20px;">
        <p class="intro-text">Dear {{handler_name}},</p>
        
        <p class="intro-text"><strong>Take your dog's training to the next level!</strong> The CGC Bronze program builds on foundation skills for real-world reliability.</p>

        <ul class="benefits-list">
          <li>✓ AKC Canine Good Citizen certification pathway</li>
          <li>✓ Advanced obedience in distracting environments</li>
          <li>✓ Polite greetings and public behaviour skills</li>
          <li>✓ Preparing for the Bronze assessment test</li>
        </ul>

        <div class="section">
          <h1>When Are the Classes Held?</h1>
          <p><strong>Day & Time:</strong> ${vars.class_day_time || '{{class_day_time}}'}</p>
          <p><strong>Dates:</strong> ${vars.class_dates || '{{class_dates}}'}</p>
        </div>

        <div class="section">
          <h1>What Is The Entry Criteria?</h1>
          <p>Completion of the EO course or equivalent foundation training. An assessment may be required for new handlers.</p>
        </div>

        <div class="section">
          <h1>How Much Does the Course Cost?</h1>
          <table class="pricing-table">
            <tr>
              <td>New enrolments:</td>
              <td><strong>${vars.new_enrolment_price || 'R1,850.00'}</strong> plus ${vars.enrolment_fee || 'R265.00'} enrolment fee.</td>
            </tr>
            <tr>
              <td>EO Course graduate:</td>
              <td><strong>${vars.graduate_price || 'R1,850.00'}</strong></td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h1>How Do I Book?</h1>
          <div class="booking-note">
            <p><strong>EO Graduate</strong> - Your course fee and an email secures your spot!</p>
            <p><strong>Payment can be made to:</strong><br>${vars.banking_details || '{{banking_details}}'}</p>
          </div>
        </div>

        <div class="badge-container">
          <img src="{{base_url}}/email-assets/spaces_are_limited.png" alt="Spaces are limited - book now!">
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-content">
        <div class="footer-left">
          <img src="{{base_url}}/email-assets/mckaynine_training_logo.jpg" alt="McKaynine Training" style="max-height: 60px;">
        </div>
        <div class="footer-right">
          <p style="margin: 0;">
            📱 {{branch_phone}}<br>
            ✉️ {{branch_email}}<br>
            🌐 www.mckaynine.co.za
          </p>
        </div>
      </div>
    </div>`;

    return wrapEmailHtml(content);
  }
};

// CGC Silver Info Pack Template
export const cgcSilverInfoPackTemplate: PrebuiltTemplate = {
  code: 'cgc_silver_info_pack',
  name: 'CGC Silver Info Pack',
  description: 'Information pack for Canine Good Citizen Silver class',
  classType: 'CGC Silver',
  subject: 'CGC Silver Class Information - {{class_dates}}',
  fields: [
    { key: 'class_day_time', label: 'Class Day & Time', type: 'text', placeholder: 'e.g., Saturdays 12h00 - 13h00', defaultValue: 'Saturdays 12h00 - 13h00' },
    { key: 'class_dates', label: 'Class Dates', type: 'text', placeholder: 'e.g., 18 Jan - 22 Mar 2026', defaultValue: '18 Jan - 22 Mar 2026' },
    { key: 'course_price', label: 'Course Price', type: 'currency', placeholder: 'e.g., R1,950.00', defaultValue: 'R1,950.00' },
    { key: 'banking_details', label: 'Banking Details', type: 'textarea', placeholder: 'Bank name, account number, etc.', defaultValue: 'McKaynine (Pty) Ltd, FNB, Acc: 62792137827, Branch: 250655' },
  ],
  getHtml: (vars) => {
    const content = `
    <!-- Header -->
    <div class="header">
      <img src="{{base_url}}/email-assets/cgc_silver_header.png" alt="CGC Silver - Canine Good Citizen">
    </div>

    {{#if custom_message}}
    <div class="custom-message">
      <h3>Message from {{branch_name}}:</h3>
      <p>{{custom_message}}</p>
    </div>
    {{/if}}

    <div class="content-wrapper">
      <div class="main-content" style="padding: 20px;">
        <p class="intro-text">Dear {{handler_name}},</p>
        
        <p class="intro-text"><strong>Continue your CGC journey!</strong> The Silver level builds advanced skills for a truly well-mannered companion.</p>

        <ul class="benefits-list">
          <li>✓ Advanced CGC certification level</li>
          <li>✓ Off-lead reliability in controlled environments</li>
          <li>✓ Distance commands and recalls</li>
          <li>✓ Preparing for the Silver assessment test</li>
        </ul>

        <div class="section">
          <h1>When Are the Classes Held?</h1>
          <p><strong>Day & Time:</strong> ${vars.class_day_time || '{{class_day_time}}'}</p>
          <p><strong>Dates:</strong> ${vars.class_dates || '{{class_dates}}'}</p>
        </div>

        <div class="section">
          <h1>What Is The Entry Criteria?</h1>
          <p>Successful completion of CGC Bronze or equivalent certification.</p>
        </div>

        <div class="section">
          <h1>How Much Does the Course Cost?</h1>
          <table class="pricing-table">
            <tr>
              <td>CGC Silver Course:</td>
              <td><strong>${vars.course_price || 'R1,950.00'}</strong></td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h1>How Do I Book?</h1>
          <div class="booking-note">
            <p>Your course fee and an email secures your spot!</p>
            <p><strong>Payment can be made to:</strong><br>${vars.banking_details || '{{banking_details}}'}</p>
          </div>
        </div>

        <div class="badge-container">
          <img src="{{base_url}}/email-assets/spaces_are_limited.png" alt="Spaces are limited - book now!">
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-content">
        <div class="footer-left">
          <img src="{{base_url}}/email-assets/mckaynine_training_logo.jpg" alt="McKaynine Training" style="max-height: 60px;">
        </div>
        <div class="footer-right">
          <p style="margin: 0;">
            📱 {{branch_phone}}<br>
            ✉️ {{branch_email}}<br>
            🌐 www.mckaynine.co.za
          </p>
        </div>
      </div>
    </div>`;

    return wrapEmailHtml(content);
  }
};

// All available pre-built templates
export const PREBUILT_TEMPLATES: PrebuiltTemplate[] = [
  eoInfoPackTemplate,
  puppyInfoPackTemplate,
  cgcBronzeInfoPackTemplate,
  cgcSilverInfoPackTemplate,
];

// Helper to get template by code
export function getPrebuiltTemplate(code: string): PrebuiltTemplate | undefined {
  return PREBUILT_TEMPLATES.find(t => t.code === code);
}

// Helper to get templates by class type
export function getTemplatesForClassType(classType: string): PrebuiltTemplate[] {
  return PREBUILT_TEMPLATES.filter(t => 
    t.classType.toLowerCase() === classType.toLowerCase()
  );
}
