
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
  trainerName?: string;
  trainerEmail?: string;
  amount?: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create Supabase client with service role key (bypasses RLS)
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
    console.log("Document details:", { url: payload.documentUrl, name: payload.documentName });

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
    
    // Only add document URL and name if they are provided
    if (payload.documentUrl) {
      updateData.document_url = payload.documentUrl;
      updateData.document_name = payload.documentName || null;
      console.log("Storing document URL:", updateData.document_url);
    }
    
    // If amount is provided, include it
    if (payload.amount && payload.amount > 0) {
      updateData.amount = payload.amount;
    }

    // Find existing records to update (avoids duplicates)
    const { data: existingRecords, error: checkError } = await supabaseAdmin
      .from('trainer_payments')
      .select('id, class_schedule_id, status, booking_id')
      .eq('trainer_id', payload.trainerId)
      .in('class_schedule_id', payload.scheduleIds);
    
    if (checkError) {
      console.error("Error checking existing records:", checkError);
      return new Response(
        JSON.stringify({ error: `Error checking records: ${checkError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log("Existing records:", existingRecords?.length || 0);
    
    // Track which schedule IDs already have records
    const existingScheduleIds = new Set(existingRecords?.map(r => r.class_schedule_id) || []);
    
    // Records to update (existing records that match our criteria)
    const recordsToUpdate = existingRecords || [];
    const idsToUpdate = recordsToUpdate.map(r => r.id);
    
    // Missing schedule IDs (need to create new records)
    const missingScheduleIds = payload.scheduleIds.filter(
      id => !existingScheduleIds.has(id)
    );
    
    console.log({
      recordsToUpdate: recordsToUpdate.length,
      idsToUpdate,
      missingScheduleIds,
      existingScheduleIds: Array.from(existingScheduleIds)
    });

    // Transaction to handle both updates and inserts atomically
    const { data, error } = await supabaseAdmin.rpc('batch_update_trainer_payments', {
      p_trainer_id: payload.trainerId,
      p_existing_ids: idsToUpdate,
      p_missing_schedules: missingScheduleIds,
      p_update_data: updateData
    });

    if (error) {
      // If RPC function doesn't exist, fall back to manual updates
      console.error("RPC error, falling back to manual updates:", error);
      
      let updatedCount = 0;
      let createdCount = 0;

      // Update existing records
      if (idsToUpdate.length > 0) {
        const { data: updateResult, error: updateError } = await supabaseAdmin
          .from('trainer_payments')
          .update(updateData)
          .in('id', idsToUpdate)
          .select();
        
        if (updateError) {
          console.error("Error updating payment records:", updateError);
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        
        updatedCount = updateResult?.length || 0;
        console.log(`Successfully updated ${updatedCount} payment records`);
      }
      
      // Insert new records for missing schedule IDs
      if (missingScheduleIds.length > 0) {
        const newRecords = missingScheduleIds.map(scheduleId => ({
          trainer_id: payload.trainerId,
          class_schedule_id: scheduleId,
          status: 'paid',
          payment_date: now,
          payment_method: payload.paymentMethod || null,
          transaction_id: payload.transactionId || null,
          notes: payload.notes || null,
          amount: payload.amount || 0,
          document_url: payload.documentUrl || null,
          document_name: payload.documentName || null,
          updated_at: now
        }));
        
        const { data: insertedData, error: insertError } = await supabaseAdmin
          .from('trainer_payments')
          .insert(newRecords)
          .select();
        
        if (insertError) {
          console.error("Error creating new payment records:", insertError);
          // Continue with response, don't fail completely
        } else {
          createdCount = insertedData?.length || 0;
          console.log(`Successfully created ${createdCount} new payment records`);
        }
      }
      
      // Use updatedCount and createdCount as results
      data = { updatedCount, createdCount };
    }

    // Send email notification if requested
    if (payload.sendEmail && payload.trainerEmail) {
      try {
        // Send email
        const { data: emailResult, error: emailError } = await supabaseAdmin.functions.invoke('send-trainer-payment', {
          body: {
            to: payload.trainerEmail,
            trainerName: payload.trainerName || 'Trainer',
            scheduleIds: payload.scheduleIds,
            paymentMethod: payload.paymentMethod,
            transactionId: payload.transactionId,
            paymentDate: now,
            documentUrl: payload.documentUrl,
            documentName: payload.documentName,
            amount: payload.amount || null
          }
        });
        
        if (emailError) {
          console.error("Error sending payment email:", emailError);
        } else {
          console.log("Email sent successfully:", emailResult);
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
        documentUrl: payload.documentUrl || null,
        documentName: payload.documentName || null,
        result: data
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
    
  } catch (error: any) {
    console.error("Unhandled error in update-trainer-payments:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
