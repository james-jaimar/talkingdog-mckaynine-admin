import { Helmet } from "react-helmet";
import { PuppyClassLanding } from "@/components/enrollment/landing/PuppyClassLanding";

export default function PublicPuppyClassForm() {
  return (
    <>
      <Helmet>
        <title>Puppy Class Registration | McKaynine Training Centre</title>
        <meta name="description" content="Register your puppy for our award-winning training classes. Course info, fees, what to bring and a quick online enrolment form." />
        <link rel="canonical" href="https://talkingdog.co.za/register/puppy-class" />
        <meta property="og:title" content="Puppy Class Registration | McKaynine Training Centre" />
        <meta property="og:description" content="Course info, fees, what to bring and a quick online enrolment form for McKaynine puppy classes." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <main>
        <PuppyClassLanding />
      </main>
    </>
  );
}

