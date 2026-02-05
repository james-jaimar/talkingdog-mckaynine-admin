
# Add Franchise Report Month Override to Classes

## Overview

Add the ability to manually override the franchise report month for a class. This allows admins to specify that a class (like "Puppy Feb" starting Jan 30th) should report in February instead of auto-calculating from the schedule start date.

## Solution Design

### Database Change

Add a new nullable column `report_month_override` to the `classes` table:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `report_month_override` | `text` | YES | Format: 'YYYY-MM' (e.g., '2026-02') |

When null, the system uses automatic calculation based on schedule dates. When set, all invoices for this class use this override.

---

## Implementation Steps

### 1. Database Migration

Add the new column to the `classes` table:

```sql
ALTER TABLE classes 
ADD COLUMN report_month_override text;

COMMENT ON COLUMN classes.report_month_override IS 
  'Optional override for franchise report month (format: YYYY-MM). When set, invoices for this class use this month instead of auto-calculating from schedule dates.';
```

### 2. Update TypeScript Types

**File: `src/components/classes/types/class.ts`**

Add to both `Class` and `ClassFromDB` interfaces:
```typescript
report_month_override?: string | null;
```

### 3. Update Form Schema

**File: `src/components/classes/schemas/classFormSchema.ts`**

Add optional field:
```typescript
report_month_override: z.string().nullable().optional(),
```

### 4. Update Edit Class Form

**File: `src/components/classes/EditClassForm.tsx`**

Add a dropdown field after the Branch selector with:
- Label: "Report Month Override"
- Options: "Auto (use schedule date)" + months (Jan-Dec) for current and next year
- Helper text explaining the purpose

### 5. Update Form Hook

**File: `src/components/classes/hooks/utils/form-defaults.ts`**

Include `report_month_override` in default values.

### 6. Update Class Submission

**File: `src/components/classes/hooks/utils/class-submission.ts`**

Include `report_month_override` in the class payload.

### 7. Update Invoice Creation

**File: `src/lib/invoices/createInvoiceUtils.ts`**

Accept optional `report_month_override` in `calculatedData` and use it instead of auto-calculating from `issued_date` when provided.

### 8. Pass Override to Invoice Creation

**File: `src/components/classes/handlers/hooks/add-handler-modal/createInvoiceForHandler.ts`**

Accept `classReportMonthOverride` prop and pass it to invoice creation.

---

## UI Design

The dropdown in Edit Class form will show:

```text
Report Month Override
[Dropdown: Auto (use schedule date) ▼]

Options:
- Auto (use schedule date)
- January 2026
- February 2026
- March 2026
... (next 12 months)
```

---

## Data Flow

```text
Class Edit Form
      ↓
[report_month_override saved to classes table]
      ↓
Add Handler to Class
      ↓
createInvoiceForHandler receives class data including override
      ↓
createInvoice uses override (if set) or auto-calculates
      ↓
Invoice saved with correct franchise_report_month
```

---

## Files to Modify

| File | Change |
|------|--------|
| **Database Migration** | Add `report_month_override` column |
| `src/components/classes/types/class.ts` | Add field to interfaces |
| `src/integrations/supabase/types.ts` | Will auto-regenerate |
| `src/components/classes/schemas/classFormSchema.ts` | Add schema field |
| `src/components/classes/EditClassForm.tsx` | Add dropdown UI |
| `src/components/classes/hooks/utils/form-defaults.ts` | Include in defaults |
| `src/components/classes/hooks/utils/class-submission.ts` | Include in payload |
| `src/lib/invoices/createInvoiceUtils.ts` | Use override when provided |
| `src/components/classes/handlers/hooks/add-handler-modal/createInvoiceForHandler.ts` | Pass override to invoice creation |

---

## Immediate Fix for Puppy Feb Class

After implementation, you'll be able to:
1. Go to Classes > Puppy Feb
2. Click Edit
3. Set "Report Month Override" to "February 2026"
4. Save

All new invoices for this class will then use February as the franchise report month.

For existing invoices (Christine, Dominique, Alex), you can bulk-update them in the Invoices table using the existing period reassignment feature, or run:

```sql
UPDATE invoices 
SET franchise_report_month = '2026-02'
WHERE id IN (
  SELECT i.id FROM invoices i
  JOIN invoice_items ii ON ii.invoice_id = i.id
  JOIN bookings b ON b.id = ii.booking_id
  JOIN class_schedules cs ON cs.id = b.class_schedule_id
  JOIN classes c ON c.id = cs.class_id
  WHERE c.name LIKE '%Puppy Feb%'
);
```
