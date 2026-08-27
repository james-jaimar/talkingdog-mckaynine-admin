# POPIA compliance record: puppy-class enrolment

**System:** `https://mckaynine.talkingdog.co.za/register/puppy-class`  
**Assessment date:** 27 August 2026  
**Primary database/storage region:** AWS `eu-central-1` (Frankfurt, Germany), through Supabase  
**Notice version:** `2026-08-27`

This record documents the controls implemented for the puppy-class form. It supports McKaynine's accountability obligations but is not a legal opinion or a substitute for approval by McKaynine's registered Information Officer.

## 1. Roles and scope

- **Responsible parties:** McKaynine (Pty) Ltd t/a McKaynine Training Centre and the applicable selected branch/franchise, according to their actual operational and contractual responsibilities.
- **Operators:** Supabase (database, private object storage, authentication and edge functions), the website host, and the configured transactional-email provider and its subprocessors.
- **Data subjects:** prospective and existing handlers/clients completing the form. The form asks only for broad household categories and does not request a child's name or contact information.

The Information Officer must confirm the precise legal entity responsible for each branch and record its company/proprietor details. Technical documentation cannot make that governance decision.

## 2. Processing inventory

| Category | Examples | Purpose | Primary lawful basis |
|---|---|---|---|
| Contact/account | Name, email, phone, optional occupation, account-holder name, vet name | Administer booking, communicate, identify account | Pre-contract/contract; legitimate interests |
| Dog and training | Dog identity, age, breed, source, behaviour, goals | Suitability, class planning, training delivery and safety | Pre-contract/contract; legitimate interests |
| Household categories | Presence/age band of children, types of other pets | Training context and safety | Legitimate interests; supplied as part of requested service |
| Dog health/documents | Dog health details, vaccination card or vet-clearance document | Eligibility and safety | Contract; legitimate safety interests |
| Choices and evidence | WhatsApp/photo choices, acknowledgements, signature, dates, privacy notice version/time | Respect preferences and evidence agreement/compliance | Consent where applicable; contract; legal interests |
| Technical/security | Submission time, object path, service logs | Operate, secure and troubleshoot the service | Legitimate interests |

Dog health information is not the human data subject's medical information, but an uploaded document may contain a handler's contact details, a vet's name/signature or other personal information and is therefore protected as personal information.

## 3. Section 18 notice

Before any form fields are collected, the form now provides a concise just-in-time explanation and links to:

1. the form-specific Puppy Class Privacy Notice; and
2. McKaynine's general Privacy Policy.

The notice identifies what is collected, purposes and lawful bases, mandatory/optional consequences, recipients/operators, the Frankfurt transfer, safeguards, retention approach, rights, branch contacts and the Information Regulator. Acceptance is required and the server records the notice version and acceptance time with the registration.

## 4. Cross-border processing (POPIA section 72)

Primary project data and documents are hosted in Frankfurt, Germany. The documented transfer mechanism is:

- protection under applicable European data-protection law; and
- binding contractual safeguards with Supabase/operator terms, including controls for subprocessors and onward transfers.

McKaynine must retain the executed/current Supabase Data Processing Addendum and review Supabase's subprocessor list when notified of changes. Region selection is evidence of data location, but contractual safeguards remain necessary because support and subprocessors may operate from other countries.

## 5. Technical and organisational safeguards

Implemented in this repository:

- private Supabase bucket for vet-clearance documents;
- storage migration enforcing a 10 MB maximum and PDF/JPEG/PNG/WebP allow-list;
- randomised public-intake object names;
- no public document URL stored for new registrations;
- no document link included in notification email;
- short-lived signed URLs generated only when authorised staff request a document;
- role-based database/storage policies already present in the project;
- server-side payload validation and required privacy/terms acceptance;
- basic repeat-submission throttling;
- privacy-notice version and server acceptance timestamp retained as evidence.

Operational controls McKaynine must maintain:

- unique staff accounts, least privilege, MFA where available, prompt removal of leavers and periodic access reviews;
- confidential handling of exports, email and downloaded documents;
- patched dependencies, backups, monitoring and tested recovery;
- staff privacy/security awareness;
- documented incident response and immediate operator-to-McKaynine escalation.

## 6. Retention schedule requiring Information Officer approval

The Information Officer should approve exact periods based on McKaynine's accounting, insurance, safety and prescription requirements. Proposed operational defaults:

| Record | Proposed trigger and period |
|---|---|
| Abandoned/unmatched uploads | Delete after 24 hours |
| Unsuccessful enrolment enquiries | Delete or de-identify 12 months after last contact unless a dispute requires longer |
| Client, enrolment, consent and financial records | Keep for the service relationship and the applicable statutory/claims period, then delete or de-identify |
| Vaccination/vet-clearance documents | Review after enrolment/eligibility is confirmed; delete when no longer needed for safety, contractual or claims evidence |
| Operational/security logs | Short, documented period proportionate to security and troubleshooting needs |

Retention must be implemented as an automated or scheduled operational process, not merely stated in the notice.

## 7. Rights and incident procedures

- Direct access, correction, deletion, objection and consent-withdrawal requests to the selected branch and escalate them to the Information Officer.
- Verify identity proportionately. Do not routinely require a full unredacted ID copy where a less intrusive method is sufficient.
- Record the request, decision, action and response date.
- If personal information may have been accessed or acquired by an unauthorised person, preserve evidence, contain the incident, notify the Information Officer immediately, and follow POPIA section 22. The responsible party—not the operator—must notify the Information Regulator and affected data subjects as soon as reasonably possible, subject to any lawful delay.

## 8. Organisational sign-off checklist

These items cannot be completed in application code. McKaynine should not state that *all* POPIA requirements have been completed until each is evidenced:

- [ ] Confirm and document the responsible legal entity for each branch/franchise.
- [ ] Register the Information Officer with the Information Regulator and retain confirmation.
- [ ] Name the privacy/Information Officer contact in the general Privacy Policy and PAIA manual.
- [ ] Accept/sign and retain Supabase's current DPA; record all other operators and contracts.
- [ ] Confirm the transactional-email provider, website host, subprocessors and their transfer safeguards.
- [ ] Approve the processing inventory and conduct/retain a personal-information impact assessment.
- [ ] Approve exact retention periods and implement deletion/housekeeping jobs.
- [ ] Maintain a PAIA manual and internal data-subject request procedure.
- [ ] Approve and test the security-compromise response procedure.
- [ ] Review staff access and confirm MFA/least privilege.
- [ ] Update the general McKaynine Privacy Policy to reflect the online registration system and cross-border processing.

## 9. Evidence to retain

- Screenshot/export confirming project region `eu-central-1` (Frankfurt).
- Supabase DPA and dated subprocessor list.
- Current privacy notices and their version history.
- Migration and release records for privacy/security changes.
- Access-review, training, retention/deletion and incident-test records.
- Information Officer registration and approval of this assessment.

