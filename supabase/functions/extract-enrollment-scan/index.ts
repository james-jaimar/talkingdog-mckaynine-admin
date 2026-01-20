import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXTRACTION_PROMPT = `You are extracting data from a McKaynine dog training enrollment form.
The document typically has 2 pages:
- Page 1 is a class information flyer - IGNORE THIS PAGE
- Page 2 is the actual enrollment form with handler/owner and dog details - EXTRACT DATA FROM THIS PAGE ONLY

Focus ONLY on page 2 which contains the handwritten enrollment form data.

Extract these fields exactly:
- Owner section: name (split into first_name and last_name), account holder name, email, phone, occupation, vet name
- Dog section: name, birth date (format as YYYY-MM-DD if possible), gender (male/female), breed
- Spay/neuter status: MUST be one of these exact values: "When old enough", "Already done", "Not planning to"
  - Map "intact", "not spayed", "not neutered" → "When old enough"
  - Map "spayed", "neutered", "fixed", "done", "yes" → "Already done"
  - Map "no", "never", "not planning" → "Not planning to"
- Acquired from: breeder/rescue/shelter/pet_store/friend/advert/born_in_home/stray/other
- Age at acquisition: MUST be one of: "Less than 2 months", "2-4 months", "4-12 months", "Older than 1 year"
- Other pets at home: array of strings from: "dogs", "cats", "birds", "livestock", "none"
- Children at home: MUST be one of: "Babies/toddlers", "Children", "Teenagers", "None"
  - If multiple types, pick the youngest category
- Social behavior ratings (with_dogs, with_other_animals, with_people): MUST be one of "Great", "OK", "Not good"
  - Map "good", "great", "friendly", "fine" → "Great"
  - Map "ok", "fair", "average", "sometimes" → "OK"  
  - Map "poor", "bad", "aggressive", "nervous", "not good" → "Not good"
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

    // For multi-page PDFs, we want ONLY page 2.
    // To avoid Edge Function memory blow-ups from base64 encoding full PDFs,
    // we extract page 2 into a new single-page PDF, upload it, then give the model a signed URL.
    const fileName = file_url.toLowerCase();
    const isPDF = fileName.endsWith('.pdf');
    const isImage = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png');

    let modelFileUrl = "";

    if (isPDF) {
      // Download original PDF (binary) so we can extract page 2 and send ONLY that page.
      // NOTE: Gemini vision does NOT support PDF via remote URL; it requires a data:application/pdf;base64,... URL.
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('scanned-forms')
        .download(file_url);

      if (downloadError || !fileData) {
        console.error("Storage download error:", downloadError);
        throw new Error(`Failed to download file from storage: ${downloadError?.message || 'Unknown error'}`);
      }

      const originalBytes = new Uint8Array(await fileData.arrayBuffer());
      const originalPdf = await PDFDocument.load(originalBytes);
      const pageCount = originalPdf.getPageCount();
      console.log("PDF page count:", pageCount);

      // If there is a page 2, extract it. Otherwise fall back to page 1.
      let pdfBytesToSend: Uint8Array;
      if (pageCount >= 2) {
        const page2Pdf = await PDFDocument.create();
        const [page2] = await page2Pdf.copyPages(originalPdf, [1]);
        page2Pdf.addPage(page2);
        pdfBytesToSend = new Uint8Array(await page2Pdf.save());
        console.log("Extracted page 2 PDF size:", pdfBytesToSend.byteLength);
      } else {
        pdfBytesToSend = originalBytes;
        console.log("No page 2 found; using original PDF");
      }

      // Convert ONLY the selected page PDF to base64 data URL
      const pdfBase64 = btoa(
        Array.from(pdfBytesToSend)
          .map((b) => String.fromCharCode(b))
          .join("")
      );

      modelFileUrl = `data:application/pdf;base64,${pdfBase64}`;
    } else if (isImage) {
      // For images, signed URL is fine (Gemini supports PNG/JPEG/WebP/GIF via URL).
      const { data: signed, error: signedError } = await supabase.storage
        .from('scanned-forms')
        .createSignedUrl(file_url, 60);

      if (signedError || !signed?.signedUrl) {
        console.error("Signed URL error:", signedError);
        throw new Error(`Failed to create signed URL: ${signedError?.message || 'Unknown error'}`);
      }

      modelFileUrl = signed.signedUrl;
    } else {
      throw new Error(`Unsupported file type for extraction: ${file_url}`);
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
