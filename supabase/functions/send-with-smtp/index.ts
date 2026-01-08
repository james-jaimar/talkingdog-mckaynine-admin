import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailAttachment {
  // URL-based attachment (from Supabase storage)
  name?: string;
  url?: string;
  // Content-based attachment (base64)
  filename?: string;
  content?: string;
  encoding?: string;
  contentType?: string;
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;      // Optional override for from email
  fromName?: string;  // Optional override for from display name
  attachments?: EmailAttachment[];
}

/**
 * Fetch a file from URL and convert to base64
 */
async function fetchFileAsBase64(url: string): Promise<{ content: string; contentType: string }> {
  console.log(`Fetching attachment from URL: ${url}`);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch attachment: ${response.status} ${response.statusText}`);
  }
  
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Convert to base64
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const content = btoa(binary);
  
  console.log(`Fetched attachment: ${contentType}, ${uint8Array.length} bytes`);
  return { content, contentType };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("SMTP email function started (nodemailer)");
    
    // Get request data
    const { to, subject, html, from, fromName, attachments } = await req.json() as EmailRequest;
    
    // Get SMTP configuration
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Deno.env.get("SMTP_PORT") || "465";
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpPasswordRandburg = Deno.env.get("SMTP_PASSWORD_RANDBURG");
    const defaultFromEmail = Deno.env.get("FROM_EMAIL") || smtpUsername;
    
    // Use provided from email or fall back to default
    const fromEmail = from || defaultFromEmail;
    const fromAddress = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
    
    // Use Randburg password if sending from Randburg email
    const isRandburgEmail = fromEmail?.toLowerCase() === "randburg@mckaynine.co.za";
    const effectivePassword = isRandburgEmail && smtpPasswordRandburg ? smtpPasswordRandburg : smtpPassword;
    
    if (!smtpHost || !smtpUsername || !effectivePassword) {
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
    
    console.log(`SMTP Config - Host: ${smtpHost}, Port: ${port}, Secure: ${useSecure}, Username: ${smtpUsername}, From: ${fromEmail}, IsRandburg: ${isRandburgEmail}`);
    console.log(`Sending email to: ${to}, Subject: ${subject}`);
    
    // Create nodemailer transport
    const transport = nodemailer.createTransport({
      host: smtpHost,
      port: port,
      secure: useSecure,
      auth: {
        user: isRandburgEmail ? fromEmail : smtpUsername,
        pass: effectivePassword,
      },
    });
    
    // Prepare email options
    const mailOptions: any = {
      from: fromAddress,
      to: to,
      subject: subject,
      html: html,
    };
    
    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      console.log(`Processing ${attachments.length} attachment(s)`);
      const processedAttachments = [];
      
      for (const attachment of attachments) {
        try {
          // If attachment has URL, fetch and convert to base64
          if (attachment.url) {
            const { content, contentType } = await fetchFileAsBase64(attachment.url);
            processedAttachments.push({
              filename: attachment.name || "attachment",
              content: content,
              encoding: "base64",
              contentType: contentType,
            });
          } 
          // If attachment already has content (base64)
          else if (attachment.content) {
            processedAttachments.push({
              filename: attachment.filename || "attachment",
              content: attachment.content,
              encoding: attachment.encoding || "base64",
              contentType: attachment.contentType || "application/octet-stream",
            });
          }
        } catch (attachError) {
          console.error(`Failed to process attachment: ${attachment.name || attachment.filename}`, attachError);
          // Continue with other attachments
        }
      }
      
      if (processedAttachments.length > 0) {
        console.log(`Adding ${processedAttachments.length} processed attachment(s) to email`);
        mailOptions.attachments = processedAttachments;
      }
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
