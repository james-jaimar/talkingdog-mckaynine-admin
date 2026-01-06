// EO3 Jan 2026 Email Template
// Exact layout match from PDF template

export const EO3_JAN_2026_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elementary Obedience (EO3) - McKaynine Training</title>
  <!--[if mso]>
  <style type="text/css">
    table, td {border-collapse: collapse;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.4; color: #333333; background-color: #ffffff;">
  
  <!-- Main Container Table -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
    <tr>
      <td align="center">
        <table role="presentation" width="700" cellpadding="0" cellspacing="0" border="0" style="max-width: 700px; width: 100%;">
          
          <!-- Header Row: LHS Image Column + Header + Logo -->
          <tr>
            <!-- Left Image Strip (rowspan for entire content) -->
            <td width="145" valign="top" rowspan="15" style="width: 145px; padding: 0;">
              <img src="{{base_url}}/email-assets/EO3_LHS_Image.jpg" alt="Dogs at McKaynine" width="145" style="display: block; width: 145px; height: auto; border: 0;">
            </td>
            
            <!-- Main Content Area -->
            <td valign="top" style="padding: 15px 20px 10px 15px;">
              <!-- Header: EO3 Badge + McKaynine Logo -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="padding-bottom: 15px;">
                    <img src="{{base_url}}/email-assets/EO3_header_image.png" alt="Elementary Obedience (EO3) Ages 4 months+" width="280" style="display: inline-block; max-width: 280px; height: auto; border: 0;">
                  </td>
                  <td valign="middle" align="right" style="padding-bottom: 15px;">
                    <img src="{{base_url}}/email-assets/mckaynine_training_logo.jpg" alt="McKaynine Training" width="140" style="display: inline-block; max-width: 140px; height: auto; border: 0;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Custom Message Section (if provided) -->
          {{#if custom_message}}
          <tr>
            <td style="padding: 10px 20px 10px 15px;">
              <table role="presentation" width="100%" cellpadding="12" cellspacing="0" style="background-color: #fff9e6; border: 1px solid #f5c518; border-radius: 5px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; color: #b8860b; font-weight: bold; font-size: 13px;">Message from {{branch_name}}:</p>
                    <p style="margin: 0; color: #333;">{{custom_message}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          {{/if}}
          
          <!-- Intro Tagline -->
          <tr>
            <td style="padding: 0 20px 10px 15px;">
              <p style="margin: 0; font-style: italic; color: #2b5797; font-size: 14px; font-weight: bold;">
                Imagine being able to take your dog anywhere with you...<br>
                With good instruction and some commitment, it is possible!
              </p>
            </td>
          </tr>
          
          <!-- Benefits with Blue Checkmarks -->
          <tr>
            <td style="padding: 0 20px 15px 15px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="24" valign="top" style="color: #2b9e3e; font-size: 16px; padding-right: 6px;">✔</td>
                  <td style="padding-bottom: 5px;"><strong>Essential obedience and focus skills</strong> for calm, reliable everyday behaviour</td>
                </tr>
                <tr>
                  <td width="24" valign="top" style="color: #2b9e3e; font-size: 16px; padding-right: 6px;">✔</td>
                  <td style="padding-bottom: 5px;"><strong>Reward-based training methods</strong> that build trust and confidence</td>
                </tr>
                <tr>
                  <td width="24" valign="top" style="color: #2b9e3e; font-size: 16px; padding-right: 6px;">✔</td>
                  <td style="padding-bottom: 5px;"><strong>Guided practice and feedback</strong> through fun, practical sessions with expert support</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- When Are the Classes Held? -->
          <tr>
            <td style="padding: 0 20px 12px 15px;">
              <p style="margin: 0 0 8px 0; color: #2b5797; font-size: 14px; font-weight: bold; text-decoration: underline;">When Are the Classes Held?</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right: 15px; vertical-align: top;">Day &amp; Time:</td>
                  <td style="color: #555; font-style: italic;">{{class_day_time}}</td>
                </tr>
                <tr>
                  <td style="padding-right: 15px; vertical-align: top;">Dates:</td>
                  <td style="color: #555; font-style: italic;">{{class_dates}}</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- What Is The Entry Criteria? -->
          <tr>
            <td style="padding: 0 20px 12px 15px;">
              <p style="margin: 0 0 8px 0; color: #2b5797; font-size: 14px; font-weight: bold; text-decoration: underline;">What Is The Entry Criteria?</p>
              <p style="margin: 0 0 6px 0;">An assessment is required before we can confirm enrolment in any of our courses.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top" width="140" style="padding-right: 10px;">New to McKaynine -</td>
                  <td>The assessments are free of charge and are by appointment only. Kindly contact us to set this up.</td>
                </tr>
                <tr><td colspan="2" style="height: 6px;"></td></tr>
                <tr>
                  <td valign="top" style="padding-right: 10px;">McKaynine Puppy<br>graduate -</td>
                  <td>Completion of a recent McKaynine Puppy Course.</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- How Much Does the Course Cost? + Spaces Limited Badge -->
          <tr>
            <td style="padding: 0 20px 12px 15px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top" style="width: 70%;">
                    <p style="margin: 0 0 8px 0; color: #2b5797; font-size: 14px; font-weight: bold; text-decoration: underline;">How Much Does the Course Cost?</p>
                    <p style="margin: 0 0 4px 0;">New enrolments : <strong>{{new_enrolment_price}}</strong> plus {{enrolment_fee}} enrolment fee. Total: <strong>{{total_price}}</strong>.</p>
                    <p style="margin: 0 0 4px 0;">McKaynine Puppy Course graduate: <strong>{{graduate_price}}</strong>.</p>
                    <p style="margin: 0; font-size: 12px; color: #555;">A simultaneous enrolment from the same household receives a 25% discount<br>(not applicable to enrolment fee).</p>
                  </td>
                  <td valign="top" align="right" style="width: 30%;">
                    <img src="{{base_url}}/email-assets/spaces_are_limited.png" alt="Spaces are limited - book now to secure your spot!" width="110" style="display: block; max-width: 110px; height: auto; border: 0;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- How Do I Book a Space / Assessment? -->
          <tr>
            <td style="padding: 0 20px 12px 15px;">
              <p style="margin: 0 0 8px 0; color: #2b5797; font-size: 14px; font-weight: bold; text-decoration: underline;">How Do I Book a Space / Assessment?</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top" width="150" style="padding-right: 10px;">Puppy Class Graduate<br>Booking&gt;&gt;</td>
                  <td>Your course fee and an email secures your spot! Payment can be made to:<br><span style="color: #555; font-style: italic;">{{banking_details}}</span></td>
                </tr>
                <tr><td colspan="2" style="height: 8px;"></td></tr>
                <tr>
                  <td valign="top" style="padding-right: 10px;">New Dog Assessment&gt;&gt;</td>
                  <td>Please either complete the online assessment form and submit a copy of your dog's vaccination record OR email the form and vaccination record to us.</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- What Do I Need to Bring? -->
          <tr>
            <td style="padding: 0 20px 12px 15px;">
              <p style="margin: 0 0 8px 0; color: #2b5797; font-size: 14px; font-weight: bold; text-decoration: underline;">What Do I Need to Bring?</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="24" valign="top" style="color: #2b9e3e; font-size: 16px; padding-right: 6px;">✔</td>
                  <td style="padding-bottom: 6px;">Dog wearing a normal flat buckle collar or a half-check and a webbing lead (no chain or extendable leads please), comfortable flat shoes and a hat during warm weather</td>
                </tr>
                <tr>
                  <td width="24" valign="top" style="color: #2b9e3e; font-size: 16px; padding-right: 6px;">✔</td>
                  <td>Small easily consumed treats. We suggest Vienna sausages, polony, boiled chicken or any soft dog treat (no biscuits please). We also sell baked liver treats at classes.</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Why Choose McKaynine? -->
          <tr>
            <td style="padding: 0 20px 15px 15px;">
              <p style="margin: 0 0 8px 0; color: #2b5797; font-size: 14px; font-weight: bold; text-decoration: underline;">Why Choose McKaynine?</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;">McKaynine (Pty) Ltd is owned by Shannon McKay, who holds a MSc degree in Zoology (animal behaviour) and international certification with the CCPDT – assuring you of the most advanced knowledge and techniques</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;">Our instructors have undergone extensive training and are a veritable "who's who" in the SA dog training field</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;">McKaynine is recommended by leading professionals in the field</p>
              <p style="margin: 0; font-size: 12px;">One of the biggest full-service dog training facilities in South Africa</p>
            </td>
          </tr>
          
          <!-- Footer: Contact Info + Logos -->
          <tr>
            <td style="padding: 15px 20px 20px 15px; border-top: 1px solid #ddd;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Contact Info with Icons -->
                  <td valign="middle" style="width: 55%;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-bottom: 4px;">
                          <span style="color: #2b5797; font-size: 16px;">📱</span>
                          <span style="color: #555; font-style: italic; margin-left: 6px;">{{branch_phone}}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 4px;">
                          <span style="color: #2b5797; font-size: 16px;">✉️</span>
                          <span style="color: #555; font-style: italic; margin-left: 6px;">{{branch_email}}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="color: #2b5797; font-size: 16px;">🌐</span>
                          <a href="https://www.mckaynine.co.za" style="color: #2b5797; text-decoration: none; margin-left: 6px;">www.mckaynine.co.za</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  
                  <!-- McKaynine Logo + CCPDT Badge -->
                  <td valign="middle" align="right" style="width: 45%;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="right" style="padding-bottom: 8px;">
                          <img src="{{base_url}}/email-assets/mckaynine_training_logo.jpg" alt="McKaynine Training" width="120" style="display: block; max-width: 120px; height: auto; border: 0;">
                        </td>
                      </tr>
                      <tr>
                        <td align="right">
                          <img src="{{base_url}}/email-assets/ccpdt_logo.png" alt="CCPDT - Certification Council for Professional Dog Trainers" width="150" style="display: block; max-width: 150px; height: auto; border: 0;">
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
  
</body>
</html>`;

export const EO3_JAN_2026_SUBJECT = "Elementary Obedience (EO3) Class Information - {{class_dates}}";

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
