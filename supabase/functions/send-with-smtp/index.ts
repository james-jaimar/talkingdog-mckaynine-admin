import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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
    const fromEmail = Deno.env.get("FROM_EMAIL") || smtpUsername;
    
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
    console.log(`Sending email to: ${to}, Subject: ${subject}`);
    
    // Create SMTP client.
    // Port 587 is typically STARTTLS; some providers mis-advertise support.
    // We start unencrypted and (by default) denomailer would attempt STARTTLS.
    // For this provider, we disable STARTTLS and allow auth over unsecure channel.
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: parseInt(smtpPort),
        tls: false,
        auth: {
          username: smtpUsername,
          password: smtpPassword,
        },
      },
      debug: {
        // Avoid crashing during STARTTLS upgrade on some servers
        noStartTLS: true,
        // Allow AUTH without TLS (provider-specific)
        allowUnsecure: true,
      },
    });
    
    try {
      // Prepare email content
      const emailConfig: any = {
        from: fromEmail,
        to: to,
        subject: subject,
        html: html,
      };
      
      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        console.log(`Adding ${attachments.length} attachment(s) to email`);

        // denomailer expects attachment objects with encoding + contentType.
        // We pass through the base64 content directly (no manual atob/Uint8Array conversion).
        emailConfig.attachments = attachments.map((a) => ({
          filename: a.filename,
          content: a.content,
          encoding: a.encoding || "base64",
          contentType: a.contentType || "application/octet-stream",
        }));
      }
      
      // Send email
      await client.send(emailConfig);
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
        await client.close();
      } catch (closeError) {
        // Ignore close errors
      }
      
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
