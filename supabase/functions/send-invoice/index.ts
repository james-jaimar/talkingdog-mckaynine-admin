
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
    // Get request data
    const { invoice, email } = await req.json() as InvoiceRequest;
    
    // Generate PDF
    console.log("Generating PDF for invoice:", invoice.invoice_number);
    const pdfBuffer = await generatePDF(invoice);
    
    // Send invoice email
    console.log(`Sending email to ${email}...`);
    const result = await sendInvoiceEmail(invoice, email, pdfBuffer);

    console.log("Email sent successfully!");
    
    return new Response(
      JSON.stringify({ success: true, message: "Invoice sent successfully" }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending invoice:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
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

serve(handler);
