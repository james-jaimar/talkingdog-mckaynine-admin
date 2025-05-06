
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
        JSON.stringify({ 
          success: false, 
          message: "Missing trainer email",
          emailSent: false
        }),
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
        JSON.stringify({ 
          success: false, 
          message: "Email service configuration is incomplete",
          emailSent: false
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    const resend = new Resend(resendApiKey);

    // Build email content - enhanced version with better styling
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
              ${payload.paymentDetails?.transactionId ? `<p><strong>Transaction ID:</strong> ${payload.paymentDetails.transactionId}</p>` : ''}
              ${payload.amount ? `<p><strong>Amount:</strong> <span class="amount">R ${payload.amount.toFixed(2)}</span></p>` : ''}
              ${payload.paymentDetails?.notes ? `<p><strong>Notes:</strong> ${payload.paymentDetails.notes}</p>` : ''}
            </div>
            
            ${payload.documentUrl ? `
            <p>Your detailed payment document is attached to this email. You can also view it online by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${payload.documentUrl}" class="btn" target="_blank">View Payment Document</a>
            </p>
            ` : ''}
            
            <p>Thank you for your services and dedication to our training program.</p>
            
            <p>Best regards,<br>McKaynine Training Centre</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} McKaynine Training Centre. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Determine if we're sending with pdf attachment or just a link
    let emailOptions: any = {
      from: "McKaynine Training <payments@admin.talkingdog.co.za>",
      to: [payload.to],
      subject: "Payment Confirmation for Training Services",
      html: emailHtml
    };
    
    // Add attachment if PDF data is provided
    if (payload.documentUrl && payload.pdfData) {
      // If we have both URL and PDF data, use the PDF data as attachment
      emailOptions.attachments = [
        {
          filename: payload.documentName || "payment_confirmation.pdf",
          content: payload.pdfData
        }
      ];
    } else if (payload.pdfData) {
      // Only PDF data is provided
      emailOptions.attachments = [
        {
          filename: payload.documentName || "payment_confirmation.pdf",
          content: payload.pdfData
        }
      ];
    }
    // If only URL is provided, it's already in the email body as a link

    // Send the email
    try {
      console.log("Sending email to:", payload.to);
      const emailResult = await resend.emails.send(emailOptions);
      console.log("Email sending result:", emailResult);
      
      if (emailResult.error) {
        let errorMessage = emailResult.error.message || "Unknown email sending error";
        let errorCode = emailResult.error.statusCode || 500;
        
        // Provide more specific error messages for common issues
        if (errorMessage.includes("domain is not verified")) {
          errorMessage = "Email domain is not verified in Resend. Please verify the domain 'admin.talkingdog.co.za' in your Resend account settings.";
        }
        
        console.error("Email sending error:", {
          statusCode: errorCode,
          message: errorMessage
        });
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Failed to send email: ${errorMessage}`,
            emailSent: false,
            errorCode: errorCode
          }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email sent successfully",
          emailSent: true,
          emailId: emailResult.data?.id || null
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Failed to send email: ${emailError.message}`,
          emailSent: false,
          error: emailError.name || "EmailSendingError"
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
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
