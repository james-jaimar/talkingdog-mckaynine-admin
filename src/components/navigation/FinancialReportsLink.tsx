
import React from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { cn } from "@/lib/utils";

export function FinancialReportsLink() {
  const location = useLocation();
  const isActive = location.pathname.startsWith('/financial-reports');

  return (
    <Link to="/financial-reports" className={cn(
      "group flex items-center text-sm text-gray-200 px-3 py-2 rounded-md transition-colors hover:bg-blue-600",
      isActive && "bg-blue-800"
    )}>
      <BarChart3 className="h-5 w-5 mr-2" />
      <span>Financial Reports</span>
    </Link>
  );
}
