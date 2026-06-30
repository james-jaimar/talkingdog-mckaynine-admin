## Goal

When Shannon's Google Form includes file-upload questions (e.g. vaccination certs), Google stores the files in her Drive and the form response contains a Drive URL per file. Since Ady already has share access to Shannon's Drive folder, we just need to **capture those URLs in the payload, store them, and show them as clickable links** in the Google Forms review tab. No download, no re-upload — Ady clicks through to Drive.

## Changes

### 1. Apps Script (Shannon's side) — `docs/google-forms-shannon-setup.md`
Update the script snippet so file-upload answers are serialised as Drive URLs (Forms returns file IDs by default). For each `FILE_UPLOAD` item response, emit either a single URL or an array of URLs:
```
https://drive.google.com/file/d/{fileId}/view
```
Stored under the question title key in `answers`, same shape as other answers — so no schema change is needed.

### 2. Edge function — `supabase/functions/google-form-intake/index.ts`
No structural change. Drive URLs flow through into `raw_payload.answers` as-is. Optionally add a small helper that scans all answer values and extracts any `drive.google.com` URLs into a top-level `attachments: string[]` on the stored row for easy display (purely additive, no DB migration if we put it inside `raw_payload`; if we want a dedicated column, see "Technical" below).

### 3. Mapper — `src/lib/google-form/toExtractedData.ts`
Add aliases for the upload questions (e.g. "vaccination certificate", "proof of vaccination", "upload") and collect any Drive URLs found into `notes_for_review` so they surface in the review UI even before any custom rendering. Keeps existing handler-creation pipeline unchanged.

### 4. Review tab — `src/components/google-forms/GoogleFormsReviewTab.tsx` and `src/pages/admin/GoogleFormLog.tsx`
- In the submission detail dialog (`GoogleFormLog`), render any `drive.google.com` URLs found in `raw_payload` as a dedicated **"Drive attachments"** section with clickable links (`target="_blank" rel="noopener"`).
- In `GoogleFormsReviewTab`, show the same list above the review panel so the admin can open the certs in Drive while reviewing, then approve into a handler.

### 5. Setup guide — `docs/google-forms-shannon-setup.md`
Add a short Part covering:
- How to add a "File upload" question to the form (requires respondents to be signed in to Google — note for Shannon).
- That the destination Drive folder must already be shared with Ady (which it is).
- Confirm the script now forwards the Drive URLs automatically.

## Technical notes

- We do **not** store the files in Supabase, do **not** call the Drive API, and do **not** need the Google Drive connector. Auth is handled by Ady's existing share access in her browser.
- Storing URLs only inside `raw_payload` avoids any DB migration. If you'd prefer a dedicated `attachment_urls text[]` column on `google_form_submissions` for indexing/filtering, that's a one-line migration — say the word and I'll add it.
- Limitation reminder: Google Forms file-upload questions require respondents to sign in to a Google account. That's Shannon's call to accept on her form; nothing we can change.

## Out of scope

- Downloading/mirroring files into Supabase storage (Pattern 2 from the earlier discussion).
- Any automated processing of the certs.