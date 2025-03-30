
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function HandlerDetailSkeleton() {
  return (
    <div className="flex justify-center p-12">
      <div className="animate-pulse text-gray-500">Loading handler details...</div>
    </div>
  );
}
