
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const Index = () => {
  const navigate = useNavigate();
  
  // No need to redirect since the home path now renders Dashboard directly
  
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
};

export default Index;
