
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function InvoiceRedirect() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the invoice list page
    navigate('/invoices/list', { replace: true });
  }, [navigate]);
  
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600" />
        <p className="mt-4">Redirecting to invoices...</p>
      </div>
    </DashboardLayout>
  );
}
