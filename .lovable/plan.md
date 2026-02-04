

# Selective Class Statement Generation

## Overview

Add checkboxes to the trainer's expanded class list so that when "Generate Statement" is clicked, only the selected classes are included in the statement. This allows Adi to generate a January-only statement for Leanne (selecting just the 2 January classes) without including February classes.

---

## How It Will Work

```text
Current Flow:
  Click "Generate Statement" 
        ↓
  Statement shows ALL classes for the trainer

New Flow:
  Expand trainer row to see classes
        ↓
  Check/uncheck specific classes (e.g., only January)
        ↓
  Click "Generate Statement" 
        ↓
  Statement shows ONLY the selected classes
        ↓
  Totals recalculated based on selection
```

---

## User Experience

1. **When trainer row is expanded**: Each class row gets a checkbox on the left
2. **Default behavior**: All classes are selected by default (so existing workflow still works)
3. **Selection controls**: "Select All" / "Deselect All" buttons above the class list
4. **Visual feedback**: Show count of selected classes and calculated total
5. **Statement reflects selection**: Only checked classes appear in the statement PDF/preview

---

## Technical Implementation

### 1. Update ClassDetailsList Component

**File: `src/components/invoices/reports/class-details/ClassDetailsList.tsx`**

- Add checkboxes to each class row
- Add "Select All" / "Deselect All" controls
- Track selected class IDs via new props
- Show selection summary (count + total)

### 2. Update TrainerPaymentsRow Component

**File: `src/components/invoices/reports/TrainerPaymentsRow.tsx`**

- Maintain state for selected class IDs per trainer
- Initialize with all classes selected by default
- Pass selected IDs to ClassDetailsList
- Pass selected IDs when calling onGenerateStatement

### 3. Update TrainerPaymentsSummary Component

**File: `src/components/invoices/reports/TrainerPaymentsSummary.tsx`**

- Update openStatementDialog to accept selected schedule IDs
- Pass filtered class details to the statement dialog based on selection

### 4. Update TrainerStatementDialog Component

**File: `src/components/invoices/reports/TrainerStatementDialog.tsx`**

- Accept optional `selectedScheduleIds` prop
- Filter displayed classes based on selection
- Recalculate totals based on selected classes only

---

## Component Changes Summary

| Component | Change |
|-----------|--------|
| `ClassDetailsList` | Add checkboxes, selection controls, selection summary |
| `TrainerPaymentsRow` | Track selected classes state, pass to children |
| `TrainerPaymentsSummary` | Handle selected IDs in statement dialog flow |
| `TrainerStatementDialog` | Filter classes by selection, recalculate totals |
| `TrainerStatementHTMLPreview` | No changes (already receives filtered data) |
| `TrainerPaymentsTable` | Update callback signature to include selected IDs |

---

## Visual Design

When the trainer row is expanded, the classes section will look like:

```text
Classes (4)                          [✓ Select All] [Deselect All]

☑  15h00 Yoga January     17/01/2026    5 bookings    R 1 140,00  Unpaid  ⋯
☑  16h15 Yoga January     17/01/2026    7 bookings    R 1 620,00  Unpaid  ⋯
☐  Yoga 15h00 February    07/02/2026    6 bookings    R 1 320,00  Unpaid  ⋯
☐  Yoga 16h15 February    07/02/2026    6 bookings    R 1 440,00  Unpaid  ⋯

─────────────────────────────────────────────────────────────────────────
2 classes selected • Total: R 2 760,00
```

---

## Statement Behavior

- **Totals in statement**: Recalculated from selected classes only
- **Class list in statement**: Shows only selected classes
- **Outstanding amount**: Reflects selected unpaid classes
- **Already paid**: Reflects selected paid classes

---

## Files to Create/Modify

1. **`src/components/invoices/reports/class-details/ClassDetailsList.tsx`** - Add checkboxes and selection logic
2. **`src/components/invoices/reports/TrainerPaymentsRow.tsx`** - Manage selection state, update callback
3. **`src/components/invoices/reports/TrainerPaymentsTable.tsx`** - Update callback signature
4. **`src/components/invoices/reports/TrainerPaymentsSummary.tsx`** - Handle selection in statement flow
5. **`src/components/invoices/reports/TrainerStatementDialog.tsx`** - Filter and recalculate based on selection

---

## Edge Cases Handled

- No classes selected: Disable "Generate Statement" or show warning
- All classes selected: Behaves same as current (full statement)
- Mixed paid/unpaid selection: Totals correctly reflect each category
- Single class selected: Works correctly with proper totals

