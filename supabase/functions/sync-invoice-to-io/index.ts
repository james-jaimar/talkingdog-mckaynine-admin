import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Test mode configuration - only sync for these emails
const TEST_MODE = false;
const TEST_CLIENT_EMAILS = ["jimmybhawkins@gmail.com"];

// Branch IDs for mapping to IO credentials
const DELTA_BRANCH_ID = "6351a9e8-77db-403b-ab1f-cd47e393a006";
const RANDBURG_BRANCH_ID = "284817cf-de0d-43b9-a506-a3efa625ae1c";

// IO Business IDs (from IO account settings) - needed for constructing PDF URLs
const IO_BUSINESS_ID_DELTA = "8978";
const IO_BUSINESS_ID_RANDBURG = "8978"; // TODO: Update with actual Randburg business ID when known

// IO API base URL
const IO_API_BASE = "https://www.invoicesonline.co.za/api";
const IO_DOWNLOAD_BASE = "https://www.invoicesonline.co.za/scripts/Download.php";

interface IOCredentials {
  username: string;
  password: string;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  issued_date: string;
  franchise_report_month: string | null; // e.g. "2026-02"
  client_id: string;
  total: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  monetary_discount: number | null;
  status: string;
  payment_date: string | null;
  branch_id: string | null;
  io_client_id: number | null;
  io_document_id: string | null;
  io_invoice_number: string | null;
  io_invoice_url: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    io_inventory_code?: string | null;
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

// Get IO Business ID for URL construction
function getIOBusinessId(branchId: string | null): string {
  if (branchId === DELTA_BRANCH_ID) return IO_BUSINESS_ID_DELTA;
  if (branchId === RANDBURG_BRANCH_ID) return IO_BUSINESS_ID_RANDBURG;
  return "";
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

  // Use franchise_report_month if available, otherwise fall back to issued_date
  // This ensures IO invoices align with franchise reporting periods
  let effectiveDate: string;
  if (invoice.franchise_report_month) {
    // franchise_report_month is "YYYY-MM", use the 1st of that month
    effectiveDate = `${invoice.franchise_report_month}-01`;
    console.log(`Using franchise_report_month for IO date: ${invoice.franchise_report_month} -> ${effectiveDate}`);
  } else {
    effectiveDate = invoice.issued_date || new Date().toISOString().split("T")[0];
    console.log(`No franchise_report_month, using issued_date: ${effectiveDate}`);
  }

  // Generate prefix from branch and effective date
  const prefix = getIOInvoicePrefix(invoice.branch_id, effectiveDate);
  console.log(`Using IO invoice prefix: ${prefix}`);
  
  // Format invoice date for IO (YYYY-MM-DD)
  const invoiceDate = new Date(effectiveDate).toISOString().split("T")[0];
  console.log(`Using invoice date: ${invoiceDate}`);

  // Apply invoice-level discount proportionally to item unit prices
  // so IO receives the post-discount amounts (IO doesn't handle our discounts)
  const monetaryDiscount = invoice.monetary_discount || 0;
  const subtotal = invoice.subtotal || 0;
  let adjustedItems = invoice.items.map(item => ({ ...item }));

  if (monetaryDiscount > 0 && subtotal > 0) {
    const discountRatio = monetaryDiscount / subtotal;
    let accumulatedTotal = 0;
    const targetTotal = Math.round((subtotal - monetaryDiscount) * 100) / 100;

    adjustedItems = adjustedItems.map((item, index) => {
      const isLast = index === adjustedItems.length - 1;
      if (isLast) {
        // Last item absorbs rounding remainder
        const remainingTotal = Math.round((targetTotal - accumulatedTotal) * 100) / 100;
        const adjustedUnitPrice = item.quantity > 0
          ? Math.round((remainingTotal / item.quantity) * 100) / 100
          : 0;
        return { ...item, unit_price: adjustedUnitPrice };
      } else {
        const adjustedUnitPrice = Math.round((item.unit_price * (1 - discountRatio)) * 100) / 100;
        accumulatedTotal += Math.round((adjustedUnitPrice * item.quantity) * 100) / 100;
        return { ...item, unit_price: adjustedUnitPrice };
      }
    });
    console.log(`Applied discount: ratio=${discountRatio}, targetTotal=${targetTotal}, items adjusted`);
  }

  // Format items for IO API
  const data = adjustedItems.map((item: any) => ({
    "0": item.io_inventory_code || "", // prod_code (IO inventory SKU)
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
  invoice: InvoiceData,
  businessId: string
): Promise<{ success: boolean; paymentId?: string; paymentNr?: number; url?: string; error?: string }> {
  console.log(`Recording IO payment for client ${ioClientId}, amount ${invoice.total}`);

  // Format payment date
  const paymentDate = invoice.payment_date 
    ? new Date(invoice.payment_date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  // Build description from invoice items
  const description = invoice.items
    .map(item => item.description)
    .join("; ")
    .slice(0, 200); // IO might have a limit, keep it reasonable

  const result = await callIOAPI("GenerateNewPayment.php", {
    username: credentials.username,
    password: credentials.password,
    ClientID: ioClientId,
    PaymentDate: paymentDate,
    PaymentAmount: invoice.total,
    PaymentMethod: "EFT",
    EmailToClient: false, // We handle emails ourselves
    ReferenceNumber: invoice.invoice_number.slice(0, 30), // Max 30 chars - e.g., "McD-2602-0017"
    Description: description, // Summary of invoice items
  });

  // IO returns an array for payment responses
  if (Array.isArray(result) && result.length > 0) {
    const paymentInfo = result[0] as Record<string, unknown>;
    if (paymentInfo.type === "success" || paymentInfo.PaymentID) {
      const paymentId = String(paymentInfo.PaymentID || "");
      const paymentNr = Number(paymentInfo.PaymentNR || 0);
      
      // Construct the payment receipt PDF URL ourselves
      // IO doesn't return a URL for payments, but we can build it using the same pattern as invoices
      const paymentUrl = paymentId && paymentNr && businessId
        ? `${IO_DOWNLOAD_BASE}?type=payment&id=${paymentId}&bid=${businessId}&did=${paymentNr}`
        : "";
      
      console.log(`Payment recorded successfully: PaymentID=${paymentId}, PaymentNR=${paymentNr}, URL=${paymentUrl}`);
      return {
        success: true,
        paymentId,
        paymentNr,
        url: paymentUrl,
      };
    }
    if (paymentInfo.error) {
      return { success: false, error: String(paymentInfo.error) };
    }
  }

  // Fallback: single object response
  if (typeof result === "object" && result !== null && !Array.isArray(result)) {
    const r = result as Record<string, unknown>;
    if (r.type === "success" || r.PaymentID) {
      const paymentId = String(r.PaymentID || "");
      const paymentNr = Number(r.PaymentNR || 0);
      
      const paymentUrl = paymentId && paymentNr && businessId
        ? `${IO_DOWNLOAD_BASE}?type=payment&id=${paymentId}&bid=${businessId}&did=${paymentNr}`
        : "";
      
      return {
        success: true,
        paymentId,
        paymentNr,
        url: paymentUrl,
      };
    }
    if (r.error) {
      return { success: false, error: String(r.error) };
    }
  }

  return { success: false, error: `Unexpected response: ${JSON.stringify(result)}` };
}

// Create payout in IO to reverse a payment effect
async function createIOPayout(
  credentials: IOCredentials,
  ioClientId: number,
  invoice: InvoiceData
): Promise<{ success: boolean; documentId?: string; payoutNumber?: string; url?: string; error?: string }> {
  console.log(`Creating IO payout for client ${ioClientId}, reversing payment for ${invoice.invoice_number}`);

  // Generate prefix from branch and invoice date
  const prefix = getIOInvoicePrefix(invoice.branch_id, invoice.issued_date);
  console.log(`Using IO payout prefix: ${prefix}`);
  
  // Format payout date (use payment_date if available, otherwise today)
  const payoutDate = invoice.payment_date 
    ? new Date(invoice.payment_date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  // Format items for IO API - include reference to original invoice in description
  const data = invoice.items.map((item) => ({
    "0": "", // prod_code
    "1": item.quantity, // qty
    "2": `Reversal for ${invoice.invoice_number}: ${item.description}`, // Clear reference to original invoice
    "3": item.unit_price, // amount per unit
    "4": "ZAR", // currency
    "5": 0, // vat_applies (no VAT)
    "6": 0, // vat_percentage
    "7": 0, // amount_includes_vat
  }));

  const result = await callIOAPI("GenerateNewPayout.php", {
    username: credentials.username,
    password: credentials.password,
    ClientID: ioClientId,
    EmailToClient: false, // We handle emails ourselves
    prepend_nr: prefix, // Add branch and date prefix
    InvoiceDate: payoutDate, // Pass the payout date
    OrderNr: invoice.io_invoice_number || "", // Reference to original IO invoice (max 10 chars)
    AdditionalValue1: invoice.invoice_number, // McKaynine invoice number (max 32 chars)
    data: data,
  });

  // Check for success response - IO returns an array with status and document info
  if (Array.isArray(result) && result.length >= 2) {
    const docInfo = result[1] as Record<string, unknown>;
    if (docInfo.document_id || docInfo.invoice_nr) {
      return {
        success: true,
        documentId: String(docInfo.document_id || ""),
        payoutNumber: String(docInfo.invoice_nr || docInfo.document_nr || ""),
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
        payoutNumber: String(r.invoice_nr || r.document_nr || ""),
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

  // Format items for IO API - include reference to original invoice in description
  const data = invoice.items.map((item) => ({
    "0": "", // prod_code
    "1": item.quantity, // qty
    "2": `CN for ${invoice.invoice_number}: ${item.description}`, // Clear reference to original invoice
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
    OrderNr: invoice.io_invoice_number || "", // Reference to original IO invoice (max 10 chars)
    AdditionalValue1: invoice.invoice_number, // McKaynine invoice number (max 32 chars)
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

// Fetch PDF from IO invoice URL (direct fetch - IO URLs are self-authenticating via query params)
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
    
    // Validate we actually got a PDF, not an HTML error/login page
    const header = new TextDecoder().decode(new Uint8Array(arrayBuffer).slice(0, 5));
    if (!header.startsWith("%PDF")) {
      console.error(`IO returned non-PDF content. Content-type: ${contentType}, header: ${header}`);
      return { 
        success: false, 
        error: `IO returned non-PDF content (${contentType || 'unknown'}).` 
      };
    }
    
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
        franchise_report_month,
        client_id,
        total,
        subtotal,
        tax_amount,
        discount_amount,
        monetary_discount,
        status,
        payment_date,
        branch_id,
        io_client_id,
        io_document_id,
        io_invoice_number,
        io_sync_status,
        io_invoice_url,
        io_payment_url,
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
      .select("description, quantity, unit_price, amount, io_inventory_code")
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
      franchise_report_month: invoice.franchise_report_month,
      client_id: invoice.client_id,
      total: invoice.total,
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax_amount,
      discount_amount: invoice.discount_amount,
      monetary_discount: invoice.monetary_discount,
      status: invoice.status,
      payment_date: invoice.payment_date,
      branch_id: invoice.branch_id,
      io_client_id: invoice.io_client_id,
      io_document_id: invoice.io_document_id,
      io_invoice_number: invoice.io_invoice_number,
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
      
      const pdfCredentials = getIOCredentials(invoice.branch_id);
      if (!pdfCredentials) {
        return new Response(
          JSON.stringify({ error: "No IO credentials configured for this branch" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const pdfResult = await fetchIOPDF(invoice.io_invoice_url, pdfCredentials);
      
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
      
      const paymentPdfCredentials = getIOCredentials(invoice.branch_id);
      if (!paymentPdfCredentials) {
        return new Response(
          JSON.stringify({ error: "No IO credentials configured for this branch" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const pdfResult = await fetchIOPDF(invoice.io_payment_url, paymentPdfCredentials);
      
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
      // IDEMPOTENCY CHECK: If already synced, return existing data (prevents duplicates)
      if (invoice.io_document_id && invoice.io_invoice_url) {
        console.log(`[IO Sync] Invoice already synced to IO: ${invoice.io_document_id}, skipping re-sync`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            action: "invoice",
            already_synced: true,
            io_document_id: invoice.io_document_id,
            io_invoice_number: invoice.io_invoice_number,
            io_invoice_url: invoice.io_invoice_url,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // SERVER-SIDE LOCK: Atomically claim the sync to prevent race conditions.
      // Only proceed if io_sync_status is NOT already 'syncing', 'synced', or 'payment_synced'.
      // Uses count:'exact' instead of select() to avoid PostgREST bug with UPDATE+OR+representation.
      const { count: lockCount, error: lockError } = await supabase
        .from("invoices")
        .update({ io_sync_status: "syncing" }, { count: 'exact' })
        .eq("id", invoice_id)
        .or("io_sync_status.is.null,io_sync_status.eq.failed,io_sync_status.eq.pending");

      console.log(`[IO Sync] Lock attempt for ${invoice_id}: count=${lockCount}, error=${lockError?.code || 'none'}`);

      if (lockError) {
        console.error("[IO Sync] Lock query failed:", { code: lockError.code, message: lockError.message, invoice_id });
        return new Response(
          JSON.stringify({ error: `Lock acquisition failed: ${lockError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (lockCount === 0) {
        // Another call is already syncing or has synced. Poll for up to 15 seconds.
        console.log("[IO Sync] Another sync is in progress (lockCount=0), polling for result...");
        for (let i = 0; i < 15; i++) {
          await new Promise(r => setTimeout(r, 1000));
          const { data: polled } = await supabase
            .from("invoices")
            .select("io_document_id, io_invoice_number, io_invoice_url, io_sync_status")
            .eq("id", invoice_id)
            .single();

          if (polled?.io_document_id && polled?.io_invoice_url) {
            console.log(`[IO Sync] Poll success: synced by another call, doc=${polled.io_document_id}`);
            return new Response(
              JSON.stringify({
                success: true,
                action: "invoice",
                already_synced: true,
                io_document_id: polled.io_document_id,
                io_invoice_number: polled.io_invoice_number,
                io_invoice_url: polled.io_invoice_url,
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (polled?.io_sync_status === "failed") {
            console.log("[IO Sync] Other sync failed, but not retrying in this call");
            return new Response(
              JSON.stringify({ error: "Concurrent sync failed. Please retry." }),
              { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
        // Timed out waiting
        console.warn("[IO Sync] Timed out waiting for concurrent sync");
        return new Response(
          JSON.stringify({ error: "Sync in progress by another request. Please retry shortly." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[IO Sync] Lock acquired, proceeding with IO API call");
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

      const businessId = getIOBusinessId(invoiceData.branch_id);
      const result = await createIOPayment(credentials, ioClientId, invoiceData, businessId);
      
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

    // Handle reverse_paid_invoice (payout + credit note for paid invoices)
    if (action === "reverse_paid_invoice") {
      // Check if invoice was synced first
      if (!invoice.io_document_id) {
        return new Response(
          JSON.stringify({ error: "Invoice must be synced to IO before reversing" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Step 1: Create payout to reverse the payment effect
      console.log("[Reverse] Step 1: Creating payout to reverse payment...");
      const payoutResult = await createIOPayout(credentials, ioClientId, invoiceData);
      
      if (!payoutResult.success) {
        await supabase
          .from("invoices")
          .update({
            io_sync_status: "failed",
            io_sync_error: `Payout failed: ${payoutResult.error}`,
          })
          .eq("id", invoice_id);

        return new Response(
          JSON.stringify({ error: `Payout failed: ${payoutResult.error}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Reverse] Payout created: ${payoutResult.payoutNumber}`);

      // Step 2: Create credit note to reverse the invoice
      console.log("[Reverse] Step 2: Creating credit note to reverse invoice...");
      const creditResult = await createIOCreditNote(credentials, ioClientId, invoiceData);
      
      if (!creditResult.success) {
        // Payout succeeded but credit note failed - partial failure
        await supabase
          .from("invoices")
          .update({
            io_sync_status: "partial_reversal",
            io_sync_error: `Payout created but credit note failed: ${creditResult.error}`,
          })
          .eq("id", invoice_id);

        return new Response(
          JSON.stringify({ 
            error: `Credit note failed: ${creditResult.error}`,
            payout_created: true,
            io_payout_number: payoutResult.payoutNumber,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Reverse] Credit note created: ${creditResult.creditNoteNumber}`);

      // Both succeeded - update invoice record
      await supabase
        .from("invoices")
        .update({
          io_sync_status: "reversed",
          io_sync_error: null,
          io_synced_at: new Date().toISOString(),
          io_credit_note_id: creditResult.documentId,
          io_credit_note_number: creditResult.creditNoteNumber,
          io_credit_note_url: creditResult.url,
        })
        .eq("id", invoice_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          action: "reverse_paid_invoice",
          io_payout_number: payoutResult.payoutNumber,
          io_payout_url: payoutResult.url,
          io_credit_note_id: creditResult.documentId,
          io_credit_note_number: creditResult.creditNoteNumber,
          io_credit_note_url: creditResult.url,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'invoice', 'payment', 'credit_note', 'reverse_paid_invoice', 'get_pdf', or 'get_payment_pdf'" }),
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
