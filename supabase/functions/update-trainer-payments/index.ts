
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentUpdateRequest {
  trainerId: string;
  scheduleIds: string[];
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  documentUrl?: string;
  documentName?: string;
  sendEmail?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create Supabase client with service role key (has bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse request body
    const payload: PaymentUpdateRequest = await req.json();
    
    // Verify required parameters are provided
    if (!payload.trainerId || !payload.scheduleIds || payload.scheduleIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log("Processing trainer payment update:", payload);

    // Current timestamp for all updates
    const now = new Date().toISOString();
    
    // Base update data
    const updateData: Record<string, any> = {
      status: 'paid',
      payment_date: now,
      payment_method: payload.paymentMethod || null,
      transaction_id: payload.transactionId || null,
      notes: payload.notes || null,
      updated_at: now
    };
    
    // Check if document fields exist in the table
    try {
      const { data: columnsData, error: columnCheckError } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'trainer_payments')
        .in('column_name', ['document_url', 'document_name']);
      
      const columnNames = columnsData?.map(col => col.column_name) || [];
      
      console.log("Document column check result:", { columns: columnNames, error: columnCheckError });
      
      // Add document fields if they exist and values are provided
      if (columnNames.includes('document_url') && payload.documentUrl) {
        updateData.document_url = payload.documentUrl;
        updateData.document_name = payload.documentName || null;
      }
    } catch (err) {
      console.error("Error checking for document columns:", err);
      // Continue with the update without document fields
    }

    // First, check if records exist for these schedules
    const { data: existingRecords, error: checkError } = await supabaseAdmin
      .from('trainer_payments')
      .select('id, class_schedule_id, status')
      .eq('trainer_id', payload.trainerId)
      .in('class_schedule_id', payload.scheduleIds);
    
    console.log("Existing records check:", { 
      count: existingRecords?.length,
      scheduleIds: payload.scheduleIds,
      error: checkError
    });
    
    // If there are no existing records, create them
    const missingScheduleIds = payload.scheduleIds.filter(
      id => !existingRecords?.some(record => record.class_schedule_id === id)
    );
    
    if (missingScheduleIds.length > 0) {
      console.log("Creating missing records for schedule IDs:", missingScheduleIds);
      
      const newRecords = missingScheduleIds.map(scheduleId => ({
        trainer_id: payload.trainerId,
        class_schedule_id: scheduleId,
        status: 'paid', // Directly mark as paid
        payment_date: now,
        payment_method: payload.paymentMethod || null,
        transaction_id: payload.transactionId || null,
        notes: payload.notes || null,
        amount: 0, // Will be calculated by trigger if possible
        document_url: payload.documentUrl || null,
        document_name: payload.documentName || null,
        updated_at: now
      }));
      
      const { data: insertedData, error: insertError } = await supabaseAdmin
        .from('trainer_payments')
        .insert(newRecords)
        .select();
      
      if (insertError) {
        console.error("Error creating missing payment records:", insertError);
        // Continue with updating existing records
      } else {
        console.log(`Successfully created ${insertedData?.length || 0} new payment records`);
      }
    }
    
    // Update existing records
    const existingIds = existingRecords?.filter(r => payload.scheduleIds.includes(r.class_schedule_id))
      .map(r => r.id) || [];
      
    if (existingIds.length > 0) {
      console.log("Updating existing payment records:", existingIds);
      
      const { data: updateResult, error: updateError } = await supabaseAdmin
        .from('trainer_payments')
        .update(updateData)
        .in('id', existingIds)
        .select();
      
      if (updateError) {
        console.error("Error updating payment records:", updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      console.log(`Successfully updated ${updateResult?.length || 0} payment records`);
    }
    
    // Send email notification if requested
    if (payload.sendEmail) {
      try {
        // Get the trainer's email
        const { data: trainer, error: trainerError } = await supabaseAdmin
          .from('trainers')
          .select('email, first_name, last_name')
          .eq('id', payload.trainerId)
          .single();
        
        if (trainerError || !trainer?.email) {
          console.error("Error fetching trainer email:", trainerError);
        } else {
          const { data: emailResult, error: emailError } = await supabaseAdmin.functions.invoke('send-trainer-payment', {
            body: {
              trainerId: payload.trainerId,
              trainerEmail: trainer.email,
              trainerName: `${trainer.first_name} ${trainer.last_name}`,
              scheduleIds: payload.scheduleIds,
              paymentMethod: payload.paymentMethod,
              transactionId: payload.transactionId,
              paymentDate: now,
              documentUrl: payload.documentUrl
            }
          });
          
          if (emailError) {
            console.error("Error sending payment email:", emailError);
          } else {
            console.log("Email sent successfully:", emailResult);
          }
        }
      } catch (emailErr) {
        console.error("Exception in email sending:", emailErr);
        // Don't fail the overall operation just because email sending failed
      }
    }
    
    // Return success response with detailed information
    return new Response(
      JSON.stringify({ 
        success: true, 
        trainerId: payload.trainerId, 
        updatedCount: existingIds.length,
        createdCount: missingScheduleIds.length,
        totalSchedules: payload.scheduleIds.length
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
    
  } catch (error) {
    console.error("Unhandled error in update-trainer-payments:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
