

# Fix: Send All Pages to AI for Enrollment Form Detection

## Problem

The current code hardcodes extracting only page 2 from PDFs, assuming the enrollment form is always on page 2. In practice, people rearrange the pages, so the form could be on any page.

## Solution

Instead of extracting only page 2 server-side, send the **entire PDF** to the AI model and update the prompt to instruct it to first scan all pages to identify which one is the enrollment form, then extract from that page.

### Changes (1 file)

#### `supabase/functions/extract-enrollment-scan/index.ts`

**1. Update the prompt** (lines 10-15) to replace the rigid "Page 1 is flyer, Page 2 is form" instruction with:

```
You are extracting data from a McKaynine dog training enrollment form.
The document may have multiple pages. The pages may be in ANY order.

STEP 1 - IDENTIFY THE FORM PAGE:
Scan through ALL pages and find the one that is the actual enrollment form.
The enrollment form contains handwritten fields for owner/handler details (name, email, phone),
dog details (name, breed, date of birth), and sections about social behavior, training goals, etc.
IGNORE any class information flyers, schedules, or other non-form pages.

STEP 2 - EXTRACT DATA:
From the identified enrollment form page, extract the following fields...
```

**2. Remove the page-2-only PDF extraction logic** (lines 150-196). Instead of creating a single-page PDF from page 2, send the full PDF as a base64 data URL. This simplifies the code:

- Remove the `PDFDocument` page extraction block (lines 176-187)
- Always convert the full `originalBytes` to base64
- The `pdf-lib` import can be removed entirely since we no longer manipulate pages

### Technical Detail

The simplified PDF handling becomes:
```typescript
const originalBytes = new Uint8Array(await fileData.arrayBuffer());
console.log("PDF size:", originalBytes.byteLength);

const pdfBase64 = btoa(
  Array.from(originalBytes)
    .map((b) => String.fromCharCode(b))
    .join("")
);
modelFileUrl = `data:application/pdf;base64,${pdfBase64}`;
```

### Considerations

- Sending the full PDF (typically 2 pages) is well within Gemini's capabilities and the base64 size should remain manageable for typical scanned forms.
- The AI model (gemini-2.5-flash) handles multi-page PDFs natively and can identify the correct page regardless of order.
- No frontend changes needed.
