import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONVERSION_PROMPT = `You are an expert email template designer. Convert the following Word document content into a beautifully styled HTML email template.

IMPORTANT DESIGN RULES:
1. Use clean, professional styling that works in email clients
2. Create visually distinct colored boxes for important information:
   - DATES: Use a light blue box (#e3f2fd) with blue border (#2196f3)
   - PAYMENT/BANKING INFO: Use a light green box (#e8f5e9) with green border (#4caf50)
   - IMPORTANT NOTICES: Use a light yellow box (#fff9c4) with amber border (#ffc107)
   - CLASS TIMES/SCHEDULES: Use a light purple box (#f3e5f5) with purple border (#9c27b0)
3. Use proper heading hierarchy (h2, h3, h4)
4. Format lists nicely with proper spacing
5. Make the content scannable and easy to read
6. Use inline styles for everything (no external CSS)
7. Keep the professional tone but make it visually appealing

MERGE FIELD RULES:
- Replace any placeholder text for handler/owner names with {{handler_name}}
- Replace dog names with {{dog_name}}
- Replace class day/time with {{class_day_time}}
- Replace class dates/schedule with {{class_dates}}
- Replace banking details with {{banking_details}}
- Replace branch name with {{branch_name}}
- Replace any personal message areas with {{custom_message}} wrapped in a yellow message box
- Add {{signature}} at the end for the email signature

OUTPUT FORMAT:
Return ONLY valid HTML. Do not include any markdown code blocks, explanations, or other text.
The HTML should start directly with content (div, p, h2, etc.) - no html/head/body tags.
Use font-family: Arial, sans-serif as the base font.
Max width should be 600px for email compatibility.`;

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
