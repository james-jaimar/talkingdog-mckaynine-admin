// EO3 Jan 2026 Email Template
// This template uses merge fields that will be replaced with actual values

export const EO3_JAN_2026_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elementary Obedience (EO3) - McKaynine Training</title>
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
      max-width: 100%;
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
    <!-- Header with EO3 Banner -->
    <div class="header">
      <img src="{{base_url}}/email-assets/EO3_header_image.png" alt="Elementary Obedience (EO3) - Ages 4 months+" style="max-width: 400px;">
    </div>

    <!-- Custom Message Section (if provided) -->
    {{#if custom_message}}
    <div class="custom-message">
      <h3>Message from {{branch_name}}:</h3>
      <p>{{custom_message}}</p>
    </div>
    {{/if}}

    <div class="content-wrapper">
      <!-- Left Column with Photos -->
      <div class="left-column">
        <img src="{{base_url}}/email-assets/EO3_LHS_Image.jpg" alt="Happy dogs and handlers at McKaynine">
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <p class="intro-text">Dear {{handler_name}},</p>
        
        <p class="intro-text"><strong>Imagine being able to take your dog anywhere with you...</strong> With good instruction and some commitment, it is possible!</p>

        <ul class="benefits-list">
          <li>✓ Essential obedience and focus skills for calm, reliable everyday behaviour</li>
          <li>✓ Reward-based training methods that build trust and confidence</li>
          <li>✓ Guided practice and feedback through fun, practical sessions with expert support</li>
        </ul>

        <div class="section">
          <h1>When Are the Classes Held?</h1>
          <p><strong>Day & Time:</strong> {{class_day_time}}</p>
          <p><strong>Dates:</strong> {{class_dates}}</p>
        </div>

        <div class="section">
          <h1>What Is The Entry Criteria?</h1>
          <p>An assessment is required before we can confirm enrolment in any of our courses.</p>
          <p><strong>New to McKaynine</strong> - The assessments are free of charge and are by appointment only. Kindly contact us to set this up.</p>
          <p><strong>McKaynine Puppy graduate</strong> - Completion of a recent McKaynine Puppy Course.</p>
        </div>

        <div class="section">
          <h1>How Much Does the Course Cost?</h1>
          <table class="pricing-table">
            <tr>
              <td>New enrolments:</td>
              <td><strong>R1 680.00</strong> plus R265.00 enrolment fee.<br>Total: <strong>R1 945.00</strong></td>
            </tr>
            <tr>
              <td>McKaynine Puppy Course graduate:</td>
              <td><strong>R1 680.00</strong></td>
            </tr>
            <tr>
              <td colspan="2"><em>A simultaneous enrolment from the same household receives a 25% discount (not applicable to enrolment fee).</em></td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h1>How Do I Book a Space / Assessment?</h1>
          <div class="booking-note">
            <p><strong>Puppy Class Graduate</strong> - Your course fee and an email secures your spot!</p>
            <p><strong>Payment can be made to:</strong><br>{{banking_details}}</p>
          </div>
          <p><strong>New Dog Assessment:</strong> Please either complete the online assessment form and submit a copy of your dog's vaccination record OR email the form and vaccination record to us.</p>
        </div>

        <div class="badge-container">
          <img src="{{base_url}}/email-assets/spaces_are_limited.png" alt="Spaces are limited - book now to secure your spot!">
        </div>

        <div class="section">
          <h1>What Do I Need to Bring?</h1>
          <ul class="benefits-list">
            <li>Dog wearing a normal flat buckle collar or a half-check and a webbing lead (no chain or extendable leads please), comfortable flat shoes and a hat during warm weather.</li>
            <li>Small easily consumed treats. We suggest Vienna sausages, polony, boiled chicken or any soft dog treat (no biscuits please). We also sell baked liver treats at classes.</li>
          </ul>
        </div>

        <div class="section">
          <h1>Why Choose McKaynine?</h1>
          <ul class="benefits-list">
            <li>McKaynine (Pty) Ltd is owned by Shannon McKay, who holds a MSc degree in Zoology (animal behaviour) and international certification with the CCPDT – assuring you of the most advanced knowledge and techniques.</li>
            <li>Our instructors have undergone extensive training and are a veritable "who's who" in the SA dog training field.</li>
            <li>McKaynine is recommended by leading professionals in the field.</li>
            <li>One of the biggest full-service dog training facilities in South Africa.</li>
          </ul>
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
          <img src="{{base_url}}/email-assets/ccpdt_logo.png" alt="CCPDT - Certification Council for Professional Dog Trainers" style="max-height: 40px; margin-top: 10px;">
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

export const EO3_JAN_2026_SUBJECT = "Elementary Obedience (EO3) Class Information - January 2026";

export const EO3_JAN_2026_VARIABLES = [
  "handler_name",
  "dog_name",
  "class_day_time",
  "class_dates",
  "banking_details",
  "branch_name",
  "branch_phone",
  "branch_email",
  "base_url",
  "custom_message"
];
