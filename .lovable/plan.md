Mirror the intake-scans review flow for Google Form submissions, and share the underlying save logic between both pipelines.

## 1. Shared save helper

**New** `src/lib/enrollments/saveEnrollmentSubmission.ts`
- Pure async function `saveEnrollmentSubmission(extracted: ExtractedData): Promise<{ clientId, dogIds, enrollmentIds }>`
- Contains the client find-or-create, dog insert, and enrollment insert logic currently inline in `useSaveToDatabase`.
- Branch resolution: prefer matching by `dog.branch_name`, fall back to first active branch.
- Sets `onboarding_status: 'completed'` on the client (same as intake-scans today).

**Refactor** `src/components/intake-scans/hooks/useSaveToDatabase.ts`
- Replace its inline insert logic with a call to `saveEnrollmentSubmission(extractedData)`.
- Keep the post-save `scan_processing_jobs` status update (intake-scans-specific).
- Behaviour and toast text unchanged.

## 2. Google Form payload → ExtractedData mapper

**New** `src/lib/google-form/toExtractedData.ts`
- `googleFormPayloadToExtractedData(payload: { source, answers, submittedAt }) => ExtractedData`
- Ports the field aliasing + value normalisers (gender, spay/neuter, age bucket, social grid, ack grid, class type, heard-from, other-pets, training goal, health text) currently inside the edge function.
- Output matches the same shape ReviewPanel/saveEnrollmentSubmission expect.
- Branch name derived from `source` (e.g. "delta" → "Delta") so the existing branch matcher inside `saveEnrollmentSubmission` resolves it correctly.

## 3. Edge function: stop auto-ingesting

`supabase/functions/google-form-intake/index.ts`
- Keep secret verification, payload validation, duplicate check, and raw-payload logging.
- Remove the client/dog/enrollment inserts. Final status becomes `received` (or `duplicate`).
- This means brand-new submissions sit in the queue until an admin approves them.

## 4. Google Forms admin tab (review queue)

**New** `src/components/google-forms/GoogleFormsReviewTab.tsx` — two-pane layout, same proportions as intake-scans:
- **Left pane**: queue of submissions with status `received`, plus filter chips for `ingested` / `failed` / `rejected` / `duplicate`. Each row shows source (branch), submitter email, received-at.
- **Right pane**: review form. Reuses the field editors from `ReviewPanel` where practical (owner, dogs, class details, acknowledgements). Pre-filled from `googleFormPayloadToExtractedData`. No PDF viewer — instead a collapsible "Raw payload" panel for reference.
- Buttons:
  - **Approve & save handler** → calls `saveEnrollmentSubmission(editedData)`, then updates the `google_form_submissions` row to `status='ingested'` with `client_id`, `dog_ids`, `enrollment_ids`, then invalidates `handlers` queries and toasts.
  - **Reject** → sets `status='rejected'` with an optional admin note (stored in `error_message`).
  - **Replay** stays for `failed` rows (re-POSTs the raw payload to the edge function).
- Invalidates `google-form-submissions` after every mutation.

**Settings hub** `src/pages/admin/Settings.tsx`
- Add a new `<TabsTrigger value="google-forms">` next to "Intake Scans" with a `FileInput` icon.
- Add `<TabsContent value="google-forms">` rendering `<GoogleFormsReviewTab />`.

**Existing standalone page** `/admin/google-form-log`
- Keep the route working — repoint it to render `<GoogleFormsReviewTab />` wrapped in `DashboardLayout`, so deep links still work.

## 5. ReviewPanel reuse decision

`ReviewPanel.tsx` is tightly coupled to `ScanProcessingJob` (PDF viewer, confidence indicators, job-status branches). Rather than retro-fit it, the Google Forms tab will use the same shadcn primitives (Input/Select/Switch/Tabs) and import the dog-tab sub-section markup style by reading from the same `ExtractedData` shape. No changes to `ReviewPanel` itself.

## 6. No DB schema changes

`google_form_submissions.status` is free-text, so `rejected` is allowed without migration. Existing columns `client_id`, `dog_ids`, `enrollment_ids`, `error_message` are reused.

## 7. Behaviour summary after the change

- Shannon's form posts → row in queue with `status='received'`. Nothing else happens automatically.
- Admin opens Google Forms tab → sees the row, clicks it, reviews/edits pre-filled fields, clicks Approve.
- Approve runs the **same** save path intake-scans uses, so handlers/dogs/enrollments are created consistently and show up in the Handlers list immediately.
- Existing `ingested` rows from prior auto-ingest behaviour stay untouched.
