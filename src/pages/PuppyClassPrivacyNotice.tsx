import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { MCKAYNINE_PRIVACY_POLICY_URL, PRIVACY_NOTICE_VERSION } from "@/lib/privacy";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    <div className="space-y-2 text-sm leading-6 text-gray-700">{children}</div>
  </section>
);

export default function PuppyClassPrivacyNotice() {
  return (
    <>
      <Helmet>
        <title>Puppy Class Privacy Notice | McKaynine</title>
        <meta name="description" content="How McKaynine processes personal information submitted through the puppy class enrolment form." />
        <link rel="canonical" href="https://mckaynine.talkingdog.co.za/register/puppy-class/privacy" />
      </Helmet>
      <main className="min-h-screen bg-pack-bg px-4 py-8 sm:px-6">
        <article className="mx-auto max-w-3xl space-y-8 rounded-2xl bg-white p-6 shadow-sm sm:p-10">
          <Link to="/register/puppy-class/enrol" className="inline-flex items-center gap-2 text-sm font-medium text-customer-accent hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to enrolment
          </Link>
          <header className="space-y-3">
            <div className="flex items-center gap-3"><Shield className="h-7 w-7 text-customer-accent" /><h1 className="text-3xl font-bold">Puppy Class Privacy Notice</h1></div>
            <p className="text-sm text-gray-500">Notice version {PRIVACY_NOTICE_VERSION}</p>
            <p className="leading-7 text-gray-700">This notice is provided when we collect information through the McKaynine puppy class enrolment form. It supplements McKaynine's <a href={MCKAYNINE_PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" className="text-customer-accent underline">general Privacy Policy</a>.</p>
          </header>

          <Section title="Who is responsible">
            <p>McKaynine (Pty) Ltd t/a McKaynine Training Centre and the McKaynine branch or franchise selected in your enrolment are responsible for using your information lawfully. The selected branch manages your booking and is your first contact for privacy requests.</p>
          </Section>
          <Section title="Information we collect">
            <ul className="list-disc space-y-1 pl-5">
              <li>Your name, email address, telephone number, optional occupation, account-holder name and vet name.</li>
              <li>Your dog's identity, age, breed, background, behaviour, training goals and health-related information.</li>
              <li>Broad household information, including whether children or other pets are present. We do not ask for children's names or contact details.</li>
              <li>Your branch and class choices, permissions for WhatsApp contact and photographs, acknowledgements, signature name and submission date.</li>
              <li>The vaccination card or vet-clearance document you upload and technical records needed to secure and troubleshoot the service.</li>
            </ul>
          </Section>
          <Section title="Why and on what basis we use it">
            <p>We use the information to consider and administer your enrolment; check class and safety requirements; deliver training; communicate about the booking; maintain financial, operational and legal records; handle queries and disputes; prevent misuse; and protect people, animals and the service.</p>
            <p>The principal bases are taking steps at your request and performing the training agreement, McKaynine's legitimate operational and safety interests, compliance with legal obligations, and consent where POPIA requires it. WhatsApp and photograph choices are recorded separately and may be changed by contacting the branch.</p>
          </Section>
          <Section title="Required and optional information">
            <p>Fields marked as required, the safety acknowledgements and the requested vaccination or vet-clearance document are needed to assess and administer the enrolment. If they are not supplied, we may be unable to accept or safely provide the booking. Fields described as optional may be left blank.</p>
          </Section>
          <Section title="Who receives it">
            <p>Access is limited to authorised McKaynine branch personnel and administrators who need it for their work. Contracted operators may process information to provide database hosting, file storage, authentication, website hosting and transactional email. Information may also be disclosed where required by law or necessary to establish, exercise or defend legal rights. We do not sell enrolment information.</p>
          </Section>
          <Section title="Processing outside South Africa">
            <p>The primary database and uploaded documents are hosted through Supabase in the AWS Central EU (Frankfurt), Germany region (eu-central-1). This is a transfer outside South Africa. McKaynine relies on protections under applicable European data-protection law and binding contractual safeguards with operators, including safeguards for onward transfers, as contemplated by section 72 of POPIA. Limited processing or support by approved subprocessors may occur elsewhere under those safeguards.</p>
          </Section>
          <Section title="Security and retention">
            <p>McKaynine uses role-based access, private document storage, encrypted network connections and contractual and organisational safeguards. No internet service can promise absolute security.</p>
            <p>Information is retained only while reasonably needed for enrolment, service delivery, safety, accounting, legal and dispute-resolution purposes, then securely deleted or de-identified in line with McKaynine's approved retention schedule. Unsuccessful or abandoned uploads should be removed through routine housekeeping.</p>
          </Section>
          <Section title="Your rights and complaints">
            <p>You may ask whether McKaynine holds your information and request access, correction or deletion where applicable; object to processing on reasonable grounds; withdraw consent for consent-based uses; or complain to the South African Information Regulator. Some information may need to be retained where the law or an existing agreement permits or requires it.</p>
            <p>Contact the branch selected in your enrolment: <a className="text-customer-accent underline" href="mailto:delta@mckaynine.co.za">delta@mckaynine.co.za</a> or <a className="text-customer-accent underline" href="mailto:randburg@mckaynine.co.za">randburg@mckaynine.co.za</a>. Other McKaynine contact details are available on the <a className="text-customer-accent underline" href="https://mckaynine.co.za/contact.html" target="_blank" rel="noopener noreferrer">contact page</a>. The Information Regulator can be contacted through <a className="text-customer-accent underline" href="https://inforegulator.org.za/" target="_blank" rel="noopener noreferrer">inforegulator.org.za</a>.</p>
          </Section>
        </article>
      </main>
    </>
  );
}

