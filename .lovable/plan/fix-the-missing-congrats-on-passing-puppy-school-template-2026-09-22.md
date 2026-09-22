# Fix the missing "Congrats on passing puppy school" template

## What I found (checked against the live data and code)

1. **The template is not missing.** Delta has 14 active templates, and "Congrats on passing puppy school" is the **oldest** one. The dropdown lists templates newest-first, so it sits dead last, below the visible area of the list in your screenshot. The Tasks email window uses the same list, so whether it "appears" depends purely on how far the list is scrolled.
2. **The Class Type box can't be cleared.** When you set Class Type back to the blank/"all" option, the save skips the field entirely instead of clearing it, so "Puppy" stays on the template forever. (Setting a different class type does save.)
3. **Class Type is not blocking anything.** Neither the handler email window nor the Tasks email window filters templates by class type — every active template for the current branch is offered. So "Puppy" on that template is cosmetic, not the reason Ady couldn't find it.

Note: the handler's own branch doesn't matter here either — the list always follows the branch selected at the top of the app. Delta and Randburg each have their own copy of the puppy template.

## What I'll change

**Template picker (handler email window and Tasks email window)**
- Sort templates A–Z by name instead of by creation date.
- Add a type-to-search box at the top of the dropdown so Ady can type "puppy" and jump straight to it.
- Make the dropdown list taller and properly scrollable inside the dialog so nothing is cut off.

**Template editor**
- Make the Class Type field clearable: choosing the blank option actually removes the class type and saves.

## Technical detail

- `src/hooks/useEmailTemplates.ts`: order by `name` ascending instead of `created_at` desc.
- `src/components/handlers/detail/SendQuickEmailModal.tsx` and `src/components/tasks/SendInfoPackModal.tsx`: replace the plain `Select` with a searchable combobox (existing `Command` + `Popover` shadcn primitives), keeping the "Your Templates" / "System Templates" grouping and badges, and keeping the existing selection handlers (`templateType` prebuilt vs custom detection) unchanged.
- `src/components/email-templates/TemplateEditorModal.tsx` line 168: `class_type: classType === "all" ? null : classType` — `undefined` is stripped from the Supabase update payload, which is why clearing silently fails. `UpdateTemplateInput.class_type` needs to accept `string | null`.
- No database or email-sending changes; nothing about how emails are queued or rendered is touched.
