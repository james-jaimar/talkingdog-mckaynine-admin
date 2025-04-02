
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface ClassSchedulesLoadingProps {
  message: string;
}

export function ClassSchedulesLoading({ message }: ClassSchedulesLoadingProps) {
  return (
    <DashboardLayout>
      <div className="w-full py-6 flex justify-center">
        <p>{message}</p>
      </div>
    </DashboardLayout>
  );
}
