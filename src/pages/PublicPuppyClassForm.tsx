import { Helmet } from "react-helmet";
import { EnrollmentForm } from "@/components/enrollment/EnrollmentForm";

export default function PublicPuppyClassForm() {
  return (
    <>
      <Helmet>
        <title>Puppy Class Registration | McKaynine Training Centre</title>
        <meta name="description" content="Register your puppy for our award-winning training classes. Quick online form — we'll be in touch to confirm your spot." />
        <link rel="canonical" href="https://talkingdog.co.za/register/puppy-class" />
      </Helmet>
      <main>
        <h1 className="sr-only">Puppy Class Registration</h1>
        <EnrollmentForm mode="public" />
      </main>
    </>
  );
}
