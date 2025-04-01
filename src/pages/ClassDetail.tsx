
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>();

  return (
    <DashboardLayout>
      <Helmet>
        <title>Class Details - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Class Details</h1>
        <p>Viewing class with ID: {classId}</p>
        {/* Additional class details will be implemented later */}
      </div>
    </DashboardLayout>
  );
}
