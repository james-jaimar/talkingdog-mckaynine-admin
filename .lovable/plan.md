# Puppy Registration: Info Pack Landing + Enrolment Form

Turn `/register/puppy-class` into a single, beautiful public page: an info-pack hero and content sections (Shannon's pages 1–2) driven from the database per branch and course, the existing 6-step wizard below it, and the legal material (T&Cs, HomeTrain addendum, vet clearance guidance) as tidy accordions at the bottom.

## 1. Landing page above the form

New `PuppyClassLanding` section rendered above `<EnrollmentForm />`:

- **Hero** — "Give your puppy the best start in life", sub-line, branch logo, trust line ("Trusted by puppy owners since 1999", "Recommended by vets, breeders & dog professionals"), photo background.
- **What we help with** — icon chips: nipping, chewing, social manners, lead walking, confidence, toilet training.
- **When can I start** — age window and the two-vaccination requirement, as a highlighted note card.
- **Where & when** — venue, time slot, and the actual course dates, pulled live from the selected branch's next puppy course.
- **Course fees** — course fee, enrolment fee, what's included, and the 25% simultaneous-enrolment discount note.
- **What to bring** — checklist card.
- **Joining details** — numbered steps, banking/POP details, cut-off note.
- **Getting there** — directions bullets, map image, "we're in class, can't take calls" and bad-weather notes.
- **Testimonial** — single quote card.
- Sticky "Start registration" CTA that smooth-scrolls to the form.

Visual language stays with the existing customer palette (`customer-accent`, white cards, rounded-2xl, soft gradients) so it reads as one page with the wizard, not a pasted brochure.

## 2. Branch selector drives everything

A branch selector sits at the top of the landing page, limited to **Randburg and Delta**. Choosing a branch swaps the whole info pack (venue, dates, fees, contact, banking, map) and pre-selects the branch in the wizard's Step 6, so the user never picks twice. Branch choice persists in the URL (`?branch=delta`) so Ady can share a direct link.

## 3. Dynamic content per branch and course

Course-level facts already live in the database and will be read, not retyped:

- Course fee and enrolment fee from `classes.course_fee` / `classes.enrollment_fee`
- Class dates from `class_schedules.selected_dates`, time from `start_time` / `end_time`
- Venue address, phone and email from `branches`
- Logo from `branch_branding.logo_url`

The brochure-only content has no home yet, so a new table `branch_info_packs` holds it per branch: hero heading/sub-heading, hero image, trust lines, "what we help with" items, age-requirement text, what-to-bring list, joining steps, banking details, directions bullets, map image, weather note, testimonial (quote + author + photo), and contact/website lines. Public read for `anon`, admin write. Seeded with the Delta content from the PDF and the Randburg equivalents.

An **Info Pack editor** is added to admin Branch Management so Ady can edit any of this without a developer.

## 4. Legal accordions at the bottom

Below the form, a collapsible section: Terms & Conditions V11-25 (full text, grouped by the numbered clauses), the Indemnity block, the Protection of Personal Information block, and the HomeTrain Addendum. Stored as content so they can be edited, with a "Download the full info pack (PDF)" link. The vet clearance requirement stays where it already works — the upload step in the wizard — with a short explainer ("only needed if the last vaccination wasn't given by a vet — look for BVSc after the signature").

## 5. Form fields

The wizard already captures everything Shannon's paper form asks for; age is derived from date of birth, and the vet clearance upload is already handled. The only change is the branch restriction (Randburg / Delta) and passing the landing page's branch choice through to Step 6.

## Technical notes

- New table `public.branch_info_packs` (one row per branch, JSONB for the list-style content), with `GRANT SELECT` to `anon`/`authenticated` and full access to admins via RLS; admin writes gated by `has_role(auth.uid(),'admin')`.
- Course data fetched in one joined query (`classes` → `class_schedules`) filtered by branch and `class_type = 'Puppy'`, upcoming only, via React Query — no extra round trips.
- Landing content and legal text are components under `src/components/enrollment/landing/`; the wizard in `src/components/enrollment/` is untouched apart from branch pre-selection.
- Images (hero, map, testimonial) go through Lovable assets, referenced by URL from `branch_info_packs` so they're swappable in admin.
- SEO: proper `<h1>`, semantic sections, updated title/description, and JSON-LD `Course` markup for the puppy class.

## Out of scope

- Rebuilding the vet clearance form as a web form (still a downloadable PDF).
- Any change to invoicing, bookings, or the submission edge function.
