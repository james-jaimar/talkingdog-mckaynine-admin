

# Navigation Cleanup: Consolidating Pages into Tabbed Interfaces

## Summary

This plan consolidates the crowded header navigation by grouping related pages into tabbed interfaces, similar to the existing Financial Reports pattern. This will significantly reduce the number of navigation items while keeping all functionality easily accessible.

## Current State

The header currently shows too many navigation links across two rows:

**Primary Row:** Dashboard, Classes, Handlers, Invoices, Email, Trainer Notes
**Secondary Row:** Financial Dashboard, Financial Reports, Users, Branches, Trainers, Unpaid Handlers, Intake Scans, Tasks, Email Templates, Assistants, Training Sessions, Assistant Schedule

## Changes Overview

| Change | Before | After |
|--------|--------|-------|
| Dashboard link | Separate nav item | Click logo to navigate |
| Financial Dashboard + Unpaid Handlers | 2 separate nav items | Tabs in `/financial-reports` |
| Email + Email Templates | 2 separate nav items | Tabs in `/admin/email` |
| Users, Branches, Trainers, Intake Scans | 4 separate nav items | Tabs in new `/admin` page |
| Assistants, Training Sessions, Assistant Schedule | 3 separate nav items | Tabs in `/assistants` |

## Result

**Primary Row:** Classes, Handlers, Invoices, Email, Trainer Notes
**Secondary Row:** Financial, Admin, Assistants, Tasks

This reduces the secondary row from 12+ items to just 4 items.

---

## Technical Implementation

### 1. Remove Dashboard from Navigation

**File:** `src/components/layout/header/navigation-items.ts`

- Remove the Dashboard entry from `adminPrimaryNavItems`
- The logo already links to dashboard (for admins: `/dashboard`, for handlers: `/customer/dashboard`)

### 2. Consolidate Financial Pages (`/financial-reports`)

**File:** `src/pages/FinancialReports.tsx`

Current tabs: Financial Report, Classes List, Franchise Report, Trainers, Starter Kits

New tabs: **Financial Dashboard** (new first tab), Financial Report, Classes List, Franchise Report, Trainers, Starter Kits, **Unpaid Handlers** (new last tab)

Changes:
- Import the content from `FinancialDashboard.tsx` as a component
- Import the content from `UnpaidHandlers.tsx` as a component
- Add two new TabsTrigger/TabsContent sections
- Update navigation to remove Financial Dashboard and Unpaid Handlers as separate links
- Keep the main nav link as just "Financial" pointing to `/financial-reports`

### 3. Consolidate Email Pages (`/admin/email`)

**File:** `src/pages/admin/Email.tsx`

Current tabs: Outbox, Sent

New tabs: **Email Queue** (Outbox + Sent remain subtabs or inline), **Templates** (new tab)

Changes:
- Wrap existing Email functionality as the first tab
- Import Email Templates content as a component
- Add Templates as a second tab
- Update navigation to remove Email Templates as a separate link
- Keep the nav link as "Email" pointing to `/admin/email`

### 4. Create New Admin Hub Page (`/admin`)

**New file:** `src/pages/admin/AdminHub.tsx`

This new page consolidates administrative functions:

Tabs:
- **Users** - Content from `UserAdmin.tsx`
- **Branches** - Content from `Branches.tsx`
- **Trainers** - Content from `Trainers.tsx`
- **Intake Scans** - Content from `IntakeScans.tsx`

Changes:
- Create new AdminHub page with 4 tabs
- Extract existing page content into reusable components where needed
- Add new route `/admin` to router
- Update navigation to point to `/admin` with label "Admin"

### 5. Consolidate Assistants Pages (`/assistants`)

**File:** `src/pages/Assistants.tsx`

Current: Just the assistants list

New tabs:
- **Assistants** - Current content (list of training assistants)
- **Sessions** - Content from `TrainingSessions.tsx`
- **Schedule** - Content from `AssistantSchedule.tsx` (admin version)

Changes:
- Add Tabs wrapper around existing content
- Import Training Sessions and Assistant Schedule as tab content
- Update navigation to remove the separate links

### 6. Update Navigation Items

**File:** `src/components/layout/header/navigation-items.ts`

Remove from `adminPrimaryNavItems`:
- Dashboard (logo serves this purpose)

Update `adminSecondaryNavItems` to only include:
- Financial (path: `/financial-reports`)
- Admin (path: `/admin`)
- Assistants (path: `/assistants`)
- Tasks (path: `/admin/tasks`)

Remove from `adminSecondaryNavItems`:
- Financial Dashboard
- Users
- Branches
- Trainers
- Unpaid Handlers
- Intake Scans
- Email Templates
- Training Sessions
- Assistant Schedule

### 7. Update Router

**File:** `src/router.tsx`

Changes:
- Add new `/admin` route pointing to AdminHub
- Keep existing routes as aliases for deep linking (optional - can be removed later)

---

## File Changes Summary

| File | Action |
|------|--------|
| `src/components/layout/header/navigation-items.ts` | Modify - simplify navigation |
| `src/pages/FinancialReports.tsx` | Modify - add Financial Dashboard and Unpaid Handlers tabs |
| `src/pages/admin/Email.tsx` | Modify - add Email Templates tab |
| `src/pages/admin/AdminHub.tsx` | Create - new consolidated admin page |
| `src/pages/Assistants.tsx` | Modify - add Sessions and Schedule tabs |
| `src/router.tsx` | Modify - add `/admin` route |

---

## Component Extraction (Reusability)

To avoid duplicating code, the existing page content will be extracted into reusable components:

| Current Page | New Component |
|--------------|---------------|
| `FinancialDashboard.tsx` | `src/components/financial/FinancialDashboardContent.tsx` |
| `UnpaidHandlers.tsx` | `src/components/handlers/UnpaidHandlersContent.tsx` |
| `EmailTemplates.tsx` | Existing structure works (already self-contained) |
| `UserAdmin.tsx` | Uses `UserAdminPanel` component (already good) |
| `Branches.tsx` | Uses `BranchesTable` and `AddBranchModal` (already good) |
| `Trainers.tsx` | Uses `TrainersTable` and `AddTrainerModal` (already good) |
| `IntakeScans.tsx` | Uses `UploadPanel`, `ReviewPanel`, `StatusPanel` (already good) |
| `TrainingSessions.tsx` | `src/components/assistants/TrainingSessionsContent.tsx` |
| `AssistantSchedule.tsx` | `src/components/assistants/AssistantScheduleContent.tsx` |

---

## Benefits

1. **Cleaner Navigation** - From 12+ items to 4-5 items in secondary row
2. **Logical Grouping** - Related functionality is co-located
3. **Familiar Pattern** - Uses the same tabs UI already established in Financial Reports
4. **Preserves Functionality** - All features remain accessible
5. **Better Mobile UX** - Fewer scrolling required in the header

