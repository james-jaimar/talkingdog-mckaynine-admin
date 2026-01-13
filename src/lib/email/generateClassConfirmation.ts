import { supabase } from "@/integrations/supabase/client";
import { CLASS_CONFIRMATION_TEMPLATE, CLASS_CONFIRMATION_SUBJECT } from "./templates/class-confirmation-template";
import { formatClassDates, formatClassDayTime } from "./utils/formatClassDates";
import { renderTemplate, getVariablesWithSignature, TemplateVariables } from "./template-renderer";

/**
 * Fetches the class confirmation email template from the database
 * Falls back to hardcoded template if not found
 */
async function getClassConfirmationTemplate(branchId: string): Promise<{ template: string; subject: string }> {
  // First try branch_email_templates (branch-specific)
  const { data: branchTemplate } = await supabase
    .from("branch_email_templates")
    .select("content, subject")
    .eq("branch_id", branchId)
    .eq("type", "class_confirmation")
    .eq("is_active", true)
    .maybeSingle();

  if (branchTemplate?.content) {
    console.log("Using branch email template for class confirmation");
    return {
      template: branchTemplate.content,
      subject: branchTemplate.subject || CLASS_CONFIRMATION_SUBJECT,
    };
  }

  // Fallback to hardcoded template
  console.log("Using hardcoded class confirmation template (no branch template found)");
  return {
    template: CLASS_CONFIRMATION_TEMPLATE,
    subject: CLASS_CONFIRMATION_SUBJECT,
  };
}

interface ClassEnrollmentDetails {
  dogName: string;
  className: string;
  classType: string;
  dates: string;
  dayTime: string;
}

interface ConfirmationEmailData {
  to_email: string;
  subject: string;
  html_content: string;
  handler_id: string;
  branch_id: string;
}

/**
 * Generates a class confirmation email for a paid invoice
 * Returns null if the invoice has no bookings or handler has no email
 */
export async function generateClassConfirmationEmail(
  invoiceId: string
): Promise<ConfirmationEmailData | null> {
  try {
    // Fetch invoice with all related booking and class data
    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        id,
        client_id,
        clients!inner (
          id,
          first_name,
          last_name,
          email,
          branch_id
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoiceData) {
      console.warn("Could not fetch invoice for confirmation email:", invoiceError);
      return null;
    }

    const client = invoiceData.clients as any;
    
    if (!client?.email) {
      console.warn("No email address for client:", client?.id);
      return null;
    }

    // Fetch invoice items with booking details
    const { data: itemsData, error: itemsError } = await supabase
      .from("invoice_items")
      .select(`
        id,
        booking_id,
        bookings (
          id,
          dog_id,
          class_schedule_id,
          dogs (
            id,
            name
          ),
          class_schedules (
            id,
            start_time,
            selected_dates,
            classes (
              id,
              name,
              class_type
            )
          )
        )
      `)
      .eq("invoice_id", invoiceId);

    if (itemsError) {
      console.warn("Could not fetch invoice items:", itemsError);
      return null;
    }

    // Filter to only items with bookings and deduplicate by booking_id
    // (An invoice may have multiple items for the same booking, e.g., enrollment fee + course fee)
    const allBookingItems = (itemsData || []).filter(item => item.booking_id && item.bookings);
    const seenBookingIds = new Set<string>();
    const bookingItems = allBookingItems.filter(item => {
      if (seenBookingIds.has(item.booking_id!)) {
        return false;
      }
      seenBookingIds.add(item.booking_id!);
      return true;
    });

    if (bookingItems.length === 0) {
      console.log("No bookings on invoice - skipping confirmation email");
      return null;
    }

    // Extract class enrollment details
    const enrollments: ClassEnrollmentDetails[] = bookingItems.map(item => {
      const booking = item.bookings as any;
      const dog = booking?.dogs;
      const schedule = booking?.class_schedules;
      const classInfo = schedule?.classes;

      return {
        dogName: dog?.name || "Your dog",
        className: classInfo?.name || "Class",
        classType: classInfo?.class_type || "",
        dates: formatClassDates(schedule?.selected_dates),
        dayTime: formatClassDayTime(schedule?.start_time),
      };
    });

    // Get branch name for signature
    const { data: branchData } = await supabase
      .from("branches")
      .select("name")
      .eq("id", client.branch_id)
      .single();

    // Build class details HTML
    const classDetailsHtml = buildClassDetailsHtml(enrollments);

    // Build template variables
    const handlerName = `${client.first_name} ${client.last_name}`.trim() || "Valued Client";
    const primaryClassName = enrollments[0]?.className || "Class";

    const variables: TemplateVariables = {
      handler_name: handlerName,
      class_details: classDetailsHtml,
      branch_name: branchData?.name || "McKaynine",
    };

    // Fetch the template from database (or fallback to hardcoded)
    const { template, subject: templateSubject } = await getClassConfirmationTemplate(client.branch_id);

    // Render template with signature
    const variablesWithSignature = getVariablesWithSignature(variables);
    const htmlContent = renderTemplate(template, variablesWithSignature);
    const subject = renderTemplate(templateSubject, { class_name: primaryClassName });

    return {
      to_email: client.email,
      subject,
      html_content: htmlContent,
      handler_id: client.id,
      branch_id: client.branch_id,
    };
  } catch (error) {
    console.error("Error generating class confirmation email:", error);
    return null;
  }
}

/**
 * Builds HTML for class details section
 * Handles single or multiple dog/class enrollments
 */
function buildClassDetailsHtml(enrollments: ClassEnrollmentDetails[]): string {
  // Build the class details content with its own green box styling
  // This ensures proper display even if the template's wrapper div is stripped by the editor
  
  if (enrollments.length === 1) {
    const e = enrollments[0];
    return `
      <div style="background-color: #e8f4e9; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #2c5530;">
        <h2 style="margin: 0 0 16px; color: #2c5530; font-size: 18px; font-weight: 600;">📋 Class Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #333; font-size: 14px;"><strong>Dog:</strong></td>
            <td style="padding: 8px 0; color: #333; font-size: 14px;">${e.dogName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #333; font-size: 14px;"><strong>Class:</strong></td>
            <td style="padding: 8px 0; color: #333; font-size: 14px;">${e.className}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #333; font-size: 14px;"><strong>Dates:</strong></td>
            <td style="padding: 8px 0; color: #333; font-size: 14px;">${e.dates}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #333; font-size: 14px;"><strong>Day & Time:</strong></td>
            <td style="padding: 8px 0; color: #333; font-size: 14px;">${e.dayTime}</td>
          </tr>
        </table>
      </div>
    `;
  }

  // Multiple enrollments - list each dog and class
  const enrollmentRows = enrollments.map(e => `
    <div style="background-color: #ffffff; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #2c5530;">🐕 ${e.dogName}</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; color: #555; font-size: 13px;"><strong>Class:</strong></td>
          <td style="padding: 4px 0; color: #555; font-size: 13px;">${e.className}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #555; font-size: 13px;"><strong>Dates:</strong></td>
          <td style="padding: 4px 0; color: #555; font-size: 13px;">${e.dates}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #555; font-size: 13px;"><strong>Day & Time:</strong></td>
          <td style="padding: 4px 0; color: #555; font-size: 13px;">${e.dayTime}</td>
        </tr>
      </table>
    </div>
  `).join("");

  return `
    <div style="background-color: #e8f4e9; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #2c5530;">
      <h2 style="margin: 0 0 16px; color: #2c5530; font-size: 18px; font-weight: 600;">📋 Class Details</h2>
      <p style="margin: 0 0 12px; color: #333; font-size: 14px;">Your dogs are enrolled in the following classes:</p>
      ${enrollmentRows}
    </div>
  `;
}
