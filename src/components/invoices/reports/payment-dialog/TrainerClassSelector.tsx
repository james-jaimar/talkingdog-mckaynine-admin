
import { Checkbox } from "@/components/ui/checkbox";
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";

interface TrainerClassSelectorProps {
  classes: TrainerClassDetail[];
  selectedIds: string[];
  onToggleClass: (id: string) => void;
  onToggleAll: () => void;
  isDisabled?: boolean;
}

export function TrainerClassSelector({
  classes,
  selectedIds,
  onToggleClass,
  onToggleAll,
  isDisabled = false
}: TrainerClassSelectorProps) {
  // Filter unpaid classes
  const unpaidClasses = classes.filter(c => !c.isPaid);
  const unpaidCount = unpaidClasses.length;
  
  // Check if all unpaid classes are selected
  const allUnpaidSelected = unpaidClasses.length > 0 && 
    unpaidClasses.every(cls => selectedIds.includes(cls.scheduleId));
  
  // Calculate total potential amount
  const totalPotentialAmount = unpaidClasses.reduce(
    (sum, cls) => sum + cls.potentialRevenue, 0
  );

  if (classes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No classes found for this trainer</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unpaidCount > 0 && (
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="select-all"
              checked={allUnpaidSelected} 
              onCheckedChange={() => onToggleAll()} 
              disabled={isDisabled}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select all unpaid ({unpaidCount})
            </label>
          </div>
          <span className="text-sm font-medium">
            R {totalPotentialAmount.toFixed(2)}
          </span>
        </div>
      )}
      
      <div className="space-y-2">
        {classes.map((cls) => {
          const isSelected = selectedIds.includes(cls.scheduleId);
          const isDisabledClass = isDisabled || cls.isPaid;
          
          return (
            <div 
              key={cls.scheduleId}
              className={`p-3 rounded-md border ${
                cls.isPaid ? 'bg-slate-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="pt-0.5">
                    <Checkbox 
                      id={`class-${cls.scheduleId}`}
                      checked={isSelected} 
                      onCheckedChange={() => !isDisabledClass && onToggleClass(cls.scheduleId)}
                      disabled={isDisabledClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`class-${cls.scheduleId}`} 
                      className="block font-medium cursor-pointer"
                    >
                      {cls.className}
                    </label>
                    <div className="text-sm text-muted-foreground">
                      {cls.classDate ? format(new Date(cls.classDate), 'PPP') : 'No date'} • 
                      {cls.bookings} {cls.bookings === 1 ? 'booking' : 'bookings'}
                    </div>
                    {cls.isPaid && (
                      <span className="inline-block mt-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        Already paid
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    R {cls.potentialRevenue.toFixed(2)}
                  </div>
                  {cls.revenue !== cls.potentialRevenue && cls.revenue > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Paid: R {cls.revenue.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
