import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { EnrollmentForm } from "@/components/enrollment/EnrollmentForm";

export default function PuppyClassForm() {
  return (
    <DashboardLayout>
      <Helmet>
        <title>Puppy Class Registration - McKaynine Training Centre</title>
      </Helmet>
      <EnrollmentForm />
    </DashboardLayout>
  );
}
