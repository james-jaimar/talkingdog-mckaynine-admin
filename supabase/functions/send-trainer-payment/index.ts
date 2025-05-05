
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentEmailRequest {
  to?: string;
  trainerName?: string;
  pdfData?: string;
  amount?: number;
  paymentDetails?: {
    method?: string;
    transactionId?: string;
    notes?: string;
  };
  documentUrl?: string;
  documentName?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const payload: PaymentEmailRequest = await req.json();
    console.log("Processing trainer payment email request:", {
      to: payload.to,
      trainerName: payload.trainerName,
      hasPdfData: !!payload.pdfData,
      hasDocumentUrl: !!payload.documentUrl,
      amount: payload.amount
    });

    // If no required recipient info, return error
    if (!payload.to) {
      return new Response(
        JSON.stringify({ error: "Missing trainer email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Format payment method for display
    let paymentMethod = payload.paymentDetails?.method || "bank_transfer";
    let paymentMethodDisplay = "Bank Transfer";
    if (paymentMethod === 'cash') paymentMethodDisplay = "Cash";
    if (paymentMethod === 'check') paymentMethodDisplay = "Check";
    if (paymentMethod === 'other') paymentMethodDisplay = "Other";

    // Initialize Resend email client
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ error: "Email service configuration is incomplete" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    const resend = new Resend(resendApiKey);

    // Build email content
    const emailHtml = `
      <h1>Payment Confirmation</h1>
      <p>Dear ${payload.trainerName || "Trainer"},</p>
      
      <p>We are pleased to confirm that your payment for training services has been processed.</p>
      
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="margin-top: 0;">Payment Details</h2>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Method:</strong> ${paymentMethodDisplay}</p>
        ${payload.paymentDetails?.transactionId ? `<p><strong>Transaction ID:</strong> ${payload.paymentDetails.transactionId}</p>` : ''}
        ${payload.amount ? `<p><strong>Amount:</strong> R ${payload.amount.toFixed(2)}</p>` : ''}
        ${payload.paymentDetails?.notes ? `<p><strong>Notes:</strong> ${payload.paymentDetails.notes}</p>` : ''}
      </div>
      
      ${payload.documentUrl ? `
      <p>You can view your payment document here: <a href="${payload.documentUrl}" target="_blank">View Document</a></p>
      ` : ''}
      
      <p>Thank you for your services and dedication to our training program.</p>
      
      <p>Best regards,<br>McKaynine Training Centre</p>
    `;

    // Determine if we're sending with pdf attachment or just a link
    let emailOptions: any = {
      from: "McKaynine Training <accounts@mckaynine-training.co.za>",
      to: [payload.to],
      subject: "Payment Confirmation for Training Services",
      html: emailHtml
    };
    
    // Add attachment if PDF data is provided
    if (payload.pdfData) {
      emailOptions.attachments = [
        {
          filename: payload.documentName || "payment_confirmation.pdf",
          content: payload.pdfData
        }
      ];
    }

    // Send the email
    try {
      console.log("Sending email to:", payload.to);
      const emailResult = await resend.emails.send(emailOptions);
      console.log("Email sending result:", emailResult);
      
      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({ error: `Failed to send email: ${emailError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error("Unhandled error in send-trainer-payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
