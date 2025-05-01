
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useDateRangePickerState } from '@/hooks/useDateRangePickerState';
import { TrainerReportsTab } from '@/components/invoices/reports/TrainerReportsTab';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { Calendar, ChevronRight, User2, Users, Receipt, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export function FinancialReportsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { branch } = useCurrentBranch();
  const { dateRange, DateRangePicker } = useDateRangePickerState();
  const [activeTab, setActiveTab] = useState<string>('trainer-payments');
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL to reflect current tab
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', value);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };

  // Possible report categories
  const reportCategories = [
    {
      id: 'trainer-payments',
      title: 'Trainer Payments',
      description: 'View and manage trainer payment records and history',
      icon: <User2 className="h-10 w-10 text-blue-500" />
    },
    {
      id: 'client-revenue',
      title: 'Client Revenue',
      description: 'Analyze revenue by client and class type',
      icon: <Users className="h-10 w-10 text-green-500" />,
      disabled: true
    },
    {
      id: 'invoice-reports',
      title: 'Invoice Reports',
      description: 'Track invoice status, payments, and outstanding amounts',
      icon: <Receipt className="h-10 w-10 text-amber-500" />,
      disabled: true
    },
    {
      id: 'payment-methods',
      title: 'Payment Methods',
      description: 'View payment method distribution and transaction history',
      icon: <CreditCard className="h-10 w-10 text-purple-500" />,
      disabled: true
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
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {reportCategories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              disabled={category.disabled}
            >
              {category.title}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="trainer-payments" className="space-y-4">
          <TrainerReportsTab 
            dateRange={dateRange}
            branchId={branch?.id}
          />
        </TabsContent>
        
        <TabsContent value="client-revenue">
          <Card>
            <CardHeader>
              <CardTitle>Client Revenue Reports</CardTitle>
              <CardDescription>
                Coming soon - This feature is under development
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-10">
              <p className="text-muted-foreground">
                Client revenue analysis reports will be available soon
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link to="/dashboard">
                  Return to Dashboard <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoice-reports">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Reports</CardTitle>
              <CardDescription>
                Coming soon - This feature is under development
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-10">
              <p className="text-muted-foreground">
                Detailed invoice reporting will be available soon
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link to="/dashboard">
                  Return to Dashboard <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="payment-methods">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Analysis</CardTitle>
              <CardDescription>
                Coming soon - This feature is under development
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-10">
              <p className="text-muted-foreground">
                Payment method analysis will be available soon
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link to="/dashboard">
                  Return to Dashboard <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FinancialReportsPage;
