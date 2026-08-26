# Split puppy class page into two pages

Today `/register/puppy-class` renders the info pack, the legal accordions, and the enrolment form all on one scrolling page. Split it so the info page sells the class, and the form lives on its own page.

## Page 1 — `/register/puppy-class` (info)
- Shows the info pack exactly as designed (no visual changes to the supplied layout).
- Both call-to-action buttons read **Start enrolment** (the lower one currently reads "Complete enrolment").
- Buttons navigate to page 2 instead of smooth-scrolling, carrying the selected branch along so the form opens on the right branch.
- The legal accordions are removed from this page.

## Page 2 — `/register/puppy-class/enrol` (form)
- Renders the existing enrolment form unchanged (same public mode, same branch options, same submit/email behaviour).
- Preselects the branch passed from page 1; if someone lands directly, it falls back to the first available branch as today.
- A "Back to course info" link at the top returns to page 1.
- The legal accordions appear at the end, below the form.
- Page starts scrolled to the top.

## Technical notes
- New route entry in `src/routes/publicRoutes.tsx` for `/register/puppy-class/enrol`, pointing at a new page component that reuses `useInfoPacks` for branch options.
- `PuppyClassLanding.tsx` drops `EnrollmentForm` and `LegalAccordions`; `onStart` becomes `navigate(\`/register/puppy-class/enrol?branch=<id>\`)`.
- `PuppyInfoPack.tsx`: only the lower button's label changes ("Complete enrolment" -> "Start enrolment"). No other edits to the supplied design.
- New page carries its own Helmet tags (title/description/canonical for the enrolment step); page 1 keeps its existing SEO tags.
- No changes to Supabase hooks, the enrolment edge function, or email flows.
