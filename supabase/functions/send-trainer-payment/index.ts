
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
  // Edge function invoked from update-trainer-payments
  trainerId?: string;
  trainerEmail?: string;
  scheduleIds?: string[];
  paymentMethod?: string;
  transactionId?: string;
  paymentDate?: string;
  documentUrl?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const payload: PaymentEmailRequest = await req.json();
    console.log("Processing trainer payment email request:", {
      ...payload,
      pdfData: payload.pdfData ? "[PDF data truncated]" : undefined,
      documentUrl: payload.documentUrl ? "[URL redacted]" : undefined
    });

    // Initialize Supabase admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Determine if we're handling a direct call or a call from update-trainer-payments
    let trainerName = payload.trainerName;
    let trainerEmail = payload.to || payload.trainerEmail;
    let amount = payload.amount;
    let paymentMethod = payload.paymentDetails?.method || payload.paymentMethod || "Bank Transfer";
    let transactionId = payload.paymentDetails?.transactionId || payload.transactionId;
    let notes = payload.paymentDetails?.notes;
    let documentUrl = payload.documentUrl;
    let paymentDate = payload.paymentDate || new Date().toISOString();
    let classesInfo = [];
    
    // If trainerId is provided but trainerName or email is missing, fetch them
    if (payload.trainerId && (!trainerName || !trainerEmail)) {
      const { data: trainer, error: trainerError } = await supabaseAdmin
        .from('trainers')
        .select('email, first_name, last_name')
        .eq('id', payload.trainerId)
        .single();
        
      if (trainerError) {
        console.error("Error fetching trainer details:", trainerError);
      } else if (trainer) {
        if (!trainerEmail) trainerEmail = trainer.email;
        if (!trainerName) trainerName = `${trainer.first_name} ${trainer.last_name}`;
      }
    }
    
    // If no required recipient info, return error
    if (!trainerEmail) {
      return new Response(
        JSON.stringify({ error: "Missing trainer email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // If scheduleIds are provided, get class info
    if (payload.scheduleIds && payload.scheduleIds.length > 0) {
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
      
      // If no amount is provided, calculate from trainer payments
      if (!amount && payload.trainerId) {
        try {
          const { data: paymentsData, error: paymentsError } = await supabaseAdmin
            .from('trainer_payments')
            .select('amount')
            .eq('trainer_id', payload.trainerId)
            .in('class_schedule_id', payload.scheduleIds);
            
          if (!paymentsError && paymentsData) {
            amount = paymentsData.reduce((sum, payment) => sum + (payment.amount || 0), 0);
          }
        } catch (e) {
          console.error("Error calculating payments total:", e);
        }
      }
    }
    
    // Format payment method for display
    let paymentMethodDisplay = "Bank Transfer";
    if (paymentMethod === 'cash') paymentMethodDisplay = "Cash";
    if (paymentMethod === 'check') paymentMethodDisplay = "Check";
    if (paymentMethod === 'other') paymentMethodDisplay = "Other";

    // Initialize Resend email client
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ error: "Email service configuration is incomplete" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const resend = new Resend(resendApiKey);

    // Build email content
    const emailHtml = `
      <h1>Payment Confirmation</h1>
      <p>Dear ${trainerName || "Trainer"},</p>
      
      <p>We are pleased to confirm that your payment for training services has been processed.</p>
      
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="margin-top: 0;">Payment Details</h2>
        <p><strong>Date:</strong> ${new Date(paymentDate).toLocaleDateString()}</p>
        <p><strong>Method:</strong> ${paymentMethodDisplay}</p>
        ${transactionId ? `<p><strong>Transaction ID:</strong> ${transactionId}</p>` : ''}
        ${amount ? `<p><strong>Amount:</strong> R ${amount.toFixed(2)}</p>` : ''}
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
      </div>
      
      ${classesInfo.length > 0 ? `
      <h3>Classes Included:</h3>
      <ul>
        ${classesInfo.map(c => `<li>${c.name} (${c.date})</li>`).join('')}
      </ul>
      ` : ''}
      
      ${documentUrl ? `
      <p>You can view your payment document here: <a href="${documentUrl}" target="_blank">View Document</a></p>
      ` : ''}
      
      <p>Thank you for your services and dedication to our training program.</p>
      
      <p>Best regards,<br>McKaynine Training Centre</p>
    `;

    // Determine if we're sending with pdf attachment or just a link
    let emailOptions = {};
    
    if (payload.pdfData) {
      // Send with PDF attachment
      emailOptions = {
        from: "McKaynine Training <accounts@mckaynine-training.co.za>",
        to: [trainerEmail],
        subject: "Payment Confirmation for Training Services",
        html: emailHtml,
        attachments: [
          {
            filename: "payment_confirmation.pdf",
            content: payload.pdfData
          }
        ]
      };
    } else {
      // Send with just the link
      emailOptions = {
        from: "McKaynine Training <accounts@mckaynine-training.co.za>",
        to: [trainerEmail],
        subject: "Payment Confirmation for Training Services",
        html: emailHtml
      };
    }

    // Send the email
    try {
      const emailResult = await resend.emails.send(emailOptions);
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
