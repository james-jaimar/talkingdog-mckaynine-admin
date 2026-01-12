-- Insert Class Confirmation Email template for each branch that doesn't already have one
INSERT INTO public.branch_email_templates (branch_id, name, type, subject, content, class_type, is_active, variables)
SELECT 
  b.id,
  'Class Confirmation Email',
  'class_confirmation',
  '🐕 Class Enrollment Confirmed - {{class_name}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Class Enrollment Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 3px solid #2c5530;">
              <h1 style="margin: 0; color: #2c5530; font-size: 28px; font-weight: 700;">Enrollment Confirmed! 🎉</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
                Dear {{handler_name}},
              </p>
              
              <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
                Thank you for your payment! We''re excited to confirm that your enrollment is complete.
              </p>
              
              <!-- Class Details Box -->
              <div style="background-color: #e8f4e9; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #2c5530;">
                <h2 style="margin: 0 0 16px; color: #2c5530; font-size: 18px; font-weight: 600;">📋 Class Details</h2>
                {{class_details}}
              </div>
              
              <!-- What to Bring Section -->
              <div style="margin: 24px 0;">
                <h3 style="margin: 0 0 12px; color: #2c5530; font-size: 16px; font-weight: 600;">🎒 What to Bring:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
                  <li>Your dog on a flat collar and lead</li>
                  <li>High-value treats (small, soft pieces work best)</li>
                  <li>Water bowl and fresh water</li>
                  <li>Poop bags</li>
                  <li>A positive attitude! 😊</li>
                </ul>
              </div>
              
              <!-- Reminder Box -->
              <div style="background-color: #fff3cd; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⏰ Please arrive 5-10 minutes early</strong> for your first class so we can get you settled in.
                </p>
              </div>
              
              <p style="margin: 24px 0 0; color: #333; font-size: 16px; line-height: 1.6;">
                We look forward to seeing you at class!
              </p>
            </td>
          </tr>
          
          <!-- Signature -->
          <tr>
            <td style="padding: 0 40px 40px;">
              {{signature}}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #6c757d; font-size: 12px;">
                If you have any questions, please don''t hesitate to contact us.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  NULL,
  true,
  '["handler_name", "class_details", "class_name", "signature"]'::jsonb
FROM public.branches b
WHERE NOT EXISTS (
  SELECT 1 FROM public.branch_email_templates bet 
  WHERE bet.branch_id = b.id AND bet.type = 'class_confirmation'
);