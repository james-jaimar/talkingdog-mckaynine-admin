/**
 * Payment Receipt Email Template
 * Sent automatically when an invoice is marked as paid
 */

export const PAYMENT_RECEIPT_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 3px solid #2c5530;">
              <h1 style="margin: 0; color: #2c5530; font-size: 28px; font-weight: 700;">Payment Received ✅</h1>
              <p style="margin: 12px 0 0; color: #6c757d; font-size: 14px;">Receipt #{{invoice_number}}</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
                Dear {{handler_name}},
              </p>
              
              <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
                Thank you for your payment! This email confirms that we have received your payment in full.
              </p>
              
              <!-- Payment Summary Box -->
              {{payment_summary}}
              
              <!-- Items Breakdown -->
              {{items_breakdown}}
              
              <!-- Thank You Message -->
              <div style="margin: 24px 0; padding: 16px; background-color: #e8f4e9; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #2c5530; font-size: 16px; font-weight: 600;">
                  Thank you for choosing McKaynine! 🐕
                </p>
              </div>
              
              <p style="margin: 24px 0 0; color: #555; font-size: 14px; line-height: 1.6;">
                Please keep this email as your receipt for your records. If you have any questions about this payment, please don't hesitate to contact us.
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
                This is an automated payment receipt. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const PAYMENT_RECEIPT_SUBJECT = "✅ Payment Receipt - {{invoice_number}}";
