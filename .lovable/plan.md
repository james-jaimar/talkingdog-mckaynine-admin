# Shannon's Google Forms setup pack

Deliver a single self-contained guide Shannon can follow end-to-end, plus the exact Apps Script she pastes into her form.

## 1. New file: `docs/google-forms-shannon-setup.md`

A plain-English, step-by-step doc with:

### Part A — What you'll need
- Edit access to the Google Form (one form per branch — e.g. Delta, Randburg)
- The webhook URL (pre-filled): `https://vsgsagbpfclbuyqrepvf.supabase.co/functions/v1/google-form-intake`
- The webhook secret (provided privately, not in the doc): `Trinityhall20`
- The `SOURCE` value for that form — `delta`, `randburg`, etc. (must match a branch name in our system, lowercase)

### Part B — Open the script editor
1. Open the Google Form → click the three-dot menu (⋮) top-right → **Script editor**
2. Apps Script opens in a new tab with an empty `Code.gs`

### Part C — Paste the script
Replace everything in `Code.gs` with the script in section 2 below. Update only the two CONFIG lines at the top (`SOURCE` and `SECRET`).

### Part D — Save & authorise
1. Click the 💾 **Save** icon (name the project "McKaynine Intake")
2. From the function dropdown choose `installTrigger`, click **Run**
3. Google will prompt for permissions — click **Review permissions** → choose her Google account → **Advanced** → **Go to McKaynine Intake (unsafe)** → **Allow**
   - This is normal for any custom script; it's only granting the form permission to call our webhook
4. She should see "Trigger installed" in the execution log

### Part E — Test
1. Fill in the live form herself with a test submission
2. In the Lovable admin → **Settings → Google Forms** tab, the submission appears in the queue within ~5 seconds
3. We review, edit if needed, click **Approve & save handler** → handler appears in Handlers list

### Part F — Troubleshooting
- Nothing in the queue → re-run `installTrigger`, check `View → Executions` for errors
- "Unauthorized" in execution log → `SECRET` doesn't match — re-check spelling/case
- Submission lands but branch is wrong → `SOURCE` value doesn't match a branch name in our system

## 2. The exact Apps Script (included in the doc, in a code block)

```javascript
// ===== CONFIG — change these two lines only =====
const SOURCE = 'delta';                 // branch name, lowercase: 'delta' | 'randburg' | ...
const SECRET = 'PASTE_SECRET_HERE';     // provided privately by James

// ===== Do not edit below this line =====
const WEBHOOK_URL = 'https://vsgsagbpfclbuyqrepvf.supabase.co/functions/v1/google-form-intake';

function installTrigger() {
  // Remove any existing triggers on this form so we don't double-post
  const form = FormApp.getActiveForm();
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onFormSubmit').forForm(form).onFormSubmit().create();
  Logger.log('Trigger installed for form: ' + form.getTitle());
}

function onFormSubmit(e) {
  try {
    const answers = flattenAnswers(e.response);
    const payload = {
      source: SOURCE,
      submittedAt: new Date().toISOString(),
      answers: answers
    };
    const res = UrlFetchApp.fetch(WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'x-webhook-secret': SECRET },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    Logger.log('Status ' + res.getResponseCode() + ': ' + res.getContentText());
  } catch (err) {
    Logger.log('Error posting submission: ' + err);
  }
}

// Flatten Google Form responses, expanding grid questions into "Title [Row]" keys
function flattenAnswers(formResponse) {
  const out = {};
  formResponse.getItemResponses().forEach(ir => {
    const item = ir.getItem();
    const title = item.getTitle();
    const type = item.getType();
    const resp = ir.getResponse();

    if (type === FormApp.ItemType.GRID || type === FormApp.ItemType.CHECKBOX_GRID) {
      const rows = item.asGridItem ? item.asGridItem().getRows()
                                   : item.asCheckboxGridItem().getRows();
      (Array.isArray(resp) ? resp : []).forEach((rowAns, i) => {
        if (rowAns) out[title + ' [' + rows[i] + ']'] = rowAns;
      });
    } else {
      out[title] = resp;
    }
  });
  return out;
}
```

## 3. Delivery

- Doc lives in the repo so we can update it as Shannon's form evolves
- I'll paste the same content in chat for you to forward to Shannon (with the real secret swapped in)
- One form per branch = one copy of the script with a different `SOURCE` value

No code changes to the app itself — the ingest function, queue, and review tab are already live.
