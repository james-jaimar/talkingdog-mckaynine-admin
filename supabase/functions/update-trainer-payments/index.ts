// Prefer built-in Deno.serve and npm/jsr imports to reduce bundle timeouts
import { createClient } from "npm:@supabase/supabase-js@2";


// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentUpdateRequest {
  trainerId: string;
  scheduleIds: string[];
  classAmounts?: Record<string, number>; // Exact per-class amounts
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

Deno.serve(async (req: Request) => {
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
    console.log("Class amounts:", payload.classAmounts);

    // Current timestamp for all updates
    const now = new Date().toISOString();
    
    // Use classAmounts if provided (preferred), otherwise fall back to dividing total
    const hasClassAmounts = payload.classAmounts && Object.keys(payload.classAmounts).length > 0;
    
    // Calculate per-schedule amount as fallback if no classAmounts provided
    const scheduleCount = payload.scheduleIds.length;
    const perScheduleAmount = !hasClassAmounts && payload.amount && scheduleCount > 0 
      ? payload.amount / scheduleCount 
      : null;

    if (hasClassAmounts) {
      console.log(`Using exact class amounts for ${Object.keys(payload.classAmounts!).length} schedules`);
    } else if (perScheduleAmount !== null) {
      console.log(`Fallback: Distributing total amount ${payload.amount} across ${scheduleCount} schedules. Per schedule amount: ${perScheduleAmount}`);
    }

    // Base update data
    const updateData: any = {
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
    
    // Note: For existing record updates, we'll set individual amounts per schedule below
    // Base updateData doesn't include amount - it will be set per-record

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

    // Try using the batch update function first
    let data;
    let error;
    
    try {
      const result = await supabaseAdmin.rpc('batch_update_trainer_payments', {
        p_trainer_id: payload.trainerId,
        p_existing_ids: idsToUpdate,
        p_missing_schedules: missingScheduleIds,
        p_update_data: updateData
      });
      
      data = result.data;
      error = result.error;
    } catch (rpcError) {
      console.error("RPC call failed:", rpcError);
      error = rpcError;
    }

    if (error) {
      // If RPC function doesn't exist or fails, fall back to manual updates
      console.error("RPC error, falling back to manual updates:", error);
      
      let updatedCount = 0;
      let createdCount = 0;

      // Update existing records - each with its specific amount
      if (recordsToUpdate.length > 0) {
        for (const record of recordsToUpdate) {
          // Determine the amount for this specific schedule
          let recordAmount: number | null = null;
          if (hasClassAmounts && payload.classAmounts![record.class_schedule_id]) {
            recordAmount = payload.classAmounts![record.class_schedule_id];
          } else if (perScheduleAmount !== null) {
            recordAmount = perScheduleAmount;
          }
          
          const recordUpdateData = { ...updateData };
          if (recordAmount !== null) {
            recordUpdateData.amount = recordAmount;
          }
          
          const { error: updateError } = await supabaseAdmin
            .from('trainer_payments')
            .update(recordUpdateData)
            .eq('id', record.id);
          
          if (updateError) {
            console.error(`Error updating payment record ${record.id}:`, updateError);
          } else {
            updatedCount++;
            console.log(`Updated record ${record.id} with amount ${recordAmount}`);
          }
        }
        console.log(`Successfully updated ${updatedCount} payment records`);
      }
      
      // Insert new records for missing schedule IDs
      if (missingScheduleIds.length > 0) {
        const newRecords = missingScheduleIds.map(scheduleId => {
          // Use exact amount from classAmounts if available, otherwise use perScheduleAmount
          let scheduleAmount = 0;
          if (hasClassAmounts && payload.classAmounts![scheduleId]) {
            scheduleAmount = payload.classAmounts![scheduleId];
          } else if (perScheduleAmount !== null) {
            scheduleAmount = perScheduleAmount;
          }
          
          return {
            trainer_id: payload.trainerId,
            class_schedule_id: scheduleId,
            status: 'paid',
            payment_date: now,
            payment_method: payload.paymentMethod || null,
            transaction_id: payload.transactionId || null,
            notes: payload.notes || null,
            amount: scheduleAmount,
            document_url: payload.documentUrl || null,
            document_name: payload.documentName || null,
            created_at: now,
            updated_at: now
          };
        });
        
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
      
      // Set data variable with manual update results
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
