/**
 * Trainer Statement Email Generator
 * Generates professional email content for trainer commission statements
 */

import { format } from "date-fns";
import { wrapEmailContent, getEmailSignature } from "./email-wrapper";

interface ClassDetail {
  className: string;
  classDate: string;
  bookingsCount: number;
  commissionAmount: number;
  paymentStatus: "paid" | "unpaid" | "partial";
}

interface TrainerStatementEmailParams {
  trainerName: string;
  trainerEmail: string;
  termInfo: string;
  dateRange: { from: Date; to: Date };
  totalCommission: number;
  totalPaid: number;
  outstanding: number;
  classes: ClassDetail[];
  branchName?: string;
}

/**
 * Format currency as South African Rand
 */
function formatCurrency(amount: number): string {
  return `R ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/**
 * Generate email subject for trainer statement
 */
export function generateTrainerStatementEmailSubject(
  trainerName: string,
  termInfo: string
): string {
  return `Commission Statement - ${trainerName} - ${termInfo}`;
}

/**
 * Generate the email HTML content for trainer statement
 */
export function generateTrainerStatementEmailHtml(
  params: TrainerStatementEmailParams
): string {
  const {
    trainerName,
    termInfo,
    dateRange,
    totalCommission,
    totalPaid,
    outstanding,
    classes,
    branchName = "delta",
  } = params;

  const firstName = trainerName.split(" ")[0];
  const periodFrom = format(dateRange.from, "d MMMM yyyy");
  const periodTo = format(dateRange.to, "d MMMM yyyy");

  // Build class list HTML
  const classListHtml = classes
    .map(
      (cls) => `
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${cls.className}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: center;">${cls.classDate}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: center;">${cls.bookingsCount}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(cls.commissionAmount)}</td>
      </tr>
    `
    )
    .join("");

  const content = `
    <p>Hi ${firstName},</p>
    
    <p>Please find attached your commission statement for <strong>${termInfo}</strong>.</p>
    
    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px;">Statement Summary</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Statement Period:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${periodFrom} - ${periodTo}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Total Commission:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${formatCurrency(totalCommission)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Already Paid:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #22c55e;">${formatCurrency(totalPaid)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Outstanding:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #f97316;">${formatCurrency(outstanding)}</td>
        </tr>
      </table>
    </div>
    
    <h3 style="margin: 24px 0 12px 0; color: #1e293b; font-size: 15px;">Classes Included (${classes.length})</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <thead>
        <tr style="background-color: #f1f5f9;">
          <th style="padding: 10px 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600; color: #475569;">Class</th>
          <th style="padding: 10px 12px; text-align: center; border: 1px solid #e5e7eb; font-weight: 600; color: #475569;">Date</th>
          <th style="padding: 10px 12px; text-align: center; border: 1px solid #e5e7eb; font-weight: 600; color: #475569;">Bookings</th>
          <th style="padding: 10px 12px; text-align: right; border: 1px solid #e5e7eb; font-weight: 600; color: #475569;">Commission</th>
        </tr>
      </thead>
      <tbody>
        ${classListHtml}
      </tbody>
      <tfoot>
        <tr style="background-color: #f8fafc;">
          <td colspan="3" style="padding: 10px 12px; border: 1px solid #e5e7eb; font-weight: 600; text-align: right;">Total:</td>
          <td style="padding: 10px 12px; border: 1px solid #e5e7eb; font-weight: 600; text-align: right;">${formatCurrency(totalCommission)}</td>
        </tr>
      </tfoot>
    </table>
    
    <p style="margin-top: 24px;">Please review the attached statement and let us know if you have any questions.</p>
    
    <p>Kind regards,</p>
  `;

  // Wrap in professional email template with signature
  return wrapEmailContent(content, {
    branchName,
    includeBankingDetails: false,
  });
}
