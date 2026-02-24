import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransactionCategories, useVendorSuggestions, type TransactionFormData, type BusinessTransaction } from "@/hooks/useBusinessTransactions";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'expense' | 'income';
  transaction?: BusinessTransaction | null;
  onSave: (data: TransactionFormData) => Promise<void>;
}

const PAYMENT_METHODS = ['Cash', 'Card', 'EFT'];

export function TransactionDialog({ open, onOpenChange, type, transaction, onSave }: TransactionDialogProps) {
  const { data: categories = [] } = useTransactionCategories(type);
  const { data: vendors = [] } = useVendorSuggestions();

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    amount: '',
    category: '',
    vendor_or_source: '',
    payment_method: '',
    reference: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');

  useEffect(() => {
    if (open) {
      if (transaction) {
        setFormData({
          date: transaction.date,
          description: transaction.description,
          amount: String(transaction.amount),
          category: transaction.category,
          vendor_or_source: transaction.vendor_or_source || '',
          payment_method: transaction.payment_method || '',
          reference: transaction.reference || '',
          notes: transaction.notes || '',
        });
        setVendorSearch(transaction.vendor_or_source || '');
      } else {
        setFormData({
          date: format(new Date(), 'yyyy-MM-dd'),
          description: '',
          amount: '',
          category: categories[0]?.name || '',
          vendor_or_source: '',
          payment_method: '',
          reference: '',
          notes: '',
        });
        setVendorSearch('');
      }
    }
  }, [open, transaction, categories]);

  const filteredVendors = useMemo(() => {
    if (!vendorSearch) return vendors.slice(0, 10);
    return vendors.filter(v => v.toLowerCase().includes(vendorSearch.toLowerCase())).slice(0, 10);
  }, [vendors, vendorSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.category) return;

    setSaving(true);
    try {
      await onSave({
        type,
        date: formData.date,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        vendor_or_source: formData.vendor_or_source || undefined,
        payment_method: formData.payment_method || undefined,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save transaction:', err);
    } finally {
      setSaving(false);
    }
  };

  const title = transaction
    ? `Edit ${type === 'expense' ? 'Expense' : 'Income'}`
    : `Add ${type === 'expense' ? 'Expense' : 'Income'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (R) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="e.g. Checkers - Liver Bread products"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={val => setFormData(prev => ({ ...prev, category: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={val => setFormData(prev => ({ ...prev, payment_method: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor / Source</Label>
            <Input
              id="vendor"
              placeholder="e.g. Checkers"
              value={vendorSearch}
              onChange={e => {
                setVendorSearch(e.target.value);
                setFormData(prev => ({ ...prev, vendor_or_source: e.target.value }));
              }}
              list="vendor-suggestions"
            />
            <datalist id="vendor-suggestions">
              {filteredVendors.map(v => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              placeholder="Receipt number, etc."
              value={formData.reference}
              onChange={e => setFormData(prev => ({ ...prev, reference: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes..."
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.description || !formData.amount || !formData.category}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {transaction ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
