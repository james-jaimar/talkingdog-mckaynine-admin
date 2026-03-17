import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import nodemailer from "npm:nodemailer@6.9.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QueuedEmail {
  id: string;
  to_email: string;
  subject: string;
  html_content: string;
  from_email: string | null;
  from_name: string | null;
  attachments: any[];
  retry_count: number;
  max_retries: number;
  branch_id: string;
  handler_id: string | null;
  template_id: string | null;
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
  
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const content = btoa(binary);
  
  return { content, contentType };
}

async function resolveBranchEmail(branchId: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data } = await supabase
      .from("branch_notifications")
      .select("from_email")
      .eq("branch_id", branchId)
      .maybeSingle();
    
    if (data?.from_email) return data.from_email;
    
    // Fallback: lookup branch email directly
    const { data: branch } = await supabase
      .from("branches")
      .select("email")
      .eq("id", branchId)
      .maybeSingle();
    
    return branch?.email || null;
  } catch (err) {
    console.error("Error resolving branch email:", err);
    return null;
  }
}

// Known SMTP-correct email addresses per branch (handles DB typos)
const SMTP_EMAIL_MAP: Record<string, string> = {
  "randburg@mackaynine.co.za": "randburg@mckaynine.co.za",
};

function normalizeSMTPEmail(email: string): string {
  return SMTP_EMAIL_MAP[email.toLowerCase()] || email;
}

async function sendEmail(email: QueuedEmail): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = Deno.env.get("SMTP_PORT") || "465";
  const smtpUsername = Deno.env.get("SMTP_USERNAME");
  const smtpPassword = Deno.env.get("SMTP_PASSWORD");
  const smtpPasswordRandburg = Deno.env.get("SMTP_PASSWORD_RANDBURG");
  const defaultFromEmail = Deno.env.get("FROM_EMAIL") || smtpUsername;

  // Resolve from_email: explicit > branch lookup > default
  let resolvedFromEmail = email.from_email;
  if (!resolvedFromEmail && email.branch_id) {
    resolvedFromEmail = await resolveBranchEmail(email.branch_id);
    if (resolvedFromEmail) {
      resolvedFromEmail = normalizeSMTPEmail(resolvedFromEmail);
      console.log(`Resolved from_email from branch: ${resolvedFromEmail}`);
    }
  }
  const fromEmail = resolvedFromEmail || defaultFromEmail;
  const fromAddress = email.from_name ? `${email.from_name} <${fromEmail}>` : fromEmail;

  const isRandburgEmail = fromEmail?.toLowerCase() === "randburg@mckaynine.co.za";
  const effectivePassword = isRandburgEmail && smtpPasswordRandburg ? smtpPasswordRandburg : smtpPassword;

  if (!smtpHost || !smtpUsername || !effectivePassword) {
    return { success: false, error: "Missing SMTP configuration" };
  }

  const port = parseInt(smtpPort);
  const useSecure = port === 465;

  console.log(`Sending to: ${email.to_email}, Subject: ${email.subject}`);

  const transport = nodemailer.createTransport({
    host: smtpHost,
    port: port,
    secure: useSecure,
    auth: {
      user: isRandburgEmail ? fromEmail : smtpUsername,
      pass: effectivePassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });

  const mailOptions: any = {
    from: fromAddress,
    to: email.to_email,
    subject: email.subject,
    html: email.html_content,
  };

  // Process attachments
  if (email.attachments && email.attachments.length > 0) {
    const processedAttachments = [];
    for (const attachment of email.attachments) {
      try {
        if (attachment.url) {
          const { content, contentType } = await fetchFileAsBase64(attachment.url);
          processedAttachments.push({
            filename: attachment.name || "attachment",
            content: content,
            encoding: "base64",
            contentType: contentType,
          });
        } else if (attachment.content) {
          processedAttachments.push({
            filename: attachment.filename || "attachment",
            content: attachment.content,
            encoding: attachment.encoding || "base64",
            contentType: attachment.contentType || "application/octet-stream",
          });
        }
      } catch (err) {
        console.error(`Failed to process attachment: ${attachment.name}`, err);
      }
    }
    if (processedAttachments.length > 0) {
      mailOptions.attachments = processedAttachments;
    }
  }

  try {
    const info = await transport.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email: ${error.message}`);
    return { success: false, error: error.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing email queue...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body for optional parameters
    let limit = 10;
    let delayMs = 2000; // 2 second delay between emails
    
    try {
      const body = await req.json();
      if (body.limit) limit = body.limit;
      if (body.delayMs) delayMs = body.delayMs;
    } catch {
      // No body provided, use defaults
    }

    // Fetch pending emails ready to send
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .in("status", ["pending", "failed"])
      .lte("scheduled_for", new Date().toISOString())
      .lt("retry_count", 3) // Only get emails that haven't exceeded max retries
      .order("created_at", { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error("Error fetching queue:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log("No emails in queue");
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No emails in queue" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${pendingEmails.length} emails to process`);

    const results = [];

    for (let i = 0; i < pendingEmails.length; i++) {
      const email = pendingEmails[i] as QueuedEmail;

      // Update status to sending
      await supabase
        .from("email_queue")
        .update({ status: "sending" })
        .eq("id", email.id);

      const result = await sendEmail(email);

      if (result.success) {
        // Move to sent status and log
        await supabase
          .from("email_queue")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            error_message: null,
          })
          .eq("id", email.id);

        // Log to email_log
        await supabase.from("email_log").insert({
          recipient_email: email.to_email,
          subject: email.subject,
          status: "sent",
          handler_id: email.handler_id,
          template_id: email.template_id,
          branch_id: email.branch_id,
          html_content: email.html_content,
          attachments: email.attachments,
          from_email: email.from_email,
          from_name: email.from_name,
        });

        results.push({ id: email.id, success: true });
      } else {
        // Update with error and increment retry count
        const newRetryCount = email.retry_count + 1;
        const newStatus = newRetryCount >= email.max_retries ? "failed" : "pending";
        const scheduledFor = new Date(Date.now() + (newRetryCount * 30000)).toISOString(); // Exponential backoff

        await supabase
          .from("email_queue")
          .update({
            status: newStatus,
            retry_count: newRetryCount,
            error_message: result.error,
            scheduled_for: scheduledFor,
          })
          .eq("id", email.id);

        results.push({ id: email.id, success: false, error: result.error });
      }

      // Add delay between emails (except for last one)
      if (i < pendingEmails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Processed ${results.length} emails: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        sent: successCount,
        failed: failCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing queue:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
