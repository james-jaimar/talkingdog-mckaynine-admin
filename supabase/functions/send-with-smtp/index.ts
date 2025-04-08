
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding: string;
    contentType: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("SMTP email function started");
    
    // Get request data
    const { to, subject, html, attachments } = await req.json() as EmailRequest;
    
    // Get SMTP configuration
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Deno.env.get("SMTP_PORT");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const fromEmail = Deno.env.get("FROM_EMAIL") || "noreply@mckaynine.co.za";
    
    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
      console.error("Missing SMTP configuration");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing SMTP configuration. Please check your environment variables." 
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    console.log(`SMTP Config - Host: ${smtpHost}, Port: ${smtpPort}, Username: ${smtpUsername}, From: ${fromEmail}`);
    
    // Create SMTP client
    const client = new SmtpClient();
    
    try {
      // Connect to SMTP server
      await client.connect({
        hostname: smtpHost,
        port: parseInt(smtpPort),
        username: smtpUsername,
        password: smtpPassword,
        tls: true,
      });
      
      console.log(`Connected to SMTP server: ${smtpHost}:${smtpPort}`);
      console.log(`Sending email from: ${fromEmail} to: ${to}`);
      
      // Prepare email
      const email: any = {
        from: fromEmail,
        to: to,
        subject: subject,
        content: html,
        html: html,
      };
      
      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        console.log(`Adding ${attachments.length} attachments to email`);
        email.attachments = attachments.map(attachment => ({
          filename: attachment.filename,
          content: attachment.content,
          encoding: attachment.encoding,
          contentType: attachment.contentType,
        }));
      }
      
      // Send email
      await client.send(email);
      console.log("Email sent successfully via SMTP");
      
      // Close connection
      await client.close();
      
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (smtpError) {
      console.error("SMTP error:", smtpError);
      
      try {
        // Try to close the client if it's open
        await client.close();
      } catch (closeError) {
        // Ignore close errors
      }
      
      // Return detailed error
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `SMTP error: ${smtpError instanceof Error ? smtpError.message : String(smtpError)}`,
          details: smtpError instanceof Error ? smtpError.stack : undefined
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error) {
    console.error("Error in SMTP function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
};

serve(handler);
