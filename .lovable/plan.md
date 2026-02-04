

# Fix Trainer Email & Add Email Statement Feature

## Issues to Address

1. **Bug Fix**: Trainer email shows "No email on file" despite email existing in database
2. **New Feature**: Add ability to email trainer statements via the email queue

---

## Bug Analysis: Missing Trainer Email

The trainer's email is correctly fetched from the database and stored as `trainerEmail` in the `TrainerPaymentData` type, but it gets lost in the data transformation:

**Location**: `src/components/invoices/reports/TrainerReportsTab.tsx` (lines 116-130)

```typescript
// Current code - missing trainerEmail!
const formattedTrainers = trainersData.map(trainer => ({
  id: trainer.id,
  trainerName: trainer.trainerName,
  // trainerEmail: trainer.trainerEmail   <-- MISSING!
  totalEarned: trainer.totalEarned,
  ...
}));
```

Additionally, in `TrainerStatementDialog.tsx`, the interface uses `email` but should use `trainerEmail` for consistency.

---

## Fix: Email Bug

### Files to Modify

| File | Change |
|------|--------|
| `TrainerReportsTab.tsx` | Add `trainerEmail` to formatted trainer object |
| `TrainerPaymentsSummary.tsx` | Update interface to include `trainerEmail` |
| `TrainerPaymentsTable.tsx` | Update interface to include `trainerEmail` |
| `TrainerPaymentsRow.tsx` | Update interface to include `trainerEmail` |
| `TrainerStatementDialog.tsx` | Change `email` to `trainerEmail` in interface and usage |

---

## New Feature: Email Statement to Trainer

### User Flow

```text
1. Select classes for statement
         |
         v
2. Click "Generate Statement" 
         |
         v
3. Statement dialog opens with preview
         |
         v
4. Click "Email Statement" button (new)
         |
         v
5. Email composition modal opens
   - Pre-filled with trainer's email
   - Beautiful email template with statement summary
   - PDF attached automatically
   - Editable subject and body
         |
         v
6. Click "Queue Email"
         |
         v
7. Email added to queue for admin review
```

### Implementation Details

#### 1. Create Email Template for Trainer Statements

**File**: `src/lib/email/generateTrainerStatementEmail.ts`

- Professional email template similar to invoice emails
- Include statement summary (period, total, outstanding)
- Uses existing template renderer and email wrapper
- Signature based on branch

#### 2. Create Email Composition Dialog

**File**: `src/components/invoices/reports/TrainerStatementEmailDialog.tsx`

- Modal for composing/previewing the email
- Pre-filled subject line with trainer name and term
- HTML content preview
- PDF attachment indicator
- "Queue Email" button that adds to email_queue

#### 3. Update Statement Dialog

**File**: `src/components/invoices/reports/TrainerStatementDialog.tsx`

- Add "Email Statement" button next to "Download PDF"
- Opens the email composition dialog
- Passes all necessary data (trainer info, PDF, statement details)

---

## Email Template Design

The email will follow the same professional styling as invoice emails:

```text
[McKaynine Logo]

Hi Leanne,

Please find attached your commission statement for Term 1, 2026.

Statement Summary
-----------------
Period: 01 Jan 2026 - 31 Jan 2026
Total Commission: R 2,760.00
Already Paid: R 0.00
Outstanding: R 2,760.00

Classes Included: 2
- 15h00 Yoga January (17/01/2026)
- 16h15 Yoga January (17/01/2026)

Please review and let us know if you have any questions.

[Signature]
[Banking Details]
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/email/generateTrainerStatementEmail.ts` | Create | Email template generator |
| `src/components/invoices/reports/TrainerStatementEmailDialog.tsx` | Create | Email composition dialog |
| `src/components/invoices/reports/TrainerReportsTab.tsx` | Modify | Fix missing trainerEmail |
| `src/components/invoices/reports/TrainerPaymentsSummary.tsx` | Modify | Add trainerEmail to interface |
| `src/components/invoices/reports/TrainerPaymentsTable.tsx` | Modify | Add trainerEmail to interface |
| `src/components/invoices/reports/TrainerPaymentsRow.tsx` | Modify | Add trainerEmail to interface |
| `src/components/invoices/reports/TrainerStatementDialog.tsx` | Modify | Fix email field, add Email button |

---

## Email Queue Integration

Uses existing `email_queue` table structure:
- `to_email`: Trainer's email address
- `subject`: "Commission Statement - [Trainer Name] - [Term]"
- `html_content`: Rendered email template
- `attachments`: PDF statement as base64
- `branch_id`: Current branch for routing

---

## Edge Cases

- **Trainer has no email**: Show tooltip/message when trying to email
- **No classes selected**: "Email Statement" button disabled
- **PDF generation fails**: Show error, prevent email queue

