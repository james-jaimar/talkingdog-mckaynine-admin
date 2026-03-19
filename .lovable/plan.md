

# Make Email Template Course Tables Robust

## Problem
The "congrats" email templates contain course info tables (Course, Price, Entry Criteria, Dates, Day & Time) with inline styles. When Ady edits text near these tables in the TipTap rich text editor, the table styling breaks — header colors disappear, borders vanish, and the layout falls apart. The tables are also hardcoded with old dates and prices from previous terms.

## Root Cause
TipTap's table editing with inline styles is inherently fragile. When the cursor enters a styled table cell and content changes, ProseMirror can strip or corrupt inline `style` attributes. The current approach — storing the entire styled table as raw HTML in the editor — means any accidental edit destroys the formatting.

## Solution: Structured Course Info Block
Instead of making Ady edit a fragile HTML table inside the WYSIWYG editor, treat the course info table as a **structured data block** with dedicated input fields. The table HTML is generated automatically from those fields and is never directly editable in the rich text area.

### How it works

1. **New "Course Info Table" component** — a toolbar button in the RichTextEditor that inserts a placeholder `{{course_table}}` merge field (just like `{{handler_name}}`).

2. **Course Table Data Editor** — when creating/editing a template, a dedicated section appears where Ady fills in structured fields:
   - Course Name (e.g. "Novice Obedience")
   - Price (e.g. "R1,770.00")
   - Entry Criteria (e.g. "Beginner Obedience")
   - Dates (multi-line text, e.g. "March 28th\nApril 11th 18th\nMay 9th 16th 23rd")
   - Day & Time (e.g. "Saturdays 14:00 – 15:00")
   - She can add multiple course rows (for templates offering 2 options like "Silver OR Novice")

3. **At render time**, `{{course_table}}` is replaced with a perfectly styled HTML table matching the current blue-header design — generated from the structured data. Ady never touches the table HTML.

4. **Course Description section** — similar approach: a `{{course_description}}` merge field with a structured editor for bullet points. Ady types each point as a line item; HTML is generated automatically.

5. **Existing templates migrated** — the hardcoded congrats templates will have their table HTML extracted into the structured format, so old templates get the same benefit.

### Changes

**File: `src/components/email-templates/CourseTableEditor.tsx`** (new)
- UI component with fields for course name, price, entry criteria, dates, day/time
- "Add another course" button for multi-course templates
- Generates the `course_table` variable value (styled HTML)

**File: `src/components/email-templates/CourseDescriptionEditor.tsx`** (new)
- UI for entering course description bullet points as a simple list
- Generates `course_description` variable value (styled HTML)

**File: `src/components/email-templates/TemplateEditorModal.tsx`**
- Add CourseTableEditor and CourseDescriptionEditor sections below the rich text editor
- Store course table data as JSON in a new `variables` field on the template (or in the existing content as structured merge fields)
- Pass generated HTML into the template renderer for preview

**File: `src/lib/email/template-renderer.ts`**
- Add `course_table` and `course_description` to available merge fields
- Add `generateCourseTableHtml(courses)` function that produces the styled table

**File: `src/components/platform-templates/RichTextEditor.tsx`**
- Add "Insert Course Table" and "Insert Course Description" to the merge fields dropdown
- Add TipTap CSS to protect table rendering in the editor (borders, header colors)

**File: `src/lib/email/templates/congrats-templates.ts`**
- Replace hardcoded table HTML with `{{course_table}}` and `{{course_description}}` placeholders
- Move the old data into default structured values

**File: `src/index.css`**
- Add ProseMirror table styles to prevent table styling from breaking during editing (borders, header background colors preserved via CSS rather than relying solely on inline styles)

### Result
- Ady sees input fields for course info — no more fighting with table formatting
- The blue-header table is always perfectly rendered
- She can update dates, prices, and descriptions each term without touching HTML
- Multiple course options (Silver + Novice) are supported via "Add Course" button
- The rest of the email body remains fully editable in the rich text editor

