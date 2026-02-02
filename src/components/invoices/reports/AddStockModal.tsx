import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface AddStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    quantity_added: number;
    purchase_date: string;
    unit_cost?: number | null;
    notes?: string | null;
  }) => void;
  isLoading?: boolean;
}

export const AddStockModal = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: AddStockModalProps) => {
  const [quantity, setQuantity] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [unitCost, setUnitCost] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantityNum = parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return;
    }

    onSubmit({
      quantity_added: quantityNum,
      purchase_date: purchaseDate,
      unit_cost: unitCost ? parseFloat(unitCost) : null,
      notes: notes || null,
    });

    // Reset form
    setQuantity("");
    setPurchaseDate(format(new Date(), "yyyy-MM-dd"));
    setUnitCost("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Starter Kit Stock</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g., 25"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Purchase Date *</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitCost">Unit Cost (optional)</Label>
            <Input
              id="unitCost"
              type="number"
              min="0"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="e.g., 150.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., From Shannon - February batch"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !quantity}>
              {isLoading ? "Adding..." : "Add Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
