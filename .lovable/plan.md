
# Multi-Dog Household Linking with Invoice Rebalancing

## Overview
When two different handlers are part of the same household and both enroll dogs in the same term, the system will:
1. Link them as a household in the database
2. Automatically detect when the 2nd handler enrolls and apply the 25% multi-dog discount
3. **Rebalance both invoices to 50/50 split** so trainer commissions are fair

## The Problem You're Solving

**Current Scenario (Unfair):**
- Handler A (Sarah) enrolls first → Invoice: R1600 (full price) → Trainer 1 earns commission on R1600
- Handler B (Duncan) enrolls second → Invoice: R1200 (after 25% discount) → Trainer 2 earns commission on R1200

**New Scenario (Fair):**
- Handler A (Sarah) enrolls first → Invoice: R1600
- Handler B (Duncan) enrolls second → Discount detected
- **Both invoices rebalanced to R1400 each** (R2800 total ÷ 2)
- Trainer 1 earns commission on R1400, Trainer 2 earns commission on R1400

---

## Database Design

### New Table: `handler_households`

Stores bidirectional links between handlers in the same household.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| handler_id | uuid | First handler (FK to clients) |
| linked_handler_id | uuid | Second handler (FK to clients) |
| created_at | timestamptz | When link was created |
| created_by | uuid | Admin who created the link |

**Constraints:**
- Unique on (handler_id, linked_handler_id)
- Check: handler_id ≠ linked_handler_id (no self-linking)

---

## UI Components

### 1. Handler Detail Page - New "Household" Section

Location: Below "Branch Access" in HandlerInfo.tsx

```text
┌─────────────────────────────────────────────────┐
│ 🏠 Multi-Dog Household                          │
├─────────────────────────────────────────────────┤
│ ☐ Part of multi-handler household               │
│                                                 │
│ (When checked, shows linked handlers and       │
│  search button to add more)                    │
│                                                 │
│ Linked Handlers:                                │
│ ┌─────────────────────────────────────────────┐ │
│ │ Sarah Smith                       [Unlink]  │ │
│ │   2 dogs: Max, Bella                        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [+ Link Another Handler]                        │
│                                                 │
│ 💡 When household members enroll in the same   │
│    term, invoices are split 50/50.             │
└─────────────────────────────────────────────────┘
```

### 2. Link Handler Modal (Search)

```text
┌─────────────────────────────────────────────────┐
│ Link Handler to Household                   [X] │
├─────────────────────────────────────────────────┤
│ Search for a handler:                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🔍 Type name or email...                    │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Results:                                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ Duncan Richards                             │ │
│ │ duncan@example.com                          │ │
│ │ Dogs: Buddy, Cooper                [Select] │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## Backend Logic Changes

### Phase 1: Household Detection

When adding a handler to a class, expand the existing `checkExistingTermEnrollment.ts` to:

1. Query `handler_households` table for any linked handlers
2. Build a list of ALL household member IDs
3. Check if ANY household member has an existing enrollment in this term

```typescript
// Pseudo-code for household check
const householdIds = await getHouseholdMemberIds(handlerId);
// [handlerId, linkedHandler1, linkedHandler2, ...]

const existingEnrollment = await checkTermEnrollmentForAnyMember(householdIds, termId);
```

### Phase 2: Invoice Rebalancing (The Key Change)

When a household discount is triggered, we need to:

1. **Find the first handler's invoice** in this term
2. **Calculate combined total** of both invoices (before any discount)
3. **Apply 25% discount to the total** → New household total
4. **Split 50/50** between both invoices
5. **Update both invoices** with the new amounts

**Example Calculation:**
```text
Handler A original:     R1600 (course fee)
Handler B original:     R1600 (course fee)
Combined:               R3200

25% household discount: R800
New total:              R2400

Split 50/50:
- Handler A invoice:    R1200 (was R1600)
- Handler B invoice:    R1200
```

### New Function: `rebalanceHouseholdInvoices.ts`

```typescript
interface RebalanceResult {
  success: boolean;
  firstInvoiceNewTotal: number;
  secondInvoiceNewTotal: number;
  totalDiscount: number;
}

async function rebalanceHouseholdInvoices(
  firstInvoiceId: string,
  secondHandlerCourseFee: number,
  secondInvoiceId: string
): Promise<RebalanceResult> {
  // 1. Get first invoice's course fee items (excluding enrollment fees)
  // 2. Calculate combined course fees
  // 3. Apply 25% discount
  // 4. Split 50/50
  // 5. Update first invoice's course fee items proportionally
  // 6. Create second invoice with half the total
  // 7. Return the new amounts
}
```

---

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `src/components/handlers/detail/HouseholdSelector.tsx` | UI for managing household links |
| `src/components/handlers/detail/LinkHandlerModal.tsx` | Modal for searching/linking handlers |
| `src/hooks/useHouseholdLinks.ts` | Hook for CRUD on household links |
| `src/components/classes/handlers/hooks/add-handler-modal/checkHouseholdEnrollment.ts` | Check household members for term enrollments |
| `src/components/classes/handlers/hooks/add-handler-modal/rebalanceHouseholdInvoices.ts` | Logic to split invoices 50/50 |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/handlers/detail/HandlerInfo.tsx` | Add HouseholdSelector below MultiBranchSelector |
| `src/components/classes/handlers/hooks/add-handler-modal/addHandlerToClass.ts` | Integrate household check and rebalancing |
| `src/types/handler.ts` | Add household-related types |

---

## Database Migration

```sql
-- Create handler_households table
CREATE TABLE handler_households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handler_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  linked_handler_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  CONSTRAINT unique_household_pair UNIQUE (handler_id, linked_handler_id),
  CONSTRAINT no_self_link CHECK (handler_id != linked_handler_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_households_handler ON handler_households(handler_id);
CREATE INDEX idx_households_linked ON handler_households(linked_handler_id);

-- RLS
ALTER TABLE handler_households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage household links" ON handler_households
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'trainer', 'platform_admin')
    )
  );
```

---

## User Flow

### Setting Up a Household

1. Admin goes to Duncan's handler detail page
2. Checks "Part of multi-handler household"
3. Clicks "Link Another Handler"
4. Searches for "Sarah"
5. Selects Sarah → Both are now linked

### During Enrollment

1. Sarah's dog enrolled in Puppy Class Term 1 → Invoice: R1600
2. Duncan's dog enrolled in Bronze CGC Term 1
3. System detects: Duncan is linked to Sarah, Sarah has a dog in Term 1
4. System rebalances:
   - Sarah's invoice: R1600 → R1200
   - Duncan's invoice: R1200 (new)
5. Both trainers get commission on R1200

### Admin Notification

When rebalancing occurs, create a task:
```text
Title: Household invoice rebalance applied
Description: Duncan added to Bronze CGC. Sarah's invoice (INV-McD-2501-0123) 
reduced from R1600 to R1200. Duncan's invoice created at R1200.
Total household discount: R400 (25%).
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| 3+ handlers in household | Split equally among all (e.g., 3 handlers = 33.3% each) |
| Different class prices | Proportional split based on original prices |
| First invoice already paid | Create admin task for manual adjustment |
| First invoice already sent to IO | Update local amounts, create task for IO correction |
| Different branches | Discount only applies within same branch |
| Handler unlinked mid-term | No retroactive changes to existing invoices |

---

## Implementation Phases

### Phase 1: Database & Basic UI
- Create `handler_households` table
- Build HouseholdSelector component
- Build LinkHandlerModal with search
- Create useHouseholdLinks hook

### Phase 2: Discount Detection
- Update checkExistingTermEnrollment to check household members
- Return household info in the result

### Phase 3: Invoice Rebalancing
- Create rebalanceHouseholdInvoices function
- Update first invoice's amounts
- Create second invoice with 50% share
- Update addHandlerToClass to use rebalancing

### Phase 4: Notifications & Edge Cases
- Create admin tasks for rebalanced invoices
- Handle paid/sent invoice scenarios
- Add helpful toast messages
