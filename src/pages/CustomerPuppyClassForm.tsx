import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { Helmet } from "react-helmet";
import { EnrollmentForm } from "@/components/enrollment/EnrollmentForm";

export default function CustomerPuppyClassForm() {
  return (
    <CustomerDashboardLayout>
      <Helmet>
        <title>Puppy Class Registration - McKaynine Training Centre</title>
      </Helmet>
      <EnrollmentForm />
    </CustomerDashboardLayout>
  );
}
