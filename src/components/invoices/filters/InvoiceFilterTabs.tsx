
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { InvoiceStatus } from "@/types/invoice";
import { Dispatch, SetStateAction } from "react";

export interface InvoiceFilterTabsProps {
  onMonthFilterChange: Dispatch<SetStateAction<string>>;
  onStatusFilterChange: Dispatch<SetStateAction<InvoiceStatus | "all">>;
  showTermOption?: boolean; // Add this prop
}

export function InvoiceFilterTabs({ 
  onMonthFilterChange, 
  onStatusFilterChange,
  showTermOption = false // Default to false
}: InvoiceFilterTabsProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [activeStatusTab, setActiveStatusTab] = useState<InvoiceStatus | "all">("all");

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
        <TabsList className="w-full md:w-auto flex flex-wrap gap-1">
          <TabsTrigger 
            value="current" 
            onClick={() => handleTabChange("current")}
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Current Month
          </TabsTrigger>
          <TabsTrigger 
            value="next1" 
            onClick={() => handleTabChange("next1")}
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            Next Month
          </TabsTrigger>
          <TabsTrigger 
            value="prev1" 
            onClick={() => handleTabChange("prev1")}
            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
          >
            Last Month
          </TabsTrigger>
          <TabsTrigger 
            value="prev2" 
            onClick={() => handleTabChange("prev2")}
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
          >
            2 Months Ago
          </TabsTrigger>
          <TabsTrigger 
            value="prev3" 
            onClick={() => handleTabChange("prev3")}
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            3 Months Ago
          </TabsTrigger>
          {showTermOption && (
            <TabsTrigger 
              value="term" 
              onClick={() => handleTabChange("term")}
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              Current Term
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="all" 
            onClick={() => handleTabChange("all")}
            className="data-[state=active]:bg-gray-600 data-[state=active]:text-white"
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
