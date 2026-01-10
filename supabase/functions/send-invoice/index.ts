
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendInvoiceEmail } from "./email-sender.ts";
import { InvoiceRequest, corsHeaders } from "./types.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Invoice function started");
    
    // Get request data
    const { invoice, email, pdfBase64, customSubject, customEmailHtml } = await req.json() as InvoiceRequest & { 
      pdfBase64: string;
      customSubject?: string;
      customEmailHtml?: string;
    };
    
    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing PDF data" 
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    try {
      console.log(`Sending email to ${email}...`);
      console.log("Custom email content provided:", !!customEmailHtml);
      
      try {
        // Convert base64 string to ArrayBuffer
        const binaryString = atob(pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const pdfBuffer = bytes.buffer;
        
        // Send email with the PDF attachment (pass custom content if provided)
        await sendInvoiceEmail(invoice, email, pdfBuffer, customSubject, customEmailHtml);
        console.log("Email sent successfully!");
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Invoice sent successfully" 
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        if (emailError instanceof Error) {
          console.error("Email error stack:", emailError.stack);
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Email sending failed: ${emailError.message}`,
            details: emailError instanceof Error ? emailError.message : String(emailError),
            stack: emailError instanceof Error ? emailError.stack : undefined
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
    } catch (error) {
      console.error("General processing error:", error);
      if (error instanceof Error) {
        console.error("Processing error stack:", error.stack);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Processing failed: ${error.message}`,
          stack: error instanceof Error ? error.stack : undefined
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
  } catch (error) {
    console.error("General request error:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Request processing failed: ${error.message}`,
        type: error.constructor?.name || 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
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

console.log("Invoice email function initialized");
serve(handler);
