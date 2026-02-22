import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXTRACTION_PROMPT = `You are extracting data from a McKaynine dog training enrollment form.
The document may have multiple pages. The pages may be in ANY order.

STEP 1 - IDENTIFY THE FORM PAGE:
Scan through ALL pages and find the one that is the actual enrollment form.
The enrollment form contains handwritten fields for owner/handler details (name, email, phone),
dog details (name, breed, date of birth), and sections about social behavior, training goals, etc.
IGNORE any class information flyers, schedules, or other non-form pages.

STEP 2 - EXTRACT DATA:
From the identified enrollment form page, extract these fields exactly:
- Owner section: name (split into first_name and last_name), account holder name, email, phone, occupation, vet name
- Dog section: name, birth date (format as YYYY-MM-DD if possible), gender (male/female), breed
- Spay/neuter status: MUST be one of these exact values: "When old enough", "Already done", "Not planning to"
  - Map "intact", "not spayed", "not neutered" → "When old enough"
  - Map "spayed", "neutered", "fixed", "done", "yes" → "Already done"
  - Map "no", "never", "not planning" → "Not planning to"
- Acquired from: breeder/rescue/shelter/pet_store/friend/advert/born_in_home/stray/other
- Age at acquisition: MUST be one of: "Less than 2 months", "2-4 months", "4-12 months", "Older than 1 year"
- Other pets at home: array of strings from: "dogs", "cats", "dogs_and_cats", "birds", "livestock", "none"
  - If both dogs AND cats are indicated, use "dogs_and_cats" instead of separate entries
- Children at home: MUST be one of: "Babies/toddlers", "Children", "Teenagers", "None"
  - If multiple types, pick the youngest category
- Social behavior ratings (with_dogs, with_other_animals, with_people): MUST be one of "Great", "OK", "Not good"
  - Map "good", "great", "friendly", "fine" → "Great"
  - Map "ok", "fair", "average", "sometimes" → "OK"  
  - Map "poor", "bad", "aggressive", "nervous", "not good" → "Not good"
  - IMPORTANT: Look for handwritten notes/details next to or after the social behavior checkboxes (e.g., "bit rough", "fine with most people", "nervous around strangers") and capture these in social_behavior.details
- Training goal: MUST be one of: "Competitive dog sport", "Chilled canine companion"
  - DEFAULT to "Chilled canine companion" unless form clearly indicates competition, sport, agility, trials, etc.
- Has behavior problems (true/false), behavior problems details
- Has health problems (true/false), health problems details
- Class section: class type (Puppy/EO/CGC Bronze/CGC Silver/Beginner/Novice/WT/A-Test/Yoga/Other), class type other if Other selected, branch name, how they heard about us (array of sources)
- Permissions: WhatsApp group permission (yes/no), Photo permission (yes/no)
- Acknowledgements: list which acknowledgement checkboxes are checked (training_equipment, treats, waste_disposal, onlead_socializing, equipment_supervision)
- Signature: signer name and signed date (format as YYYY-MM-DD if possible)

For each field, assess confidence:
- "high": clearly legible, unambiguous
- "medium": somewhat legible, interpretation possible  
- "low": illegible, unclear, or appears blank

IMPORTANT: Return JSON matching this exact schema:
{
  "owner": {
    "first_name": "",
    "last_name": "",
    "account_holder_name": "",
    "email": "",
    "phone": "",
    "occupation": "",
    "vet_name": ""
  },
  "dogs": [
    {
      "name": "",
      "date_of_birth": "",
      "gender": "",
      "breed": "",
      "spay_neuter_status": "",
      "acquired_from": "",
      "acquired_from_other": "",
      "age_at_acquisition": "",
      "other_pets": [],
      "children_at_home": "",
      "social_behavior": {
        "with_dogs": "",
        "with_other_animals": "",
        "with_people": "",
        "details": ""
      },
      "training_goal": "",
      "has_behavior_problems": false,
      "behavior_problems_details": "",
      "has_health_problems": false,
      "health_problems_details": "",
      "class_type": "",
      "class_type_other": "",
      "branch_name": "",
      "heard_from": [],
      "whatsapp_permission": "",
      "photo_permission": "",
      "acknowledgements": {
        "training_equipment": false,
        "treats": false,
        "waste_disposal": false,
        "onlead_socializing": false,
        "equipment_supervision": false
      },
      "signature_name": "",
      "signature_date": ""
    }
  ],
  "field_confidence": {
    "owner.first_name": "high",
    "owner.email": "medium"
  },
  "notes_for_review": ["List any issues or uncertainties here"]
}

Do not invent values - leave empty and mark confidence as low if unreadable.
Return ONLY valid JSON, no markdown code blocks or other text.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file_url, job_id } = await req.json();
    
    if (!file_url) {
      return new Response(
        JSON.stringify({ error: 'file_url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service is not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client for updating job status
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update job status to processing if job_id provided
    if (job_id) {
      await supabase
        .from('scan_processing_jobs')
        .update({ status: 'processing' })
        .eq('id', job_id);
    }

    console.log("File path:", file_url);

    const fileName = file_url.toLowerCase();
    const isPDF = fileName.endsWith('.pdf');
    const isImage = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png');

    let modelFileUrl = "";

    if (isPDF) {
      // PDFs must be sent as base64 data URLs - gateway doesn't support PDF via URL
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('scanned-forms')
        .download(file_url);

      if (downloadError || !fileData) {
        throw new Error(`Failed to download PDF: ${downloadError?.message}`);
      }

      // Convert to base64 using chunked approach to avoid memory spikes
      const bytes = new Uint8Array(await fileData.arrayBuffer());
      console.log("PDF downloaded, size:", bytes.length);
      const chunkSize = 8192;
      let binary = '';
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      modelFileUrl = `data:application/pdf;base64,${btoa(binary)}`;
      console.log("PDF converted to base64 data URL");

    } else if (isImage) {
      // Images work fine via signed URL
      const { data: signed, error: signedError } = await supabase.storage
        .from('scanned-forms')
        .createSignedUrl(file_url, 300);

      if (signedError || !signed?.signedUrl) {
        throw new Error(`Failed to create signed URL: ${signedError?.message}`);
      }
      modelFileUrl = signed.signedUrl;
      console.log("Signed URL created for image");

    } else {
      throw new Error(`Unsupported file type: ${file_url}`);
    }

    console.log("Model file URL prepared");

    // Prepare the message content for vision model
    const messageContent: any[] = [
      {
        type: "text",
        text: EXTRACTION_PROMPT
      }
    ];

    messageContent.push({
      type: "image_url",
      image_url: {
        url: modelFileUrl
      }
    });

    console.log("Calling Lovable AI for extraction...");
    
    // Call Lovable AI Gateway with vision
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: messageContent
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI extraction failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const extractedText = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI response received, parsing JSON...");
    
    // Parse the JSON response
    let extractedData;
    try {
      // Try to extract JSON from the response (in case it's wrapped in markdown)
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, extractedText);
      
      // Update job status to error if job_id provided
      if (job_id) {
        await supabase
          .from('scan_processing_jobs')
          .update({ 
            status: 'error',
            error_message: 'Failed to parse AI extraction response'
          })
          .eq('id', job_id);
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse extraction results",
          raw_response: extractedText.substring(0, 500)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine status based on confidence
    const fieldConfidence = extractedData.field_confidence || {};
    const hasLowConfidence = Object.values(fieldConfidence).some(c => c === 'low');
    const notesForReview = extractedData.notes_for_review || [];
    
    // Check for required fields
    const owner = extractedData.owner || {};
    const dogs = extractedData.dogs || [];
    const missingRequired = !owner.first_name || !owner.email || dogs.length === 0 || !dogs[0]?.name;
    
    const status = (hasLowConfidence || notesForReview.length > 0 || missingRequired) 
      ? 'needs_review' 
      : 'ready_to_save';

    console.log("Extraction complete, status:", status);

    // Update job with extracted data if job_id provided
    if (job_id) {
      await supabase
        .from('scan_processing_jobs')
        .update({ 
          status,
          extracted_data: extractedData,
          field_confidence: fieldConfidence,
          notes_for_review: notesForReview
        })
        .eq('id', job_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status,
        extracted_data: extractedData,
        field_confidence: fieldConfidence,
        notes_for_review: notesForReview
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in extract-enrollment-scan:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
