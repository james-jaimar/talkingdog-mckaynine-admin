
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { generatePDF } from "./pdf-generator.ts";
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
    const { invoice, email } = await req.json() as InvoiceRequest;
    
    try {
      // Generate PDF
      console.log("Generating PDF for invoice:", invoice.invoice_number);
      console.log("Invoice status before PDF generation:", invoice.status);
      const pdfBuffer = await generatePDF(invoice);
      console.log("PDF generation completed successfully");
      
      // Send invoice email using Supabase's built-in email service
      console.log(`Sending email to ${email} using Supabase email service...`);
      
      try {
        await sendInvoiceEmail(invoice, email, pdfBuffer);
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
        console.error("Email sending error details:", emailError);
        if (emailError instanceof Error) {
          console.error("Email error stack:", emailError.stack);
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Email sending failed: ${emailError.message}`,
            details: emailError instanceof Error ? emailError.message : String(emailError)
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
    } catch (pdfError) {
      console.error("PDF generation error details:", pdfError);
      if (pdfError instanceof Error) {
        console.error("PDF error stack:", pdfError.stack);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `PDF generation failed: ${pdfError.message}`,
          stack: pdfError instanceof Error ? pdfError.stack : undefined
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
