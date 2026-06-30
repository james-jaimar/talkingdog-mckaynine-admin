# McKaynine Google Forms — Setup Guide for Shannon

This guide sets up a Google Form so that every submission flows automatically into the McKaynine admin app for review and approval.

One form per branch (e.g. one for Delta, one for Randburg). Run through this once per form.

---

## Part A — What you'll need

- Edit access to the Google Form
- The **webhook URL** (already filled into the script below):
  `https://vsgsagbpfclbuyqrepvf.supabase.co/functions/v1/google-form-intake`
- The **webhook secret** — provided to you privately by James (do not share or commit this)
- The **SOURCE** value for this form. This must match the branch name in our system, in lowercase:
  - `delta`
  - `randburg`
  - (add more here as new branches come online)

---

## Part B — Open the script editor

1. Open the Google Form
2. Click the three-dot menu (**⋮**) top-right
3. Choose **Script editor**
4. Apps Script opens in a new tab with an empty `Code.gs` file

---

## Part C — Paste the script

Delete everything in `Code.gs` and paste the script in [Part G](#part-g--the-script) below.

Then update **only the two CONFIG lines** at the top:

```javascript
const SOURCE = 'delta';                 // <- change to this form's branch
const SECRET = 'PASTE_SECRET_HERE';     // <- paste the secret James sent you
```

Leave everything else untouched.

---

## Part D — Save & authorise

1. Click the 💾 **Save** icon and name the project **"McKaynine Intake"**
2. In the function dropdown (top toolbar) choose **`installTrigger`**
3. Click **Run**
4. Google will prompt for permissions the first time:
   - Click **Review permissions**
   - Pick your Google account
   - Click **Advanced** → **Go to McKaynine Intake (unsafe)** → **Allow**
   - This warning is normal for any custom script. You are only allowing this form to call our webhook.
5. The execution log should show: `Trigger installed for form: <form name>`

You only do this step once per form. After that, every submission posts automatically.

---

## Part E — Test it

1. Open the live form and fill in a test submission (use your own email)
2. In the McKaynine admin app → **Settings → Google Forms** tab
3. Within ~5 seconds you should see the new submission in the queue
4. James/admin reviews, tweaks anything that needs cleaning up, then clicks **Approve & save handler**
5. The handler now appears in the Handlers list under the correct branch

---

## Part F — Troubleshooting

| Symptom | Fix |
|---|---|
| Nothing arrives in the queue | In Apps Script: **View → Executions**. Look at the most recent `onFormSubmit` row for errors. Re-run `installTrigger` if needed. |
| Execution log says `Status 401` | The `SECRET` is wrong. Re-check spelling and case — it must match exactly. |
| Submission arrives but branch is wrong | The `SOURCE` value doesn't match a branch name in our system. Use all lowercase (`delta`, `randburg`). |
| Duplicate submissions | Re-running `installTrigger` removes old triggers automatically — safe to run again. |

---

## Part G — The script

```javascript
// ===== CONFIG — change these two lines only =====
const SOURCE = 'delta';                 // branch name, lowercase: 'delta' | 'randburg' | ...
const SECRET = 'PASTE_SECRET_HERE';     // provided privately by James

// ===== Do not edit below this line =====
const WEBHOOK_URL = 'https://vsgsagbpfclbuyqrepvf.supabase.co/functions/v1/google-form-intake';

function installTrigger() {
  // Remove any existing onFormSubmit triggers so we don't double-post
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
// and converting FILE_UPLOAD answers into clickable Google Drive URLs.
function flattenAnswers(formResponse) {
  const out = {};
  formResponse.getItemResponses().forEach(ir => {
    const item = ir.getItem();
    const title = item.getTitle();
    const type = item.getType();
    const resp = ir.getResponse();

    if (type === FormApp.ItemType.GRID || type === FormApp.ItemType.CHECKBOX_GRID) {
      const rows = item.asGridItem
        ? item.asGridItem().getRows()
        : item.asCheckboxGridItem().getRows();
      (Array.isArray(resp) ? resp : []).forEach((rowAns, i) => {
        if (rowAns) out[title + ' [' + rows[i] + ']'] = rowAns;
      });
    } else if (type === FormApp.ItemType.FILE_UPLOAD) {
      // Google returns file IDs; convert to URLs in Shannon's Drive so admins
      // can click straight through (they already have share access).
      const ids = Array.isArray(resp) ? resp : [resp];
      out[title] = ids
        .filter(Boolean)
        .map(id => 'https://drive.google.com/file/d/' + id + '/view');
    } else {
      out[title] = resp;
    }
  });
  return out;
}
```

---

## Part H — File uploads (vaccination certs, etc.)

If your form includes a **File upload** question, Google stores every uploaded file in a folder in your Drive automatically. The script above turns those uploads into clickable Drive links inside each submission so the McKaynine admin can open them straight from the review queue.

**One-time setup:**

1. In your form, add a **File upload** question (e.g. "Upload vaccination certificate"). Google will warn you that respondents must sign in to a Google account — that's expected.
2. After your first test submission, find the auto-created folder in your Drive (named after the form, e.g. `<Form name> (File responses)`).
3. **Share that folder with Ady** (and anyone else who needs to view the uploads). Give them at least **Viewer** access. Do this once per form.

**That's it.** Future submissions will appear in the admin app with a "Drive attachments" panel listing each uploaded file. Clicking a link opens it in Drive using the admin's own Google sign-in.

> Note: Google Forms requires respondents to be signed into Google to upload files. That's a Google limitation, not something we can change on our side.

---

## Notes for James

- Webhook secret to share with Shannon (out-of-band, e.g. WhatsApp): `Trinityhall20`
- One copy of the script per form, only `SOURCE` differs between branches
- The edge function only logs submissions now — nothing is auto-created. All submissions sit in the **Settings → Google Forms** queue until you approve them
- If we ever rotate the secret, update it in the Lovable secrets manager AND every Apps Script
