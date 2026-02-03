

# Training Assistants Management System

## Overview

A complete system for managing volunteer training assistants at McKaynine, featuring:
- Dedicated assistant login portal
- Manual training session creation (set for entire term/year at once)
- Full visibility of all assistants and their availability
- Configurable time slots per branch

---

## Database Schema

### New Tables

#### `assistants` Table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users (nullable initially) |
| branch_id | uuid | FK to branches |
| first_name | text | Required |
| last_name | text | Optional |
| email | text | For contact/login |
| phone | text | Optional |
| is_active | boolean | Default true |
| notes | text | Admin notes about the assistant |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

#### `training_sessions` Table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| branch_id | uuid | FK to branches |
| session_date | date | The training day |
| term_id | uuid | Optional FK to terms |
| notes | text | Session-specific notes |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

#### `training_session_slots` Table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| training_session_id | uuid | FK to training_sessions |
| time_slot | text | e.g., "14:00", "15:00" |
| display_name | text | e.g., "2pm", "3pm" |
| sort_order | integer | For ordering slots |
| created_at | timestamptz | Auto |

#### `branch_time_slots` Table (for configurable defaults)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| branch_id | uuid | FK to branches |
| time_slot | text | e.g., "14:00" |
| display_name | text | e.g., "2pm" |
| sort_order | integer | For ordering |
| is_default | boolean | Whether to auto-add to new sessions |
| created_at | timestamptz | Auto |

#### `assistant_availability` Table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| assistant_id | uuid | FK to assistants |
| training_session_slot_id | uuid | FK to training_session_slots |
| status | text | 'available', 'unavailable', 'not_marked' |
| notes | text | e.g., "Away on holiday" |
| marked_by | uuid | Who set this (assistant or admin) |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### Role Addition

```sql
ALTER TYPE app_role ADD VALUE 'assistant';
```

---

## RLS Policies

| Table | Policy |
|-------|--------|
| `assistants` | Admins full access; Assistants read all in their branch |
| `training_sessions` | Admins full access; Assistants read their branch |
| `training_session_slots` | Admins full access; Assistants read their branch |
| `branch_time_slots` | Admins full access |
| `assistant_availability` | Admins full access; Assistants read all, update own |

---

## Admin Features

### 1. Assistants Management Page (`/assistants`)

- Table listing all assistants with:
  - Name, email, phone, branch, status
  - Actions: Edit, Deactivate, Create Login
- Add Assistant modal with branch selection
- Edit Assistant modal
- Bulk invite option (optional future enhancement)

### 2. Training Sessions Page (`/admin/training-sessions`)

**Session Creation Interface:**
- Date range picker to select multiple Saturdays at once
- Calendar view showing existing sessions
- Quick actions: "Add all Saturdays for Term 1", "Add all Saturdays for 2026"
- Branch selector

**Time Slot Configuration:**
- Per-branch default time slots (Settings section)
- When creating sessions, auto-apply branch defaults
- Ability to add/remove slots per session

### 3. Assistant Schedule Grid (`/admin/assistant-schedule`)

Visual grid matching the spreadsheet layout:

```text
+------------+------------------+------------------+------------------+
|            | 17th Jan         | 24th Jan         | 31st Jan         |
| Assistants | 2pm    | 3pm     | 2pm    | 3pm     | 2pm    | 3pm     |
+------------+--------+---------+--------+---------+--------+---------+
| Ady        |   ✓    |    ✓    |   ✓    |         |   ✓    |    ✓    |
| Katherine  |   -    |    -    |   -    |    -    |   -    |    -    |
| Anene      |   ✓    |    ✓    |   ✓    |    ✓    |        |         |
| Amy        |  N/A   |   N/A   |   ✓    |    ✓    |   ✓    |    ✓    |
| Lizzie     |   -    |    -    |   -    |    -    |   -    |    -    |
| Roxy       |   ✓    |         |   ✓    |    ✓    |   ✓    |    ✓    |
+------------+--------+---------+--------+---------+--------+---------+

Legend:
✓ = Available (green)
N/A = Unavailable (amber/highlighted)
- = Not marked (gray)
Empty = Not marked
Hover = Shows notes if any
```

Features:
- Filter by branch, term, date range
- Click cell to toggle/set availability (admin override)
- Add notes on hover/click
- Summary row showing total available per slot
- Print/export option

### 4. Time Slot Configuration (`/admin/settings` or `/admin/training-sessions/settings`)

- Configure default time slots per branch
- Add/edit/remove slots
- Set display names (e.g., "2pm" vs "14:00")
- Reorder slots

---

## Assistant Portal

### 1. Login Page (`/assistant-login`)

- Clean McKaynine branded login
- Email/password authentication
- "Forgot password" link
- After login, redirect to assistant schedule

### 2. Assistant Schedule (`/assistant/schedule`)

The main (and only) view for assistants - a simplified version of the admin grid:

**Features:**
- Shows all assistants and their availability (full visibility as requested)
- Highlight current user's row
- Click own cells to toggle availability
- Add notes to own availability
- Shows other assistants' notes (read-only)
- Mobile-friendly card view alternative

**Layout:**
```text
+----------------------------------------------------------+
|  McKaynine Training Schedule                    [Logout] |
+----------------------------------------------------------+
|  Term 1 2026 - Delta Park                                |
+----------------------------------------------------------+
|  Your upcoming sessions:                                 |
|  • Sat 17 Jan - 2pm ✓, 3pm ✓                            |
|  • Sat 24 Jan - 2pm ✓, 3pm (not marked)                 |
+----------------------------------------------------------+
|                                                          |
|  Full Schedule Grid (scrollable)                         |
|  [Same grid as admin but own row is editable]            |
|                                                          |
+----------------------------------------------------------+
```

### 3. Simple Profile Page (`/assistant/profile`) (Optional)

- Update contact details
- Change password
- View assigned branch

---

## Navigation Updates

### Admin Navigation
Add to `adminSecondaryNavItems`:
```typescript
{
  name: "Assistants",
  path: "/assistants",
  icon: Users
},
{
  name: "Training Sessions",
  path: "/admin/training-sessions",
  icon: Calendar
},
{
  name: "Assistant Schedule",
  path: "/admin/assistant-schedule",
  icon: ClipboardList
}
```

### Assistant Navigation
New `assistantNavItems`:
```typescript
export const assistantNavItems = [
  {
    name: "My Schedule",
    path: "/assistant/schedule",
    icon: Calendar
  }
];
```

---

## Auth Context Updates

Add to `useAuthState.ts`:
```typescript
const isAssistant = useMemo(() => {
  if (!role) return false;
  return role.split(',').includes('assistant');
}, [role]);
```

Update `AuthContext.tsx` and `AuthProvider.tsx` to export `isAssistant`.

---

## Edge Function Updates

### `manage-user-role`
Update to handle `assistant` role:
- When role is added, check for existing assistant record
- Link user_id to assistant record if email matches
- Create assistant record if needed

---

## File Summary

### New Files

| File | Purpose |
|------|---------|
| `src/pages/Assistants.tsx` | Admin assistant management |
| `src/pages/admin/TrainingSessions.tsx` | Admin session creation |
| `src/pages/admin/AssistantSchedule.tsx` | Admin schedule grid view |
| `src/pages/AssistantLogin.tsx` | Dedicated assistant login |
| `src/pages/assistant/AssistantSchedule.tsx` | Assistant's schedule view |
| `src/pages/assistant/AssistantProfile.tsx` | Assistant profile (optional) |
| `src/components/assistants/AssistantsTable.tsx` | Admin table component |
| `src/components/assistants/AddAssistantModal.tsx` | Add assistant modal |
| `src/components/assistants/EditAssistantModal.tsx` | Edit assistant modal |
| `src/components/assistants/schedule/ScheduleGrid.tsx` | Reusable schedule grid |
| `src/components/assistants/schedule/AvailabilityCell.tsx` | Grid cell component |
| `src/components/assistants/schedule/SessionCreator.tsx` | Bulk session creation |
| `src/components/assistants/schedule/TimeSlotConfig.tsx` | Time slot settings |
| `src/hooks/useAssistants.ts` | Assistant data operations |
| `src/hooks/useTrainingSessions.ts` | Session data operations |
| `src/hooks/useAssistantAvailability.ts` | Availability operations |
| `src/routes/assistantRoutes.tsx` | Assistant route definitions |

### Modified Files

| File | Change |
|------|--------|
| `src/router.tsx` | Add assistant routes |
| `src/context/auth/useAuthState.ts` | Add `isAssistant` |
| `src/context/auth/AuthContext.tsx` | Add `isAssistant` to context type |
| `src/context/auth/AuthProvider.tsx` | Export `isAssistant` |
| `src/context/auth/types.ts` | Add `isAssistant` to interface |
| `src/components/layout/header/navigation-items.ts` | Add assistant nav items |
| `src/components/layout/header/AdminNavigation.tsx` | Show assistant links |
| `src/routes/adminRoutes.tsx` | Add admin assistant routes |
| `supabase/functions/manage-user-role/index.ts` | Handle assistant role |

---

## Implementation Order

1. **Database migration** - Create all new tables and add role enum value
2. **Auth context updates** - Add `isAssistant` detection
3. **Admin pages** - Assistants management, Training Sessions, Schedule Grid
4. **Assistant portal** - Login page, Schedule view
5. **Edge function updates** - Handle assistant role in manage-user-role
6. **Routes and navigation** - Wire everything together
7. **Testing** - End-to-end verification

---

## Mobile Considerations

The assistant schedule will be mobile-responsive:
- Grid scrolls horizontally on small screens
- Alternative card view for mobile showing upcoming sessions
- Large touch targets for availability toggles
- Swipe gestures for date navigation

