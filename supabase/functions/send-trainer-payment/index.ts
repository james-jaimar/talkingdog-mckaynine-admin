import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

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
        JSON.stringify({ 
          success: false, 
          message: "Missing trainer email",
          emailSent: false
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Get Supabase configuration from env
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email service configuration is incomplete",
          emailSent: false
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Format payment method for display
    const paymentMethod = payload.paymentDetails?.method || "bank_transfer";
    let paymentMethodDisplay = "Bank Transfer";
    if (paymentMethod === "cash") paymentMethodDisplay = "Cash";
    if (paymentMethod === "check") paymentMethodDisplay = "Check";
    if (paymentMethod === "other") paymentMethodDisplay = "Other";

    // Build email content
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2980b9;
            padding: 20px;
            text-align: center;
            color: white;
          }
          .content {
            padding: 20px;
            background-color: #f9f9f9;
          }
          .details-box {
            background-color: white;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666666;
            border-top: 1px solid #e0e0e0;
          }
          h1 {
            color: #2980b9;
            margin-top: 0;
          }
          h2 {
            color: #2980b9;
            font-size: 18px;
            margin-top: 0;
          }
          .btn {
            display: inline-block;
            background-color: #2980b9;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
          }
          .amount {
            font-size: 22px;
            font-weight: bold;
            color: #2980b9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Confirmation</h1>
          </div>
          <div class="content">
            <p>Dear ${payload.trainerName || "Trainer"},</p>
            
            <p>We are pleased to confirm that your payment for training services has been processed.</p>
            
            <div class="details-box">
              <h2>Payment Details</h2>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Method:</strong> ${paymentMethodDisplay}</p>
              ${payload.paymentDetails?.transactionId ? `<p><strong>Transaction ID:</strong> ${payload.paymentDetails.transactionId}</p>` : ""}
              ${payload.amount ? `<p><strong>Amount:</strong> <span class="amount">R ${payload.amount.toFixed(2)}</span></p>` : ""}
              ${payload.paymentDetails?.notes ? `<p><strong>Notes:</strong> ${payload.paymentDetails.notes}</p>` : ""}
            </div>
            
            ${payload.documentUrl ? `
            <p>Your detailed payment document is attached to this email. You can also view it online by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${payload.documentUrl}" class="btn" target="_blank">View Payment Document</a>
            </p>
            ` : ""}
            
            <p>Thank you for your services and dedication to our training program.</p>
            
            <p style="margin: 20px 0 0 0; font-size: 14px; color: #333333; line-height: 1.6;">
              <strong style="color: #2c5530;">Ady Hawkins</strong><br>
              Branch Manager<br>
              📞 083 400 2987<br>
              McKaynine Training Centre<br>
              ✉️ <a href="mailto:delta@mckaynine.co.za" style="color: #3b82f6; text-decoration: none;">delta@mckaynine.co.za</a><br>
              🌐 <a href="https://www.mckaynine.co.za" style="color: #3b82f6; text-decoration: none;">www.mckaynine.co.za</a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} McKaynine Training Centre. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Prepare attachments
    const attachments: Array<{
      filename: string;
      content: string;
      encoding: string;
      contentType: string;
    }> = [];

    // Try to download the PDF from documentUrl if provided
    if (payload.documentUrl) {
      try {
        console.log("Attempting to fetch document from URL for attachment:", payload.documentUrl);
        const pdfResponse = await fetch(payload.documentUrl);
        
        if (pdfResponse.ok) {
          const pdfArrayBuffer = await pdfResponse.arrayBuffer();
          const pdfBase64 = encode(new Uint8Array(pdfArrayBuffer));

          attachments.push({
            filename: payload.documentName || "payment_confirmation.pdf",
            content: pdfBase64,
            encoding: "base64",
            contentType: "application/pdf"
          });
          console.log("Successfully attached document from URL");
        } else {
          console.error("Failed to fetch PDF from URL:", pdfResponse.status, pdfResponse.statusText);
        }
      } catch (fetchError) {
        console.error("Error fetching document from URL:", fetchError);
      }
    } else if (payload.pdfData) {
      attachments.push({
        filename: payload.documentName || "payment_confirmation.pdf",
        content: payload.pdfData,
        encoding: "base64",
        contentType: "application/pdf"
      });
      console.log("Using provided PDF data for attachment");
    }

    // Send email via SMTP function
    const smtpFunctionUrl = `${supabaseUrl}/functions/v1/send-with-smtp`;
    
    console.log("Sending email via SMTP to:", payload.to);
    
    const response = await fetch(smtpFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        to: payload.to,
        subject: "Payment Confirmation for Training Services",
        html: emailHtml,
        attachments: attachments.length > 0 ? attachments : undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SMTP function error:", response.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Failed to send email: ${errorText}`,
          emailSent: false
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const result = await response.json();
    console.log("Email sent successfully via SMTP:", result);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        emailSent: true,
        hasAttachment: attachments.length > 0
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Unhandled error in send-trainer-payment:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || "An unexpected error occurred",
        emailSent: false,
        error: error.name || "UnhandledError"
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
