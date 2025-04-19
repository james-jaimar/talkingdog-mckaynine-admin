
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subMonths } from "date-fns";
import { InvoiceStatus } from "@/types/invoice";

interface InvoiceFilterTabsProps {
  onMonthFilterChange: (value: string) => void;
  onStatusFilterChange: (status: InvoiceStatus | 'all') => void;
}

export function InvoiceFilterTabs({ 
  onMonthFilterChange, 
  onStatusFilterChange 
}: InvoiceFilterTabsProps) {
  return (
    <>
      <Tabs defaultValue="current" className="mb-4" onValueChange={onMonthFilterChange}>
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-5 w-full max-w-md">
            <TabsTrigger value="current">
              {format(new Date(), "MMM yyyy")}
            </TabsTrigger>
            <TabsTrigger value="prev1">
              {format(subMonths(new Date(), 1), "MMM yyyy")}
            </TabsTrigger>
            <TabsTrigger value="prev2">
              {format(subMonths(new Date(), 2), "MMM yyyy")}
            </TabsTrigger>
            <TabsTrigger value="prev3">
              {format(subMonths(new Date(), 3), "MMM yyyy")}
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      <Tabs defaultValue="all" className="mb-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all" onClick={() => onStatusFilterChange('all')}>
              All
            </TabsTrigger>
            <TabsTrigger value="draft" onClick={() => onStatusFilterChange('draft')}>
              Draft
            </TabsTrigger>
            <TabsTrigger value="sent" onClick={() => onStatusFilterChange('sent')}>
              Sent
            </TabsTrigger>
            <TabsTrigger value="paid" onClick={() => onStatusFilterChange('paid')}>
              Paid
            </TabsTrigger>
            <TabsTrigger value="overdue" onClick={() => onStatusFilterChange('overdue')}>
              Overdue
            </TabsTrigger>
            <TabsTrigger value="cancelled" onClick={() => onStatusFilterChange('cancelled')}>
              Cancelled
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </>
  );
}
