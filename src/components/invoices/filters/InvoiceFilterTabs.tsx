
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { InvoiceStatus } from "@/types/invoice";
import { Dispatch, SetStateAction } from "react";

export interface InvoiceFilterTabsProps {
  onMonthFilterChange: Dispatch<SetStateAction<string>>;
  onStatusFilterChange: Dispatch<SetStateAction<InvoiceStatus | "all">>;
  showTermOption?: boolean;
  currentMonthFilter?: string; // Add this prop to match what's being passed in Invoices.tsx
}

export function InvoiceFilterTabs({ 
  onMonthFilterChange, 
  onStatusFilterChange,
  showTermOption = false,
  currentMonthFilter = "all" // Default to "all" if not provided
}: InvoiceFilterTabsProps) {
  // Use the currentMonthFilter prop as the initial state for activeTab
  const [activeTab, setActiveTab] = useState(currentMonthFilter || "all");
  const [activeStatusTab, setActiveStatusTab] = useState<InvoiceStatus | "all">("all");

  // Update activeTab when currentMonthFilter prop changes from outside
  useEffect(() => {
    if (currentMonthFilter) {
      setActiveTab(currentMonthFilter);
    }
  }, [currentMonthFilter]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onMonthFilterChange(value);
  };

  const handleStatusChange = (value: InvoiceStatus | "all") => {
    setActiveStatusTab(value);
    onStatusFilterChange(value);
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:justify-between mb-4">
      <Tabs value={activeTab} className="w-full md:w-auto">
        <TabsList className="w-full md:w-auto grid grid-cols-2 md:grid-cols-6">
          <TabsTrigger 
            value="current" 
            onClick={() => handleTabChange("current")}
          >
            Current Month
          </TabsTrigger>
          <TabsTrigger 
            value="prev1" 
            onClick={() => handleTabChange("prev1")}
          >
            Last Month
          </TabsTrigger>
          <TabsTrigger 
            value="prev2" 
            onClick={() => handleTabChange("prev2")}
          >
            2 Months Ago
          </TabsTrigger>
          <TabsTrigger 
            value="prev3" 
            onClick={() => handleTabChange("prev3")}
          >
            3 Months Ago
          </TabsTrigger>
          {showTermOption && (
            <TabsTrigger 
              value="term" 
              onClick={() => handleTabChange("term")}
            >
              Current Term
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="all" 
            onClick={() => handleTabChange("all")}
          >
            All Time
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex justify-start gap-2">
        <Button
          variant={activeStatusTab === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusChange("all")}
        >
          All
        </Button>
        <Button
          variant={activeStatusTab === "draft" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusChange("draft")}
        >
          Draft
        </Button>
        <Button
          variant={activeStatusTab === "sent" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusChange("sent")}
        >
          Sent
        </Button>
        <Button
          variant={activeStatusTab === "paid" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusChange("paid")}
        >
          Paid
        </Button>
        <Button
          variant={activeStatusTab === "overdue" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusChange("overdue")}
        >
          Overdue
        </Button>
      </div>
    </div>
  );
}
