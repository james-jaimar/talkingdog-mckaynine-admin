import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.10";

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
    console.log("SMTP email function started (nodemailer)");
    
    // Get request data
    const { to, subject, html, attachments } = await req.json() as EmailRequest;
    
    // Get SMTP configuration
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Deno.env.get("SMTP_PORT") || "465";
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const fromEmail = Deno.env.get("FROM_EMAIL") || smtpUsername;
    
    if (!smtpHost || !smtpUsername || !smtpPassword) {
      console.error("Missing SMTP configuration");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing SMTP configuration. Please check your environment variables." 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const port = parseInt(smtpPort);
    const useSecure = port === 465; // Port 465 uses implicit SSL/TLS
    
    console.log(`SMTP Config - Host: ${smtpHost}, Port: ${port}, Secure: ${useSecure}, Username: ${smtpUsername}, From: ${fromEmail}`);
    console.log(`Sending email to: ${to}, Subject: ${subject}`);
    
    // Create nodemailer transport
    const transport = nodemailer.createTransport({
      host: smtpHost,
      port: port,
      secure: useSecure,
      auth: {
        user: smtpUsername,
        pass: smtpPassword,
      },
    });
    
    // Prepare email options
    const mailOptions: any = {
      from: fromEmail,
      to: to,
      subject: subject,
      html: html,
    };
    
    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      console.log(`Adding ${attachments.length} attachment(s) to email`);
      mailOptions.attachments = attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        encoding: a.encoding || "base64",
        contentType: a.contentType || "application/octet-stream",
      }));
    }
    
    // Send email
    const info = await transport.sendMail(mailOptions);
    console.log("Email sent successfully via SMTP:", info.messageId);
    
    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
