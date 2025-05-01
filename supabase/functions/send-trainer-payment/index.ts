
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

// Initialize Resend with API key from environment variable
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  trainerName: string;
  pdfData: string;
  amount: number;
  paymentDetails: {
    method: string;
    transactionId?: string;
    notes?: string;
  };
}

const formatPaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    'bank_transfer': 'Bank Transfer',
    'cash': 'Cash',
    'check': 'Check',
    'other': 'Other'
  };
  
  return methodMap[method] || method;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const payload: EmailRequest = await req.json();
    const { to, trainerName, pdfData, amount, paymentDetails } = payload;
    
    // Verify required fields
    if (!to || !trainerName || !pdfData || amount === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Format payment method for email display
    const methodFormatted = formatPaymentMethod(paymentDetails.method);
    
    // Create the email HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header img { max-width: 200px; }
          h1 { color: #2c3e50; margin-bottom: 20px; }
          .payment-details { background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
          .amount { font-size: 18px; font-weight: bold; }
          .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Confirmation</h1>
          </div>
          
          <p>Dear ${trainerName},</p>
          
          <p>We are pleased to inform you that a payment has been processed for your training services at McKaynine Training Centre.</p>
          
          <div class="payment-details">
            <p><strong>Amount:</strong> <span class="amount">${formatCurrency(amount)}</span></p>
            <p><strong>Payment Method:</strong> ${methodFormatted}</p>
            ${paymentDetails.transactionId ? `<p><strong>Transaction ID:</strong> ${paymentDetails.transactionId}</p>` : ''}
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          ${paymentDetails.notes ? `<p><strong>Additional Notes:</strong><br>${paymentDetails.notes}</p>` : ''}
          
          <p>Please find attached a detailed payment summary in PDF format.</p>
          
          <p>Thank you for your continued partnership with McKaynine Training Centre.</p>
          
          <p>Best regards,<br>
          McKaynine Training Centre</p>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Send the email with PDF attachment
    const { data, error } = await resend.emails.send({
      from: 'McKaynine Training <payments@mckaynine.com>',
      to: [to],
      subject: `Payment Confirmation - ${formatCurrency(amount)}`,
      html: html,
      attachments: [
        {
          filename: `payment_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfData
        }
      ]
    });
    
    if (error) {
      console.error("Error sending email:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
    
  } catch (error) {
    console.error("Error in send-trainer-payment function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
