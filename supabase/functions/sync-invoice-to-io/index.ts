import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Test mode configuration - only sync for these emails
const TEST_MODE = true;
const TEST_CLIENT_EMAILS = ["jimmybhawkins@gmail.com"];

// Branch IDs for mapping to IO credentials
const DELTA_BRANCH_ID = "6351a9e8-77db-46cc-8c54-72be8eb01b65";
const RANDBURG_BRANCH_ID = "284817cf-de0d-4cb1-8e1d-00bb34baf0da";

// IO API base URL
const IO_API_BASE = "https://www.invoicesonline.co.za/api";

interface IOCredentials {
  username: string;
  password: string;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  client_id: string;
  total: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  status: string;
  payment_date: string | null;
  branch_id: string | null;
  io_client_id: number | null;
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
    data: data,
  });

  // Check for success response
  if (typeof result === "object" && result !== null) {
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { invoice_id, action } = await req.json();

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
      client_id: invoice.client_id,
      total: invoice.total,
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax_amount,
      discount_amount: invoice.discount_amount,
      status: invoice.status,
      payment_date: invoice.payment_date,
      branch_id: invoice.branch_id,
      io_client_id: invoice.io_client_id,
      items: items || [],
      client: client,
    };

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

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'invoice' or 'payment'" }),
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
