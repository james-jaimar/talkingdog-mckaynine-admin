

## Copy Email Template to Another Branch

### What
Add a "Copy to Branch" button on each email template card that opens a dialog letting Ady select a target branch, then duplicates the template to that branch.

### How

**1. Add `copyToBranch` mutation to `useEmailTemplates` hook**
- New mutation that takes a template ID and target branch ID
- Fetches the source template, inserts a copy with the new `branch_id` and a unique `type` suffix
- Shows success toast with the target branch name

**2. Add a "Copy to Branch" dialog component** (`src/components/email-templates/CopyTemplateToBranchDialog.tsx`)
- Simple dialog with a branch selector dropdown (using `useBranchOptions` from `branch-fetcher.ts`)
- Filters out the current branch from the list
- Confirm button triggers the copy mutation

**3. Update `EmailTemplates.tsx` page**
- Add a `Copy` icon button (lucide `Copy` icon) to each template card's footer actions
- Clicking opens the `CopyTemplateToBranchDialog` with the selected template
- On success, show toast confirming the copy

### Files to modify
- `src/hooks/useEmailTemplates.ts` — add `copyToBranch` mutation
- `src/components/email-templates/CopyTemplateToBranchDialog.tsx` — new component
- `src/pages/admin/EmailTemplates.tsx` — add copy button + dialog state

