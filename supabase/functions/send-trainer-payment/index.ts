
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentEmailRequest {
  trainerId: string;
  trainerEmail?: string;
  trainerName?: string;
  scheduleIds: string[];
  paymentMethod?: string;
  transactionId?: string;
  paymentDate: string;
  documentUrl?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const payload: PaymentEmailRequest = await req.json();
    console.log("Processing trainer payment email:", { ...payload, documentUrl: payload.documentUrl ? "[URL redacted]" : "none" });

    // Validate required parameters
    if (!payload.trainerId || !payload.scheduleIds || payload.scheduleIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Create Supabase admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Get trainer details if not provided
    let trainerEmail = payload.trainerEmail;
    let trainerName = payload.trainerName;
    
    if (!trainerEmail || !trainerName) {
      const { data: trainer, error: trainerError } = await supabaseAdmin
        .from('trainers')
        .select('email, first_name, last_name')
        .eq('id', payload.trainerId)
        .single();
        
      if (trainerError || !trainer?.email) {
        console.error("Error fetching trainer details:", trainerError);
        return new Response(
          JSON.stringify({ error: "Could not find trainer email" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      trainerEmail = trainer.email;
      trainerName = `${trainer.first_name} ${trainer.last_name}`;
    }
    
    // Get class details for the payment
    let classesInfo = [];
    try {
      const { data: classData, error: classError } = await supabaseAdmin
        .from('class_schedules')
        .select(`
          id,
          start_time,
          classes:class_id (
            name,
            course_fee
          )
        `)
        .in('id', payload.scheduleIds);
        
      if (classError) {
        console.error("Error fetching class details:", classError);
      } else if (classData) {
        classesInfo = classData.map(cls => ({
          name: cls.classes?.name || "Class",
          date: cls.start_time ? new Date(cls.start_time).toLocaleDateString() : "N/A",
          fee: cls.classes?.course_fee || 0
        }));
      }
    } catch (e) {
      console.error("Error processing class data:", e);
    }
    
    // Get payments info
    let paymentsTotal = 0;
    try {
      const { data: paymentsData, error: paymentsError } = await supabaseAdmin
        .from('trainer_payments')
        .select('amount')
        .eq('trainer_id', payload.trainerId)
        .in('class_schedule_id', payload.scheduleIds);
        
      if (!paymentsError && paymentsData) {
        paymentsTotal = paymentsData.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      }
    } catch (e) {
      console.error("Error calculating payments total:", e);
    }
    
    // Format payment method for display
    let paymentMethodDisplay = "Bank Transfer";
    if (payload.paymentMethod === 'cash') paymentMethodDisplay = "Cash";
    if (payload.paymentMethod === 'check') paymentMethodDisplay = "Check";
    if (payload.paymentMethod === 'other') paymentMethodDisplay = "Other";

    // Initialize Resend email client
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ error: "Email configuration is not complete" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const resend = new Resend(resendApiKey);

    // Build email content
    const emailHtml = `
      <h1>Payment Confirmation</h1>
      <p>Dear ${trainerName},</p>
      
      <p>We are pleased to confirm that your payment for training services has been processed.</p>
      
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="margin-top: 0;">Payment Details</h2>
        <p><strong>Date:</strong> ${new Date(payload.paymentDate).toLocaleDateString()}</p>
        <p><strong>Method:</strong> ${paymentMethodDisplay}</p>
        ${payload.transactionId ? `<p><strong>Transaction ID:</strong> ${payload.transactionId}</p>` : ''}
        <p><strong>Amount:</strong> R ${paymentsTotal.toFixed(2)}</p>
      </div>
      
      ${classesInfo.length > 0 ? `
      <h3>Classes Included:</h3>
      <ul>
        ${classesInfo.map(c => `<li>${c.name} (${c.date})</li>`).join('')}
      </ul>
      ` : ''}
      
      ${payload.documentUrl ? `
      <p>You can view your payment document here: <a href="${payload.documentUrl}" target="_blank">View Document</a></p>
      ` : ''}
      
      <p>Thank you for your services and dedication to our training program.</p>
      
      <p>Best regards,<br>McKaynine Training Centre</p>
    `;

    // Send the email
    try {
      const emailResult = await resend.emails.send({
        from: "McKaynine Training <accounts@mckaynine-training.co.za>",
        to: [trainerEmail],
        subject: "Payment Confirmation for Training Services",
        html: emailHtml,
      });

      console.log("Email sending result:", emailResult);
      
      return new Response(
        JSON.stringify({ success: true, emailResult }),
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
