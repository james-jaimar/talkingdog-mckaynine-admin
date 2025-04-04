
import CustomerMessagesPage from "./customer-messages/CustomerMessagesPage";
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";

export default function CustomerMessages() {
  return (
    <CustomerDashboardLayout>
      <CustomerMessagesPage />
    </CustomerDashboardLayout>
  );
}
