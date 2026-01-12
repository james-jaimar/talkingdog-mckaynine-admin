import { supabase } from "@/integrations/supabase/client";
import { CLASS_CONFIRMATION_TEMPLATE, CLASS_CONFIRMATION_SUBJECT } from "./templates/class-confirmation-template";
import { formatClassDates, formatClassDayTime } from "./utils/formatClassDates";
import { renderTemplate, getVariablesWithSignature, TemplateVariables } from "./template-renderer";

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

    // Filter to only items with bookings
    const bookingItems = (itemsData || []).filter(item => item.booking_id && item.bookings);

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

    // Render template with signature
    const variablesWithSignature = getVariablesWithSignature(variables);
    const htmlContent = renderTemplate(CLASS_CONFIRMATION_TEMPLATE, variablesWithSignature);
    const subject = renderTemplate(CLASS_CONFIRMATION_SUBJECT, { class_name: primaryClassName });

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
  if (enrollments.length === 1) {
    const e = enrollments[0];
    return `
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
    <p style="margin: 0 0 12px; color: #333; font-size: 14px;">Your dogs are enrolled in the following classes:</p>
    ${enrollmentRows}
  `;
}
