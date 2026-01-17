import { SupabaseClient } from "@supabase/supabase-js";
import { generateInvoiceNumber } from "@/hooks/invoices/useInvoiceUtilities";
import { autoCreateHandlerAccount } from "@/lib/account/autoCreateHandlerAccount";
export interface BulkImportRow {
  handler_name: string;
  email: string;
  phone?: string;
  dog_name: string;
  breed: string;
  dog_dob?: string;
  schedule_id: string;
  payment_status?: string;
  invoice_status?: string;
}

export interface ImportResult {
  success: boolean;
  row: number;
  handler_name: string;
  dog_name: string;
  message: string;
}

export interface ImportSummary {
  total: number;
  success: number;
  failed: number;
  handlersCreated: number;
  dogsCreated: number;
  bookingsCreated: number;
  invoicesCreated: number;
  results: ImportResult[];
}

export interface ValidationResult {
  isValid: boolean;
  existingHandlers: { email: string; handler_name: string; clientId: string }[];
  newHandlers: { email: string; handler_name: string; row: number }[];
  errors: string[];
}

/**
 * Pre-validate bulk import data to check for existing handlers
 * This allows users to see which handlers are new before importing
 */
export async function validateBulkImport(
  data: any[],
  supabase: SupabaseClient
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    existingHandlers: [],
    newHandlers: [],
    errors: [],
  };

  // Parse all rows and collect unique emails
  const emailMap = new Map<string, { handler_name: string; row: number }>();
  
  for (let i = 0; i < data.length; i++) {
    const row = parseRow(data[i]);
    const rowNum = i + 2;

    if (!row.email) {
      result.errors.push(`Row ${rowNum}: Missing email address`);
      continue;
    }

    const email = row.email.toLowerCase().trim();
    if (!emailMap.has(email)) {
      emailMap.set(email, { handler_name: row.handler_name || "Unknown", row: rowNum });
    }
  }

  if (emailMap.size === 0) {
    result.isValid = false;
    result.errors.push("No valid email addresses found in the CSV");
    return result;
  }

  // Query database for existing clients
  const emails = Array.from(emailMap.keys());
  const { data: existingClients, error } = await supabase
    .from("clients")
    .select("id, email, first_name, last_name")
    .in("email", emails);

  if (error) {
    result.isValid = false;
    result.errors.push(`Database error: ${error.message}`);
    return result;
  }

  // Build set of existing emails for quick lookup
  const existingEmailSet = new Set(
    existingClients?.map((c) => c.email.toLowerCase()) || []
  );

  // Categorize handlers
  for (const [email, info] of emailMap.entries()) {
    const existing = existingClients?.find(
      (c) => c.email.toLowerCase() === email
    );

    if (existing) {
      result.existingHandlers.push({
        email,
        handler_name: `${existing.first_name} ${existing.last_name}`.trim(),
        clientId: existing.id,
      });
    } else {
      result.newHandlers.push({
        email,
        handler_name: info.handler_name,
        row: info.row,
      });
    }
  }

  return result;
}

export interface TermFilter {
  year: number;
  termNumber: string;
}

/**
 * Process bulk import of handlers into classes
 * Creates handlers, dogs, bookings, and invoices in one go
 */
export async function processBulkClassImport(
  data: any[],
  supabase: SupabaseClient,
  branchId?: string,
  termFilter?: TermFilter
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    total: data.length,
    success: 0,
    failed: 0,
    handlersCreated: 0,
    dogsCreated: 0,
    bookingsCreated: 0,
    invoicesCreated: 0,
    results: [],
  };

  // Get the term_id for the selected year/term if provided
  let termId: string | null = null;
  if (termFilter) {
    const { data: termData, error: termError } = await supabase
      .from("terms")
      .select("id")
      .eq("term_number", termFilter.termNumber)
      .eq("academic_year_id", (
        await supabase
          .from("academic_years")
          .select("id")
          .eq("year", termFilter.year)
          .single()
      ).data?.id)
      .maybeSingle();
    
    if (termData) {
      termId = termData.id;
      console.log(`Found term_id ${termId} for Term ${termFilter.termNumber} ${termFilter.year}`);
    } else {
      console.warn(`No term found for Term ${termFilter.termNumber} ${termFilter.year}`);
    }
  }

  for (let i = 0; i < data.length; i++) {
    const row = parseRow(data[i]);
    const rowNum = i + 2; // Account for header row

    try {
      // Validate required fields
      if (!row.handler_name || !row.email || !row.dog_name || !row.breed || !row.schedule_id) {
        summary.results.push({
          success: false,
          row: rowNum,
          handler_name: row.handler_name || "Unknown",
          dog_name: row.dog_name || "Unknown",
          message: "Missing required fields (handler_name, email, dog_name, breed, schedule_id)",
        });
        summary.failed++;
        continue;
      }

      // 1. Validate schedule exists and get class details
      let scheduleQuery = supabase
        .from("class_schedules")
        .select(`
          id,
          start_time,
          selected_dates,
          class_id,
          term_id,
          classes (
            id,
            name,
            course_fee,
            enrollment_fee,
            class_type
          )
        `)
        .eq("id", row.schedule_id);
      
      // Filter by term if provided
      if (termId) {
        scheduleQuery = scheduleQuery.eq("term_id", termId);
      }
      
      const { data: schedule, error: scheduleError } = await scheduleQuery.single();

      if (scheduleError || !schedule) {
        const termInfo = termFilter ? ` in Term ${termFilter.termNumber} ${termFilter.year}` : "";
        summary.results.push({
          success: false,
          row: rowNum,
          handler_name: row.handler_name,
          dog_name: row.dog_name,
          message: `Invalid schedule_id: ${row.schedule_id}${termInfo}`,
        });
        summary.failed++;
        continue;
      }

      // 2. Get or create handler (client)
      const { clientId, created: handlerCreated } = await getOrCreateClient(
        supabase,
        row,
        branchId
      );

      if (!clientId) {
        summary.results.push({
          success: false,
          row: rowNum,
          handler_name: row.handler_name,
          dog_name: row.dog_name,
          message: "Failed to create/find handler",
        });
        summary.failed++;
        continue;
      }

      if (handlerCreated) summary.handlersCreated++;

      // 3. Get or create dog
      const { dogId, created: dogCreated } = await getOrCreateDog(
        supabase,
        row,
        clientId
      );

      if (!dogId) {
        summary.results.push({
          success: false,
          row: rowNum,
          handler_name: row.handler_name,
          dog_name: row.dog_name,
          message: "Failed to create/find dog",
        });
        summary.failed++;
        continue;
      }

      if (dogCreated) summary.dogsCreated++;

      // 4. Check if already booked
      const { data: existingBooking } = await supabase
        .from("bookings")
        .select("id")
        .eq("class_schedule_id", row.schedule_id)
        .eq("client_id", clientId)
        .eq("dog_id", dogId)
        .maybeSingle();

      if (existingBooking) {
        summary.results.push({
          success: false,
          row: rowNum,
          handler_name: row.handler_name,
          dog_name: row.dog_name,
          message: "Already enrolled in this class",
        });
        summary.failed++;
        continue;
      }

      // 5. Create booking
      const paymentStatus = row.payment_status || "pending";
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          class_schedule_id: row.schedule_id,
          client_id: clientId,
          dog_id: dogId,
          status: "confirmed",
          payment_status: paymentStatus,
          is_enrolled: true,
        })
        .select("id")
        .single();

      if (bookingError || !booking) {
        summary.results.push({
          success: false,
          row: rowNum,
          handler_name: row.handler_name,
          dog_name: row.dog_name,
          message: `Booking failed: ${bookingError?.message}`,
        });
        summary.failed++;
        continue;
      }

      summary.bookingsCreated++;

      // 6. Create invoice using class date
      const classDate = getClassDate(schedule);
      const classInfo = schedule.classes as any;
      const courseFee = classInfo?.course_fee || 0;
      const enrollmentFee = classInfo?.enrollment_fee || 0;

      if (courseFee > 0 || enrollmentFee > 0) {
        const invoiceCreated = await createInvoiceForImport(
          supabase,
          clientId,
          booking.id,
          classDate,
          classInfo?.name || "Training Class",
          courseFee,
          enrollmentFee,
          row.invoice_status
        );

        if (invoiceCreated) summary.invoicesCreated++;
      }

      summary.results.push({
        success: true,
        row: rowNum,
        handler_name: row.handler_name,
        dog_name: row.dog_name,
        message: `Added to ${classInfo?.name || "class"}`,
      });
      summary.success++;

    } catch (error: any) {
      console.error(`Row ${rowNum} error:`, error);
      summary.results.push({
        success: false,
        row: rowNum,
        handler_name: row.handler_name || "Unknown",
        dog_name: row.dog_name || "Unknown",
        message: error.message || "Unknown error",
      });
      summary.failed++;
    }
  }

  return summary;
}

function parseRow(row: any): BulkImportRow {
  const parsed: any = {};
  for (const key of Object.keys(row)) {
    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, "_");
    let value = row[key]?.toString().trim() || "";
    
    // Prefix phone numbers with 0 if they don't start with 0 or +
    if (normalizedKey === "phone" && value && !value.startsWith("0") && !value.startsWith("+")) {
      value = "0" + value;
    }
    
    parsed[normalizedKey] = value;
  }
  return parsed as BulkImportRow;
}

async function getOrCreateClient(
  supabase: SupabaseClient,
  row: BulkImportRow,
  branchId?: string
): Promise<{ clientId: string | null; created: boolean }> {
  const email = row.email.toLowerCase().trim();

  // Check existing
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return { clientId: existing.id, created: false };
  }

  // Parse name
  const nameParts = row.handler_name.trim().split(/\s+/);
  const firstName = nameParts[0] || "Unknown";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Create new client
  const { data: newClient, error } = await supabase
    .from("clients")
    .insert({
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: row.phone || null,
      branch_id: branchId || null,
      onboarding_status: "complete",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Client creation error:", error);
    return { clientId: null, created: false };
  }

  // Auto-create handler login account (non-blocking)
  if (newClient?.id && branchId) {
    try {
      await autoCreateHandlerAccount(newClient.id, email, branchId);
    } catch (accountError) {
      console.warn("Auto account creation failed during bulk import (non-blocking):", accountError);
    }
  }

  return { clientId: newClient.id, created: true };
}

async function getOrCreateDog(
  supabase: SupabaseClient,
  row: BulkImportRow,
  clientId: string
): Promise<{ dogId: string | null; created: boolean }> {
  const dogName = row.dog_name.trim();

  // Check existing
  const { data: existing } = await supabase
    .from("dogs")
    .select("id")
    .eq("client_id", clientId)
    .ilike("name", dogName)
    .maybeSingle();

  if (existing) {
    return { dogId: existing.id, created: false };
  }

  // Parse DOB if provided (handle blank values gracefully)
  let dateOfBirth: string | null = null;
  const dobValue = row.dog_dob?.trim();
  if (dobValue && dobValue.length > 0) {
    dateOfBirth = parseDateString(dobValue);
  }

  // Create new dog
  const { data: newDog, error } = await supabase
    .from("dogs")
    .insert({
      name: dogName,
      breed: row.breed.trim(),
      client_id: clientId,
      date_of_birth: dateOfBirth,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Dog creation error:", error);
    return { dogId: null, created: false };
  }

  return { dogId: newDog.id, created: true };
}

function parseDateString(dateStr: string): string | null {
  if (!dateStr) return null;

  // Try various formats
  const formats = [
    // DD-MMM-YY (e.g., 15-Mar-23)
    /^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/,
    // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{2})-(\d{2})$/,
  ];

  const monthMap: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  // Try DD-MMM-YY
  const match1 = dateStr.match(formats[0]);
  if (match1) {
    const day = parseInt(match1[1]);
    const month = monthMap[match1[2].toLowerCase()];
    let year = parseInt(match1[3]);
    year = year > 50 ? 1900 + year : 2000 + year;
    return new Date(year, month, day).toISOString().split("T")[0];
  }

  // Try DD/MM/YYYY
  const match2 = dateStr.match(formats[1]);
  if (match2) {
    const day = parseInt(match2[1]);
    const month = parseInt(match2[2]) - 1;
    const year = parseInt(match2[3]);
    return new Date(year, month, day).toISOString().split("T")[0];
  }

  // Try YYYY-MM-DD
  const match3 = dateStr.match(formats[2]);
  if (match3) {
    return dateStr;
  }

  // Fallback: try native parsing
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}

function getClassDate(schedule: any): Date {
  // Use first selected date, or start_time
  if (schedule.selected_dates && schedule.selected_dates.length > 0) {
    return new Date(schedule.selected_dates[0]);
  }
  return new Date(schedule.start_time);
}

async function createInvoiceForImport(
  supabase: SupabaseClient,
  clientId: string,
  bookingId: string,
  classDate: Date,
  className: string,
  courseFee: number,
  enrollmentFee: number,
  invoiceStatus?: string
): Promise<boolean> {
  try {
    // Generate invoice number using class date
    const invoiceNumber = await generateInvoiceNumber(classDate);

    // Calculate totals - include item_type for proper fee calculations
    const items: { description: string; amount: number; item_type: string }[] = [];
    
    if (courseFee > 0) {
      items.push({ description: `${className} - Course Fee`, amount: courseFee, item_type: 'course_fee' });
    }
    if (enrollmentFee > 0) {
      items.push({ description: `${className} - Enrollment Fee`, amount: enrollmentFee, item_type: 'enrollment_fee' });
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const dueDate = new Date(classDate); // Due date defaults to same as issued date

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        client_id: clientId,
        invoice_number: invoiceNumber,
        issued_date: classDate.toISOString(),
        due_date: dueDate.toISOString(),
        subtotal: subtotal,
        total: subtotal,
        status: invoiceStatus || "draft",
        discount_amount: 0,
        discount_type: "fixed",
        tax_rate: 0,
        tax_amount: 0,
      })
      .select("id")
      .single();

    if (invoiceError || !invoice) {
      console.error("Invoice creation error:", invoiceError);
      return false;
    }

    // Create invoice items with item_type for proper fee calculations
    for (const item of items) {
      await supabase.from("invoice_items").insert({
        invoice_id: invoice.id,
        booking_id: bookingId,
        description: item.description,
        quantity: 1,
        unit_price: item.amount,
        amount: item.amount,
        item_type: item.item_type,
      });
    }

    return true;
  } catch (error) {
    console.error("Invoice creation error:", error);
    return false;
  }
}
