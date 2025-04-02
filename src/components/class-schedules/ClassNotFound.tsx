
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export function ClassNotFound() {
  const navigate = useNavigate();
  
  return (
    <DashboardLayout>
      <div className="w-full py-6 flex justify-center flex-col items-center">
        <p className="mb-4">Class not found. The class may no longer exist or you might not have permission to view it.</p>
        <Button 
          variant="outline"
          onClick={() => navigate("/classes")}
        >
          Return to Classes
        </Button>
      </div>
    </DashboardLayout>
  );
}
