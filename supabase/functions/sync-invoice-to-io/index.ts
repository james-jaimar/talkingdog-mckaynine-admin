import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Test mode configuration - only sync for these emails
const TEST_MODE = true;
const TEST_CLIENT_EMAILS = ["jimmybhawkins@gmail.com"];

// Branch IDs for mapping to IO credentials
const DELTA_BRANCH_ID = "6351a9e8-77db-403b-ab1f-cd47e393a006";
const RANDBURG_BRANCH_ID = "284817cf-de0d-43b9-a506-a3efa625ae1c";

// IO API base URL
const IO_API_BASE = "https://www.invoicesonline.co.za/api";

interface IOCredentials {
  username: string;
  password: string;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  issued_date: string;
  client_id: string;
  total: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  status: string;
  payment_date: string | null;
  branch_id: string | null;
  io_client_id: number | null;
  io_document_id: string | null;
  io_invoice_url: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  client: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    io_client_id_delta: number | null;
    io_client_id_randburg: number | null;
  };
}

// Get IO credentials for a branch
function getIOCredentials(branchId: string | null): IOCredentials | null {
  if (branchId === DELTA_BRANCH_ID) {
    const username = Deno.env.get("IO_USERNAME_DELTA");
    const password = Deno.env.get("IO_PASSWORD_DELTA");
    if (username && password) {
      return { username, password };
    }
  } else if (branchId === RANDBURG_BRANCH_ID) {
    const username = Deno.env.get("IO_USERNAME_RANDBURG");
    const password = Deno.env.get("IO_PASSWORD_RANDBURG");
    if (username && password) {
      return { username, password };
    }
  }
  return null;
}

// Get branch name for IO
function getBranchName(branchId: string | null): string {
  if (branchId === DELTA_BRANCH_ID) return "delta";
  if (branchId === RANDBURG_BRANCH_ID) return "randburg";
  return "unknown";
}

// Generate IO invoice prefix based on branch and date
// Format: McD-YYMM- for Delta, McR-YYMM- for Randburg (exactly 9 characters)
function getIOInvoicePrefix(branchId: string | null, invoiceDate?: string): string {
  const date = invoiceDate ? new Date(invoiceDate) : new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  
  if (branchId === DELTA_BRANCH_ID) return `McD-${yy}${mm}-`;
  if (branchId === RANDBURG_BRANCH_ID) return `McR-${yy}${mm}-`;
  return `McK-${yy}${mm}-`; // Fallback for unknown branch
}

// Call IO API
async function callIOAPI(endpoint: string, body: Record<string, unknown>): Promise<unknown> {
  const url = `${IO_API_BASE}/${endpoint}?apiformat=json`;
  console.log(`Calling IO API: ${url}`);
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  console.log(`IO API response: ${text}`);

  try {
    return JSON.parse(text);
  } catch {
    // Some IO responses return plain text (like client ID)
    return text;
  }
}

// Get or create client in IO
async function getOrCreateIOClient(
  credentials: IOCredentials,
  client: InvoiceData["client"],
  branchId: string | null
): Promise<number | null> {
  const branchName = getBranchName(branchId);
  
  // Check if we already have the IO client ID cached
  if (branchId === DELTA_BRANCH_ID && client.io_client_id_delta) {
    console.log(`Using cached IO client ID for Delta: ${client.io_client_id_delta}`);
    return client.io_client_id_delta;
  }
  if (branchId === RANDBURG_BRANCH_ID && client.io_client_id_randburg) {
    console.log(`Using cached IO client ID for Randburg: ${client.io_client_id_randburg}`);
    return client.io_client_id_randburg;
  }

  // Try to find existing client by email
  const clientName = `${client.first_name} ${client.last_name}`;
  console.log(`Looking up client in IO: ${client.email}`);
  
  const lookupResult = await callIOAPI("GetClientID.php", {
    username: credentials.username,
    password: credentials.password,
    ClientName: clientName,
    ClientEmail: client.email,
    ClientBranchName: branchName,
  });

  // If we got a number back, that's the client ID
  if (typeof lookupResult === "number" && lookupResult > 0) {
    console.log(`Found existing IO client: ${lookupResult}`);
    return lookupResult;
  }
  
  // Parse as number if it's a string number
  if (typeof lookupResult === "string") {
    const parsed = parseInt(lookupResult, 10);
    if (!isNaN(parsed) && parsed > 0) {
      console.log(`Found existing IO client (parsed): ${parsed}`);
      return parsed;
    }
  }

  // Client doesn't exist, create new one
  console.log(`Creating new IO client: ${clientName}`);
  
  const createResult = await callIOAPI("NewClient.php", {
    username: credentials.username,
    password: credentials.password,
    client_invoice_name: clientName,
    client_email: client.email,
    client_phone_nr: client.phone || "",
    contact_name: client.first_name,
    contact_surname: client.last_name,
    client_postal_address1: client.address || "",
    client_postal_address2: client.city ? `${client.city} ${client.postal_code || ""}` : "",
  });

  // Parse the client ID from response
  if (typeof createResult === "number" && createResult > 0) {
    console.log(`Created new IO client: ${createResult}`);
    return createResult;
  }
  
  if (typeof createResult === "string") {
    const parsed = parseInt(createResult, 10);
    if (!isNaN(parsed) && parsed > 0) {
      console.log(`Created new IO client (parsed): ${parsed}`);
      return parsed;
    }
  }

  console.error(`Failed to create IO client. Response: ${JSON.stringify(createResult)}`);
  return null;
}

// Create invoice in IO
async function createIOInvoice(
  credentials: IOCredentials,
  ioClientId: number,
  invoice: InvoiceData
): Promise<{ success: boolean; documentId?: string; invoiceNumber?: string; url?: string; error?: string }> {
  console.log(`Creating IO invoice for client ${ioClientId}, invoice ${invoice.invoice_number}`);

  // Generate prefix from branch and invoice date
  const prefix = getIOInvoicePrefix(invoice.branch_id, invoice.issued_date);
  console.log(`Using IO invoice prefix: ${prefix}`);
  
  // Format invoice date for IO (YYYY-MM-DD)
  const invoiceDate = invoice.issued_date 
    ? new Date(invoice.issued_date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  console.log(`Using invoice date: ${invoiceDate}`);

  // Format items for IO API
  const data = invoice.items.map((item, index) => ({
    "0": "", // prod_code
    "1": item.quantity, // qty
    "2": item.description, // description
    "3": item.unit_price, // amount per unit
    "4": "ZAR", // currency
    "5": 0, // vat_applies (no VAT)
    "6": 0, // vat_percentage
    "7": 0, // amount_includes_vat
  }));

  const result = await callIOAPI("GenerateNewInvoice.php", {
    username: credentials.username,
    password: credentials.password,
    ClientID: ioClientId,
    EmailToClient: false, // We handle emails ourselves
    prepend_nr: prefix, // Add branch and date prefix to IO invoice number
    InvoiceDate: invoiceDate, // Pass the correct invoice date
    data: data,
  });

  // Check for success response - IO returns an array with status and document info
  if (Array.isArray(result) && result.length >= 2) {
    const docInfo = result[1] as Record<string, unknown>;
    if (docInfo.document_id || docInfo.invoice_nr) {
      return {
        success: true,
        documentId: String(docInfo.document_id || ""),
        invoiceNumber: String(docInfo.invoice_nr || docInfo.document_nr || ""),
        url: String(docInfo.url || ""),
      };
    }
  }

  // Also check for single object response as fallback
  if (typeof result === "object" && result !== null && !Array.isArray(result)) {
    const r = result as Record<string, unknown>;
    if (r.document_id || r.invoice_nr) {
      return {
        success: true,
        documentId: String(r.document_id || ""),
        invoiceNumber: String(r.invoice_nr || r.document_nr || ""),
        url: String(r.url || ""),
      };
    }
    if (r.error) {
      return { success: false, error: String(r.error) };
    }
  }

  return { success: false, error: `Unexpected response: ${JSON.stringify(result)}` };
}

// Record payment in IO
async function createIOPayment(
  credentials: IOCredentials,
  ioClientId: number,
  invoice: InvoiceData
): Promise<{ success: boolean; url?: string; error?: string }> {
  console.log(`Recording IO payment for client ${ioClientId}, amount ${invoice.total}`);

  // Format payment date
  const paymentDate = invoice.payment_date 
    ? new Date(invoice.payment_date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const result = await callIOAPI("GenerateNewPayment.php", {
    username: credentials.username,
    password: credentials.password,
    ClientID: ioClientId,
    PaymentDate: paymentDate,
    PaymentAmount: invoice.total,
    PaymentMethod: "EFT",
    EmailToClient: false, // We handle emails ourselves
  });

  // Check for success response
  if (typeof result === "object" && result !== null) {
    const r = result as Record<string, unknown>;
    if (r.url || r.invoice_nr) {
      return {
        success: true,
        url: String(r.url || ""),
      };
    }
    if (r.error) {
      return { success: false, error: String(r.error) };
    }
  }

  return { success: false, error: `Unexpected response: ${JSON.stringify(result)}` };
}

// Create credit note in IO to reverse/void an invoice
async function createIOCreditNote(
  credentials: IOCredentials,
  ioClientId: number,
  invoice: InvoiceData
): Promise<{ success: boolean; documentId?: string; creditNoteNumber?: string; url?: string; error?: string }> {
  console.log(`Creating IO credit note for client ${ioClientId}, reversing invoice ${invoice.invoice_number}`);

  // Generate prefix from branch and invoice date
  const prefix = getIOInvoicePrefix(invoice.branch_id, invoice.issued_date);
  console.log(`Using IO credit note prefix: ${prefix}`);
  
  // Format credit note date (use invoice issued_date for consistency)
  const creditDate = invoice.issued_date 
    ? new Date(invoice.issued_date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  // Format items for IO API - same format as invoice but with "Credit Note" prefix
  const data = invoice.items.map((item) => ({
    "0": "", // prod_code
    "1": item.quantity, // qty
    "2": `Credit Note: ${item.description}`, // description with CN prefix
    "3": item.unit_price, // amount per unit
    "4": "ZAR", // currency
    "5": 0, // vat_applies (no VAT)
    "6": 0, // vat_percentage
    "7": 0, // amount_includes_vat
  }));

  const result = await callIOAPI("GenerateNewCreditNote.php", {
    username: credentials.username,
    password: credentials.password,
    ClientID: ioClientId,
    EmailToClient: false, // We handle emails ourselves
    prepend_nr: prefix, // Add branch and date prefix
    InvoiceDate: creditDate, // Pass the credit note date
    data: data,
  });

  // Check for success response - IO returns an array with status and document info
  if (Array.isArray(result) && result.length >= 2) {
    const docInfo = result[1] as Record<string, unknown>;
    if (docInfo.document_id || docInfo.invoice_nr) {
      return {
        success: true,
        documentId: String(docInfo.document_id || ""),
        creditNoteNumber: String(docInfo.invoice_nr || docInfo.document_nr || ""),
        url: String(docInfo.url || ""),
      };
    }
  }

  // Also check for single object response as fallback
  if (typeof result === "object" && result !== null && !Array.isArray(result)) {
    const r = result as Record<string, unknown>;
    if (r.document_id || r.invoice_nr) {
      return {
        success: true,
        documentId: String(r.document_id || ""),
        creditNoteNumber: String(r.invoice_nr || r.document_nr || ""),
        url: String(r.url || ""),
      };
    }
    if (r.error) {
      return { success: false, error: String(r.error) };
    }
  }

  return { success: false, error: `Unexpected response: ${JSON.stringify(result)}` };
}

// Fetch PDF from IO invoice URL
async function fetchIOPDF(
  invoiceUrl: string
): Promise<{ success: boolean; pdfBase64?: string; error?: string }> {
  console.log(`Fetching PDF from IO URL: ${invoiceUrl}`);
  
  try {
    const response = await fetch(invoiceUrl);
    
    if (!response.ok) {
      return { success: false, error: `Failed to fetch PDF: ${response.status} ${response.statusText}` };
    }
    
    const contentType = response.headers.get("content-type");
    console.log(`PDF response content-type: ${contentType}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdfBase64 = base64Encode(uint8Array);
    
    console.log(`PDF fetched successfully, size: ${pdfBase64.length} chars`);
    
    return { success: true, pdfBase64 };
  } catch (error) {
    console.error(`Error fetching PDF: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test IO credentials by attempting a simple API call
async function testIOCredentials(branchId: string | null): Promise<{ success: boolean; branch: string; error?: string }> {
  const branchName = getBranchName(branchId);
  const credentials = getIOCredentials(branchId);
  
  if (!credentials) {
    return { success: false, branch: branchName, error: "No credentials configured" };
  }

  try {
    // Try to get a non-existent client - this validates credentials work
    const result = await callIOAPI("GetClientID.php", {
      username: credentials.username,
      password: credentials.password,
      ClientName: "Test Connection",
      ClientEmail: "test-connection@lovable.dev",
      ClientBranchName: branchName,
    });

    console.log(`Test result for ${branchName}:`, result);
    
    // If we get an error about invalid credentials, return that
    if (typeof result === "object" && result !== null) {
      const r = result as Record<string, unknown>;
      if (r.error && String(r.error).toLowerCase().includes("invalid")) {
        return { success: false, branch: branchName, error: String(r.error) };
      }
    }
    
    // Any response (even "client not found") means credentials are valid
    return { success: true, branch: branchName };
  } catch (error) {
    return { success: false, branch: branchName, error: error.message };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header for later use
    const authHeader = req.headers.get('Authorization');
    
    const { invoice_id, action } = await req.json();

    // Handle test credentials action - allow without full auth for credential testing
    if (action === "test_credentials") {
      console.log("Testing IO credentials for both branches...");
      
      const deltaResult = await testIOCredentials(DELTA_BRANCH_ID);
      const randburgResult = await testIOCredentials(RANDBURG_BRANCH_ID);
      
      console.log("Delta result:", JSON.stringify(deltaResult));
      console.log("Randburg result:", JSON.stringify(randburgResult));
      
      return new Response(
        JSON.stringify({
          delta: deltaResult,
          randburg: randburgResult,
          overall_success: deltaResult.success && randburgResult.success
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Full auth check for actual invoice operations
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Verify the user's token
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !claims?.user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Authenticated user: ${claims.user.email}`);
    
    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: "invoice_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing sync request: invoice_id=${invoice_id}, action=${action}`);
    
    // Fetch invoice with client and items
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        issued_date,
        client_id,
        total,
        subtotal,
        tax_amount,
        discount_amount,
        status,
        payment_date,
        branch_id,
        io_client_id,
        io_document_id,
        io_sync_status,
        io_invoice_url,
        clients!inner (
          id,
          email,
          first_name,
          last_name,
          phone,
          address,
          city,
          postal_code,
          io_client_id_delta,
          io_client_id_randburg
        )
      `)
      .eq("id", invoice_id)
      .single();

    if (invoiceError || !invoice) {
      console.error("Error fetching invoice:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Invoice not found", details: invoiceError }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from("invoice_items")
      .select("description, quantity, unit_price, amount")
      .eq("invoice_id", invoice_id);

    if (itemsError) {
      console.error("Error fetching invoice items:", itemsError);
    }

    // Build invoice data object
    const client = invoice.clients as InvoiceData["client"];
    const invoiceData: InvoiceData = {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      issued_date: invoice.issued_date,
      client_id: invoice.client_id,
      total: invoice.total,
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax_amount,
      discount_amount: invoice.discount_amount,
      status: invoice.status,
      payment_date: invoice.payment_date,
      branch_id: invoice.branch_id,
      io_client_id: invoice.io_client_id,
      io_document_id: invoice.io_document_id,
      io_invoice_url: invoice.io_invoice_url,
      items: items || [],
      client: client,
    };

    // Handle get_pdf action - fetch invoice PDF from IO
    if (action === "get_pdf") {
      if (!invoice.io_invoice_url) {
        return new Response(
          JSON.stringify({ error: "Invoice not synced to IO yet - no PDF URL available" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const pdfResult = await fetchIOPDF(invoice.io_invoice_url);
      
      if (pdfResult.success) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            action: "get_pdf",
            pdf_base64: pdfResult.pdfBase64,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: pdfResult.error }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle get_payment_pdf action - fetch payment receipt PDF from IO
    if (action === "get_payment_pdf") {
      if (!invoice.io_payment_url) {
        return new Response(
          JSON.stringify({ error: "Payment not synced to IO yet - no payment PDF URL available" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const pdfResult = await fetchIOPDF(invoice.io_payment_url);
      
      if (pdfResult.success) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            action: "get_payment_pdf",
            pdf_base64: pdfResult.pdfBase64,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: pdfResult.error }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // TEST MODE CHECK
    if (TEST_MODE && !TEST_CLIENT_EMAILS.includes(client.email.toLowerCase())) {
      console.log(`Test mode: Skipping sync for ${client.email} (not in test list)`);
      return new Response(
        JSON.stringify({ 
          skipped: true, 
          reason: "Test mode - client not in test list",
          client_email: client.email 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get IO credentials for this branch
    const credentials = getIOCredentials(invoiceData.branch_id);
    if (!credentials) {
      console.error(`No IO credentials for branch: ${invoiceData.branch_id}`);
      
      // Update invoice with error
      await supabase
        .from("invoices")
        .update({
          io_sync_status: "failed",
          io_sync_error: `No IO credentials configured for branch ${getBranchName(invoiceData.branch_id)}`,
        })
        .eq("id", invoice_id);

      return new Response(
        JSON.stringify({ 
          error: "No IO credentials configured for this branch",
          branch_id: invoiceData.branch_id 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get or create client in IO
    const ioClientId = await getOrCreateIOClient(credentials, client, invoiceData.branch_id);
    if (!ioClientId) {
      console.error("Failed to get/create IO client");
      
      await supabase
        .from("invoices")
        .update({
          io_sync_status: "failed",
          io_sync_error: "Failed to get/create client in InvoicesOnline",
        })
        .eq("id", invoice_id);

      return new Response(
        JSON.stringify({ error: "Failed to get/create IO client" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cache the IO client ID on the client record
    const clientUpdateField = invoiceData.branch_id === DELTA_BRANCH_ID 
      ? "io_client_id_delta" 
      : "io_client_id_randburg";
    
    await supabase
      .from("clients")
      .update({ [clientUpdateField]: ioClientId })
      .eq("id", client.id);

    // Handle invoice sync
    if (action === "invoice") {
      const result = await createIOInvoice(credentials, ioClientId, invoiceData);
      
      if (result.success) {
        await supabase
          .from("invoices")
          .update({
            io_sync_status: "synced",
            io_sync_error: null,
            io_synced_at: new Date().toISOString(),
            io_document_id: result.documentId,
            io_invoice_number: result.invoiceNumber,
            io_invoice_url: result.url,
            io_client_id: ioClientId,
          })
          .eq("id", invoice_id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            action: "invoice",
            io_document_id: result.documentId,
            io_invoice_number: result.invoiceNumber,
            io_invoice_url: result.url,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        await supabase
          .from("invoices")
          .update({
            io_sync_status: "failed",
            io_sync_error: result.error,
          })
          .eq("id", invoice_id);

        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle payment sync
    if (action === "payment") {
      // Check if invoice was synced first
      if (!invoice.io_document_id) {
        return new Response(
          JSON.stringify({ error: "Invoice must be synced before recording payment" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await createIOPayment(credentials, ioClientId, invoiceData);
      
      if (result.success) {
        await supabase
          .from("invoices")
          .update({
            io_sync_status: "payment_synced",
            io_sync_error: null,
            io_synced_at: new Date().toISOString(),
            io_payment_url: result.url,
          })
          .eq("id", invoice_id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            action: "payment",
            io_payment_url: result.url,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        await supabase
          .from("invoices")
          .update({
            io_sync_status: "failed",
            io_sync_error: result.error,
          })
          .eq("id", invoice_id);

        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle credit note (void/delete invoice)
    if (action === "credit_note") {
      // Check if invoice was synced first
      if (!invoice.io_document_id) {
        return new Response(
          JSON.stringify({ error: "Invoice must be synced to IO before issuing credit note" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await createIOCreditNote(credentials, ioClientId, invoiceData);
      
      if (result.success) {
        await supabase
          .from("invoices")
          .update({
            io_sync_status: "credit_note_issued",
            io_sync_error: null,
            io_synced_at: new Date().toISOString(),
            io_credit_note_id: result.documentId,
            io_credit_note_number: result.creditNoteNumber,
            io_credit_note_url: result.url,
          })
          .eq("id", invoice_id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            action: "credit_note",
            io_credit_note_id: result.documentId,
            io_credit_note_number: result.creditNoteNumber,
            io_credit_note_url: result.url,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        await supabase
          .from("invoices")
          .update({
            io_sync_status: "failed",
            io_sync_error: result.error,
          })
          .eq("id", invoice_id);

        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'invoice', 'payment', 'credit_note', 'get_pdf', or 'get_payment_pdf'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in sync-invoice-to-io:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
