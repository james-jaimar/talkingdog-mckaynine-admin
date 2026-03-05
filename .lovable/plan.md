

## Email Signatures CRUD System

### What
Add a "Signatures" tab to the Email page (`/admin/email`) with full CRUD for managing email signatures per branch. Replace the current hardcoded signatures in `email-wrapper.ts` with database-driven signatures.

### Database

**New table: `branch_email_signatures`**
- `id` (uuid, PK)
- `branch_id` (uuid, FK → branches, not null)
- `name` (text) — signer's name (e.g. "Ady Hawkins")
- `title` (text) — role/branch title (e.g. "McKaynine - Delta")
- `phone` (text)
- `company` (text, nullable) — optional company line
- `email` (text) — contact email
- `website` (text) — website URL
- `is_default` (boolean, default false) — the default signature for this branch
- `created_at` / `updated_at` (timestamptz)
- Unique constraint on `(branch_id, is_default)` where `is_default = true` (or handled in app logic)
- RLS: authenticated users with admin role can CRUD

### Files to Create

1. **`src/hooks/useEmailSignatures.ts`** — React Query hook with:
   - `useEmailSignatures()` — fetch all signatures for current branch
   - `createSignature` mutation
   - `updateSignature` mutation
   - `deleteSignature` mutation
   - `setDefault` mutation (unsets previous default, sets new one)

2. **`src/components/email-signatures/SignatureEditorModal.tsx`** — Dialog with form fields for all signature properties (name, title, phone, company, email, website). Used for both create and edit.

3. **`src/components/email-signatures/SignaturePreview.tsx`** — Renders a preview of the signature HTML as it would appear in an email.

### Files to Modify

4. **`src/pages/admin/Email.tsx`**:
   - Add a third tab: `Signatures` (with `PenLine` icon from lucide)
   - New `EmailSignaturesTab` component inside the file (same pattern as `EmailTemplatesTab`)
   - Shows signature cards with name, title, email, default badge
   - Actions: Edit, Delete, Set as Default, Preview

5. **`src/lib/email/email-wrapper.ts`**:
   - Keep `getEmailSignature()` and `BRANCH_SIGNATURES` as **fallbacks**
   - Add a new `getEmailSignatureFromDb()` async function that fetches the default signature for a branch from the database
   - Update `getEmailSignature()` to accept an optional `BranchSignature` override parameter so callers can pass the DB signature

6. **`src/lib/email/template-renderer.ts`** and sending modals:
   - Where `getEmailSignature(branchName)` is called, update to first try fetching from the DB, falling back to the hardcoded values

### UI Layout (Signatures Tab)

- Top-right: "+ New Signature" button
- Grid of signature cards, each showing:
  - Name (bold), Title, Phone, Email, Website
  - "Default" badge if `is_default`
  - Footer actions: Edit (pencil), Delete (trash), Set Default (star/check)
- Editor modal with form fields matching the `BranchSignature` interface
- Inline preview of the rendered HTML signature

### How Signatures Connect to Email Sending

Currently `getEmailSignature(branchName)` is called in:
- `wrapEmailContent()` (auto-appends signature)
- `getVariablesWithSignature()` (template variable `{{signature}}`)
- `SendQuickEmailModal` and `SendInfoPackModal`

The update will make these look up the branch's default signature from the DB first, with the hardcoded `BRANCH_SIGNATURES` as fallback if no DB record exists. This ensures zero disruption — existing emails keep working even before any signatures are saved to the DB.

### Migration Path
- Hardcoded signatures remain as fallbacks
- Once Ady saves signatures via the UI, those take priority
- No breaking changes to existing email sending flows

