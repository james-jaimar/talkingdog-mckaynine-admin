import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONVERSION_PROMPT = `You are an expert email template designer for McKaynine dog training school. Convert the following Word document content into a beautifully styled HTML email template.

CRITICAL: You MUST use the EXACT HTML structure and styles shown below. Do not deviate.

CRITICAL COLOR RULES - NEVER VIOLATE:
- Table headers MUST have background-color: #3b7dc4 (blue) with color: white
- NEVER use gray/grey backgrounds with white text - this is unreadable
- Table data rows use background-color: #f9f9f9 (light gray) with color: #333 (dark text)
- All text on light backgrounds must be dark (#333 or #444)
- All text on dark/blue backgrounds must be white

STRUCTURE:
1. Start with a greeting: <p>Dear {{handler_name}},</p>
2. Main congratulatory/informational paragraph
3. Optional personal note section: {{#if custom_message}}<p>{{custom_message}}</p>{{/if}}
4. "What's Next" section in a blue box
5. Course description with bullet points
6. Closing and signature

EXACT STYLING TO USE:

For the main info box (What's Next section):
<div style="background-color: #e8f0fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3 style="margin: 0 0 12px 0; color: #2c5530;">What's Next: [Course Name]</h3>
  <p style="margin: 0 0 15px 0;">This qualifies you to join <strong>[Course Name]</strong> – please find the relevant information below:</p>
  [TABLE HERE]
</div>

For course details tables (MUST USE THIS EXACT FORMAT):
<table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
  <tr>
    <th style="padding: 10px; text-align: left; border: 1px solid #ddd; background-color: #3b7dc4; color: #ffffff;">Course</th>
    <th style="padding: 10px; text-align: left; border: 1px solid #ddd; background-color: #3b7dc4; color: #ffffff;">Price</th>
    <th style="padding: 10px; text-align: left; border: 1px solid #ddd; background-color: #3b7dc4; color: #ffffff;">Entry Criteria</th>
    <th style="padding: 10px; text-align: left; border: 1px solid #ddd; background-color: #3b7dc4; color: #ffffff;">Dates</th>
    <th style="padding: 10px; text-align: left; border: 1px solid #ddd; background-color: #3b7dc4; color: #ffffff;">Day & Time</th>
  </tr>
  <tr style="background-color: #f9f9f9; color: #333;">
    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Course Name</strong></td>
    <td style="padding: 10px; border: 1px solid #ddd;">R1,770.00</td>
    <td style="padding: 10px; border: 1px solid #ddd;">Previous Course</td>
    <td style="padding: 10px; border: 1px solid #ddd;">Dates here</td>
    <td style="padding: 10px; border: 1px solid #ddd;">Day & Time</td>
  </tr>
</table>

For course description sections:
<div style="margin: 20px 0;">
  <h4 style="color: #2c5530; margin-bottom: 10px;">Course Description - [Course Name]:</h4>
  <ul style="margin: 0; padding-left: 20px; color: #444;">
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</div>

For disclaimer notes:
<p style="font-size: 12px; color: #666; margin-top: 10px; font-style: italic;">** Disclaimer text here</p>

MERGE FIELD RULES:
- Replace handler/owner name placeholders with {{handler_name}}
- Replace dog name placeholders with {{dog_name}}
- Replace class day/time with {{class_day_time}}
- Replace class dates with {{class_dates}}
- Replace banking details with {{banking_details}}
- Replace branch name with {{branch_name}}
- Add {{signature}} at the very end for the email signature
- Keep personal message area as: {{#if custom_message}}<p>{{custom_message}}</p>{{/if}}

OUTPUT:
Return ONLY valid HTML. No markdown, no code blocks, no explanations.
Start directly with <div class="email-content"> and end with </div>.
Use font-family: Arial, sans-serif throughout.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_text, file_name } = await req.json();
    
    if (!document_text) {
      return new Response(
        JSON.stringify({ error: 'document_text is required' }),
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

    console.log("Converting document to template...", file_name);
    console.log("Document text length:", document_text.length);

    // Call Lovable AI Gateway
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
            role: "system",
            content: CONVERSION_PROMPT
          },
          {
            role: "user",
            content: `Please convert this Word document to a beautiful HTML email template:\n\n---\nFile: ${file_name || 'document.docx'}\n---\n\n${document_text}`
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
      throw new Error(`AI conversion failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    let htmlContent = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI response received, length:", htmlContent.length);
    
    // Clean up the response - remove markdown code blocks if present
    htmlContent = htmlContent.replace(/```html\n?/gi, '').replace(/```\n?/g, '').trim();
    
    // If the response starts with explanation text, try to extract just the HTML
    if (!htmlContent.startsWith('<')) {
      const htmlMatch = htmlContent.match(/<[^>]+>[\s\S]*<\/[^>]+>/);
      if (htmlMatch) {
        htmlContent = htmlMatch[0];
      }
    }

    // Generate a suggested template name from file name
    let suggestedName = file_name || "Imported Template";
    suggestedName = suggestedName
      .replace(/\.(docx?|doc)$/i, '')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return new Response(
      JSON.stringify({
        success: true,
        html_content: htmlContent,
        suggested_name: suggestedName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in convert-word-to-template:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
