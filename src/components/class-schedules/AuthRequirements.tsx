
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface AuthRequirementsProps {
  message: string;
}

export function AuthRequirements({ message }: AuthRequirementsProps) {
  return (
    <DashboardLayout>
      <div className="w-full py-6 flex justify-center">
        <p>{message}</p>
      </div>
    </DashboardLayout>
  );
}
