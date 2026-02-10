
# Supporting Triple-Role Users (Handler + Assistant + Trainer)

## The Situation
Katherine Sinclaire is a handler (active client with invoice history), an assistant, AND occasionally fills in as a trainer. She needs all three roles to work simultaneously. The multi-role infrastructure we just built handles role storage and assignment, but the route guards and navigation don't yet support a user who is both "staff" and "handler."

## What Needs Fixing

### 1. Route Guards Use Exact Equality (Security Risk)
Both `RequireAuth.tsx` and `ProtectedRoute.tsx` use `role === 'handler'` to check if someone is a handler. For Katherine with role string `"handler,assistant,trainer"`, these checks silently fail -- meaning she could access staff routes even if she were *only* a handler. We fixed this in `publicRoutes.tsx` already but missed the guards.

**Files:** `src/components/auth/RequireAuth.tsx`, `src/components/auth/ProtectedRoute.tsx`
- Replace `role === 'handler'` and `role === 'user'` with `role?.includes()` checks
- For multi-role users (handler + staff role), treat them as staff -- they need access to both areas

### 2. Navigation Doesn't Show All Relevant Menus
The `Header.tsx` uses `if/else` logic: Admin navigation OR Trainer navigation OR Handler navigation. Katherine needs trainer navigation AND a way to access her customer portal (invoices, classes).

**File:** `src/components/layout/Header.tsx`
- For users who are both trainer/assistant AND handler, add a "My Account" or "Customer Portal" link to the trainer navigation area so they can access `/customer/dashboard`

### 3. ProtectedRoute Handler Check for Multi-Role
When Katherine is on a customer route like `/customer/invoices`, `ProtectedRoute` with `requiredRole: 'handler'` checks `role === 'handler'` which fails for her combined role string.

**File:** `src/components/auth/ProtectedRoute.tsx`
- Update the `hasRequiredRole` check at line 49 to use `role?.includes('handler')` instead of exact equality

## Implementation Details

| File | Change | Why |
|------|--------|-----|
| `RequireAuth.tsx` (line 43) | `role?.includes('handler')` but skip if user also has staff roles | Prevent handler-only redirect for multi-role users |
| `ProtectedRoute.tsx` (line 38) | Same includes check, skip for multi-role | Allow Katherine to access staff routes |
| `ProtectedRoute.tsx` (line 49) | `role?.includes('handler')` for handler role check | Let multi-role users access customer routes too |
| `ProtectedRoute.tsx` (line 55) | Use includes for redirect logic | Correct fallback redirects |
| `Header.tsx` (lines 83-89, 133-137, 165-171) | Add "My Account" link when user is both staff + handler | Give Katherine access to her customer dashboard |

## Key Design Decision
A user with both staff and handler roles is treated as **staff first** (gets trainer/assistant navigation) but with an additional "My Account" link to reach their customer portal. They are NOT locked to customer-only routes like a pure handler would be.

## What Stays the Same
- Role storage in `user_roles` table -- no changes needed
- The `manage-user-role` edge function -- already supports `addRole` for adding trainer to an existing assistant+handler
- Auth flags (`isTrainer`, `isHandler`, etc.) -- already use `.includes()` correctly
- Login redirect priority -- already fixed in previous implementation
