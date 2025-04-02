
import { AlertCircle } from "lucide-react";

interface ScheduleTableAlertProps {
  message: string;
  variant?: "warning" | "error" | "info";
}

export function ScheduleTableAlert({ message, variant = "warning" }: ScheduleTableAlertProps) {
  const bgColor = {
    warning: "bg-amber-50 border-amber-200 text-amber-700",
    error: "bg-red-50 border-red-200 text-red-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  }[variant];

  return (
    <div className={`${bgColor} border p-4 rounded-md`}>
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        <p>{message}</p>
      </div>
    </div>
  );
}
