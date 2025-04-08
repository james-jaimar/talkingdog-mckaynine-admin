
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Initialize Resend with the API key from environment variables
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Request interface for email
interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string; // Base64 encoded content
    encoding?: string;
    contentType?: string;
  }>;
}

// Main handler function
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const emailData: EmailRequest = await req.json();
    console.log(`Preparing to send email to ${emailData.to} with subject: ${emailData.subject}`);
    
    // Prepare the email payload for Resend
    const emailPayload: any = {
      from: "McKaynine Training Centre <onboarding@resend.dev>", // Using Resend's verified domain
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
      reply_to: "noreply@mckaynine.co.za", // Add reply-to with the custom domain
    };

    // Add attachments if provided
    if (emailData.attachments && emailData.attachments.length > 0) {
      console.log(`Including ${emailData.attachments.length} attachments`);
      emailPayload.attachments = emailData.attachments.map(attachment => {
        return {
          filename: attachment.filename,
          content: attachment.content,
          encoding: attachment.encoding || 'base64',
          content_type: attachment.contentType || 'application/octet-stream'
        };
      });
    }

    // Send the email using Resend
    const result = await resend.emails.send(emailPayload);
    console.log("Email sent successfully with Resend:", result);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email sent successfully",
      id: result.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error sending email with Resend:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
};

console.log("Send with Resend function initialized");
serve(handler);
