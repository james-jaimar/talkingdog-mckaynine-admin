## Goal

Stand up the receiving side first so we can accept submissions from Shannon's Google Form, save handlers/dogs/enrollments directly into our system, AND keep a raw copy of every payload for audit/replay. Once it's live, we give Shannon a short Apps Script to paste into her form.

## What gets built

### 1. New table: `google_form_submissions` (raw log)

Stores every incoming payload verbatim, regardless of whether ingest succeeded. Lets us replay, debug mapping issues, and prove "yes that submission did arrive at 14:03".

Columns:
- `id`, `received_at`
- `source` (text, e.g. `"shannon_puppy_form"`) — lets us add more forms later without a new endpoint
- `raw_payload` (jsonb) — the full body as sent
- `submitted_at` (timestamp from form, nullable)
- `status` — `received` | `ingested` | `failed` | `duplicate`
- `error_message` (nullable)
- `client_id`, `dog_ids[]`, `enrollment_ids[]` — populated when ingest succeeds
- `branch_id` (nullable) — resolved branch

RLS: admin-only read; service role full access (the edge function writes with service role).

### 2. New edge function: `google-form-intake`

Public endpoint (`verify_jwt = false`, same pattern as `public-puppy-enrollment`).

Flow:
1. CORS / OPTIONS handler.
2. Verify `x-webhook-secret` header against a new Supabase secret `GOOGLE_FORM_WEBHOOK_SECRET`. Reject 401 if missing/wrong.
3. Parse body with Zod: `{ source: string, submittedAt?: string, answers: Record<string,string|string[]> }`.
4. Insert a `google_form_submissions` row with `status = 'received'` immediately (so we always have the raw copy even if mapping crashes).
5. Run the **mapper** (see §3): convert `answers` → our domain shape (owner + dogs + branch resolution + class type + acknowledgements).
6. Reuse the existing ingest logic (same code path as `useSaveToDatabase` / `public-puppy-enrollment`):
   - Find-or-update `clients` by lowercased email.
   - Insert `dogs`.
   - Insert `enrollment_registrations` with `status='submitted'`, branch_id resolved.
7. Update the log row to `status='ingested'` with the IDs. On any failure, set `status='failed'` and `error_message`. Always return 200 to Apps Script (we don't want it retrying — we have the raw copy).
8. Idempotency: if a row with the same `email + submitted_at + source` already exists in `google_form_submissions` with `status='ingested'`, mark new one as `duplicate` and skip — protects against accidental re-submits.

### 3. Mapper module (inside the edge function)

A single config object: `QUESTION_TITLE → field_path`. Built defensively:
- Case-insensitive, trimmed key matching.
- Multiple aliases per field (e.g. `"Email"`, `"Email address"`, `"Your email"` all → `owner.email`).
- Unknown keys are ignored but preserved in `raw_payload` so we can extend mapping later without losing data.
- Branch resolution: if there's a branch question, fuzzy-match against `branches.name` (same logic as `useSaveToDatabase`). If absent or unmatched, leave `branch_id` null and let admin assign from Handlers page (existing flow).
- Class type: match against active `class_types` (case-insensitive). Default to `"Puppy"` if missing.

We'll fill in the exact title-to-field map once we have the form. To start, I'll seed it with the same fields our public puppy form already collects (owner name/email/phone, dog name/breed/DOB/gender/spay-neuter, acquired from, other pets, training goal, behavior/health issues, acknowledgements, whatsapp/photo permission, signature name/date) and we'll tighten it after the first real submission lands in the log.

### 4. New admin page: `/admin/google-form-log`

Simple table view of `google_form_submissions` so you can:
- See submissions as they arrive.
- See which ingested cleanly vs failed.
- Click a failed row → view raw JSON + error → fix mapping → "Replay" button (calls the edge function with the stored raw payload).
- Click an ingested row → jump to the resulting handler.

Lives under the existing admin navigation hub. Read-only for everyone except admin.

### 5. Secret

Add `GOOGLE_FORM_WEBHOOK_SECRET` to Supabase secrets (random 32-char string). You give the value to Shannon to paste into her Apps Script.

---

## What Shannon does (handed over AFTER ingest is tested)

Once §1–4 are deployed, I'll give you a packet to send Shannon:

1. **The webhook URL** — `https://vsgsagbpfclbuyqrepvf.supabase.co/functions/v1/google-form-intake`
2. **The shared secret** — generated above
3. **A ~20-line Apps Script** to paste into her form (Extensions → Apps Script), plus a 1-minute screenshot guide to install the `onFormSubmit` trigger.

The script:
```js
const WEBHOOK_URL = "...";
const SHARED_SECRET = "...";
const SOURCE = "shannon_puppy_form";

function onFormSubmit(e) {
  const answers = {};
  e.response.getItemResponses().forEach(r => {
    answers[r.getItem().getTitle()] = r.getResponse();
  });
  UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    headers: { "x-webhook-secret": SHARED_SECRET },
    payload: JSON.stringify({
      source: SOURCE,
      submittedAt: new Date().toISOString(),
      answers
    }),
    muteHttpExceptions: true
  });
}
```

## Testing flow

1. After deploy, I'll hit the endpoint with `curl` using a fake payload that mirrors a real form submission. Verify: row appears in `google_form_submissions`, handler/dog/enrollment created, status='ingested'.
2. Hit it with a bad secret → 401.
3. Hit it with a payload missing email → status='failed' with clear error.
4. Hit it twice with same data → second is 'duplicate'.
5. Then Shannon installs the script, submits her own form once, we watch the log page populate live.

## Out of scope (intentionally)

- Updating existing handlers via the form (only insert/upsert by email — Shannon's form is for new enrollments).
- Vet clearance file uploads (Google Forms file uploads land in Drive; we'd need separate Drive API work — defer unless Shannon's form actually asks for it).
- Auto-creating handler login accounts (existing `auto_create_handler_account` flow still runs the same way for admin-driven creation; we can wire it in later if you want).

## Technical notes

- Edge function uses `supabase/functions/google-form-intake/index.ts`, service role client (it needs to bypass RLS to insert into `clients`/`dogs`/`enrollment_registrations`).
- Reuses the field-mapping logic from `useSaveToDatabase.ts` for branch fuzzy-match and dog insert shape.
- Always returns 200 to Google Apps Script — failures live in our log table, not in HTTP status. Apps Script retries on non-2xx are unhelpful here because the raw payload is already saved.
- `google_form_submissions` gets standard `branch_id` and admin-only RLS per project memory rules.
