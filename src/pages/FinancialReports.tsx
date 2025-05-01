
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useDateRangePickerState } from '@/hooks/useDateRangePickerState';
import { TrainerReportsTab } from '@/components/invoices/reports/TrainerReportsTab';
import { useBranch } from '@/context/BranchContext';
import { Calendar, ChevronRight, User2, Users, Receipt, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClassFinancialReport } from '@/components/invoices/reports/ClassFinancialReport';

export function FinancialReportsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentBranch: branch } = useBranch();
  const { dateRange, DateRangePicker } = useDateRangePickerState();
  const [activeTab, setActiveTab] = useState<string>('financial-report');
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL to reflect current tab
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', value);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };

  // Ensure dateRange always has both from and to dates defined
  const safeDataRange = {
    from: dateRange.from || new Date(),
    to: dateRange.to || new Date() // Provide default values to ensure both are defined
  };

  // Possible report categories
  const reportCategories = [
    {
      id: 'financial-report',
      title: 'Financial Report',
      description: 'View class financial data and revenue analysis',
      icon: <Receipt className="h-10 w-10 text-blue-500" />
    },
    {
      id: 'classes-list',
      title: 'Classes List',
      description: 'View class schedules and attendance records',
      icon: <Calendar className="h-10 w-10 text-green-500" />
    },
    {
      id: 'trainer-payments',
      title: 'Trainer Payments',
      description: 'View and manage trainer payment records and history',
      icon: <User2 className="h-10 w-10 text-amber-500" />
    }
  ];

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">
            View and manage financial data across your business
          </p>
        </div>
        
        <DateRangePicker />
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid grid-cols-3 gap-2">
          {reportCategories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
            >
              {category.title}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="financial-report" className="space-y-4">
          <ClassFinancialReport 
            dateRange={safeDataRange}
            onRefreshSuccess={() => {}}
          />
        </TabsContent>
        
        <TabsContent value="classes-list">
          <Card>
            <CardHeader>
              <CardTitle>Classes List</CardTitle>
              <CardDescription>
                View scheduled classes and attendance information
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-10">
              <p className="text-muted-foreground">
                Classes list report is currently under development
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link to="/classes">
                  Go to Classes <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="trainer-payments" className="space-y-4">
          <TrainerReportsTab 
            dateRange={safeDataRange}
            branchId={branch?.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FinancialReportsPage;
