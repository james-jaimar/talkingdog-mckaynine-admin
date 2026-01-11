import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarDays, Loader2 } from "lucide-react";

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

interface AllocateToMonthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (franchiseMonth: string | null) => Promise<void>;
  isLoading?: boolean;
}

export function AllocateToMonthDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isLoading = false,
}: AllocateToMonthDialogProps) {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<string>("01");
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleConfirm = async () => {
    const franchiseMonth = `${selectedYear}-${selectedMonth}`;
    await onConfirm(franchiseMonth);
  };

  const handleClearAllocation = async () => {
    await onConfirm(null);
  };

  const getMonthLabel = () => {
    const month = MONTHS.find((m) => m.value === selectedMonth);
    return month ? `${month.label} ${selectedYear}` : "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Allocate to Franchise Month
          </DialogTitle>
          <DialogDescription>
            Allocate {selectedCount} selected invoice{selectedCount !== 1 ? "s" : ""} to a
            specific month for franchise reporting purposes. This does not change the
            invoice date.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            Selected invoices will appear in the <strong>{getMonthLabel()}</strong>{" "}
            franchise report.
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClearAllocation}
            disabled={isLoading}
            className="text-muted-foreground"
          >
            Clear Allocation
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Allocate to {getMonthLabel()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
