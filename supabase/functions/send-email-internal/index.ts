
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

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
    console.log("Email function started");
    
    // Get request data
    const { to, subject, html, attachments } = await req.json() as EmailRequest;
    
    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase admin client created");
    
    let emailData: any = {
      to,
      subject,
      html
    };
    
    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailData.attachments = attachments;
    }
    
    console.log(`Sending email to ${to}`);
    
    // Send email using Supabase's built-in service
    const { error } = await supabase.functions.invoke('send-with-smtp', {
      body: emailData
    });
    
    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }
    
    console.log("Email sent successfully");
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
  } catch (error) {
    console.error("Error in email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
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
