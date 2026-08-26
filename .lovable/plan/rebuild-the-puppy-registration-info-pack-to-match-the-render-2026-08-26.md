# Rebuild the puppy registration info pack to match the render

Rebuild the marketing section above the enrolment form at `/register/puppy-class` so it matches the supplied render: a light, brochure-style, branded layout rather than the current dark photo hero and stacked cards.

## Layout to recreate

```text
+--------------------------------------------------------------+
| [logo]                                   |  2026 Class Dates  |
| Give your puppy the best start in life   |  time / dates      |
| sub-line                                 |  venue             |
| [Start enrolment >]  trust 1  trust 2    |  missed-class note |
|                       (hero photo right) |                    |
+--------------------------------------------------------------+
| What we help with (6 icon tiles) | Course fees | When can I  |
|                                  | + discount  | start?      |
+--------------------------------------------------------------+
| What to bring | Joining details | Before you enrol | Find us  |
|                                                    + map img  |
+--------------------------------------------------------------+
| Ready to get started?                    [Complete enrolment] |
+--------------------------------------------------------------+
```

Responsive behaviour: the four-column band collapses to 2 columns on tablet and 1 on mobile; the hero stacks (text, then dates card, then photo) on mobile; the icon tiles go 6 → 3 → 2 across.

## Visual direction

- Light background, white rounded cards with soft borders and subtle shadow, matching the render's calm brochure feel.
- Brand blue for the headline, primary buttons and logo lockup; keep the existing teal accent only where it already reads well (checkmarks), or switch checkmarks to brand blue for consistency with the render.
- Headline is large and tight-tracked; body text small and grey.
- Each icon tile is a soft pastel circle with a line icon and a label underneath (Nipping, Chewing, Social manners, Lead walking, Confidence, Toilet training) — using Lucide icons with per-tile tinted circles.
- Section cards each get a small coloured icon next to the heading (paw, calendar, bag, clipboard, clock, pin).
- The discount line sits inside the fees card as a highlighted tinted strip.
- The "staff may be unable to answer calls" note becomes a small info strip inside the Find us card.
- Existing legal accordions and the vet clearance PDF download stay, styled to match the new cards, below the new sections.

## Content and data

Everything stays branch-driven from `branch_info_packs` (Delta / Randburg), with class dates and fees still coming live from `classes` / `class_schedules`.

The render needs a few things the table does not store yet, so the following columns get added and seeded for both branches:

- `logo_url` — branch logo lockup for the hero.
- `map_image_url` — static map image shown in the Find us card.
- `missed_class_note` — "Missed the first class? …" callout in the dates card.
- `before_enrol_notes` (jsonb array) — the "Before you enrol" bullets (cut-off, confirmation), replacing the ad-hoc use of `cutoff_note`.
- `start_notes` (jsonb array) — the "When can I start?" bullets, seeded from the existing age and vaccination notes.

The uploaded images (Delta logo, Randburg logo, hero puppy photo, Delta map, Randburg map) are uploaded as CDN assets and their URLs stored in the branch rows, so admins can swap them later without a code change.

The class-dates card shows the actual upcoming schedule for the selected branch: session time and the lesson dates in a compact "Sep 5, 12, 19 & Oct 3, 17, 24" style, derived from the schedule's selected dates.

## Branch switching

The branch chooser stays but moves to a compact pill pair in the hero area so the page opens as a branded brochure rather than a photo banner. Selecting Randburg swaps logo, hero copy, dates, venue, fees, directions and map.

## Technical notes

- `PuppyInfoPack.tsx` is rewritten as a set of small presentational components in `src/components/enrollment/landing/`: `InfoHero`, `ClassDatesCard`, `HelpWithGrid`, `FeesCard`, `WhenToStartCard`, `WhatToBringCard`, `JoiningDetailsCard`, `BeforeYouEnrolCard`, `FindUsCard`, `ReadyBanner`.
- `useInfoPackData.ts` gains the new fields on the `InfoPack` interface plus a date-formatting helper for the grouped lesson dates.
- One migration adds the five nullable columns and updates the two seeded rows; no RLS or grant changes needed since the table's existing public-read policy covers them.
- New colour tokens (brand blue, tile pastels) go into `index.css` and `tailwind.config.ts` as semantic tokens — no hardcoded hex in components.
- No changes to the enrolment form itself, submission logic, or the legal content text.
