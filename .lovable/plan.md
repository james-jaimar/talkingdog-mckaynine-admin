

# Remove Enrollment Fees from Franchise Report

## Overview

Since starter kits are now pre-bought and allocated from stock, enrollment fees no longer belong in the franchise report. The report will be simplified to show only **Course Fees** and **Franchise Fees** (15% of course fees), with **Total Due = Franchise Fees only**.

## What Changes

### Summary Cards (top of report)
- **Before**: Course Fees | Enrollment Fees | Franchise Fees | Total Due (Enrollment + Franchise)
- **After**: Course Fees | Franchise Fees | Total Due (= Franchise Fees only)
- Goes from 4 cards to 3 cards

### Handler Table (per class)
- Remove the "Enrollment Fee" column
- "Total" column now equals the Franchise Fee (no enrollment component)

### Class Footer Totals
- Remove "Enrollment Fees: R X" line

### PDF Report
- Same changes mirrored in the PDF generator (summary cards, table columns, footer totals)

## Technical Details

### Files to modify

1. **`src/components/invoices/reports/FranchiseClassesReport.tsx`**
   - Remove the Enrollment Fees summary card (cyan card)
   - Update Total Due subtitle from "Enrollment + Franchise" to just "Franchise Fees"
   - Remove Enrollment Fee column from handler table
   - Remove Enrollment Fees from class footer totals

2. **`src/hooks/useFranchiseMonthlyData.ts`**
   - Update `totalAmount` calculation: change from `enrollmentFeeAmount + franchiseFee` to just `franchiseFee`
   - Keep `enrollmentFeeAmount` in the data model (no harm, just not used in totals)
   - Update `reportTotals.totalAmount` to exclude enrollment fees

3. **`src/components/invoices/reports/pdf/FranchiseReportPDFGenerator.ts`**
   - Remove Enrollment Fees summary card (go from 4 to 3 cards)
   - Remove Enrollment Fee column from class tables
   - Remove Enrollment Fees from class footer totals
   - Update Total Due subtitle

4. **`src/hooks/useFranchiseClassesData.ts`** (term-based version)
   - Same totalAmount calculation change for consistency

5. **`src/hooks/useFranchiseMonthlyData.ts`** (payment mutation)
   - Keep sending `totalEnrollmentFees` to the `franchise_payments` table for record-keeping (no schema change needed), but `totalDue` will now exclude enrollment fees

