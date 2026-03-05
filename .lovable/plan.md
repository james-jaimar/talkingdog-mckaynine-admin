

## Fix: Add Copy-to-Branch Button to the Email Page

### Problem
The Copy-to-Branch feature was added to `src/pages/admin/EmailTemplates.tsx` (route `/admin/email-templates`), but the user is on `/admin/email` which has its own duplicate `EmailTemplatesTab` component inside `src/pages/admin/Email.tsx` — and that component is missing the Copy button.

### Plan

**File: `src/pages/admin/Email.tsx`**

1. Add missing imports: `Copy` icon from lucide-react, `CopyTemplateToBranchDialog` component
2. Add `templateToCopy` state to the `EmailTemplatesTab` component
3. Add the Copy button between the Edit and Delete buttons in the template card footer (around line 193)
4. Render the `CopyTemplateToBranchDialog` alongside the other modals

This mirrors exactly what's already in `EmailTemplates.tsx` — just needs to be replicated in the `EmailTemplatesTab` component within `Email.tsx`.

