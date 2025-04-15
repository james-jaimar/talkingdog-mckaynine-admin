
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Invoice } from "@/types/invoice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader2, ArrowUpDown } from "lucide-react";

interface TransferInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

export function TransferInvoiceDialog({ open, onOpenChange, invoice }: TransferInvoiceDialogProps) {
  const queryClient = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  
  // Fetch all clients for the dropdown
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients-for-transfer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .order('last_name', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Transfer invoice mutation
  const transferMutation = useMutation({
    mutationFn: async ({ invoiceId, newClientId }: { invoiceId: string, newClientId: string }) => {
      // Update the client_id field on the invoice
      const { error } = await supabase
        .from('invoices')
        .update({ client_id: newClientId })
        .eq('id', invoiceId);
        
      if (error) throw error;
      
      return { invoiceId, newClientId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      if (invoice?.client?.id) {
        queryClient.invalidateQueries({ queryKey: ['client-invoices', invoice.client.id] });
      }
      
      if (selectedClientId) {
        queryClient.invalidateQueries({ queryKey: ['client-invoices', selectedClientId] });
      }
      
      toast.success("Invoice transferred successfully");
      onOpenChange(false);
      setSelectedClientId("");
    },
    onError: (error) => {
      console.error("Error transferring invoice:", error);
      toast.error("Failed to transfer invoice");
    }
  });

  // Handle the transfer action
  const handleTransfer = () => {
    if (!invoice || !selectedClientId) {
      toast.error("Please select a client to transfer the invoice to");
      return;
    }
    
    transferMutation.mutate({
      invoiceId: invoice.id,
      newClientId: selectedClientId
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" /> Transfer Invoice
          </DialogTitle>
          <DialogDescription>
            Transfer invoice {invoice?.invoice_number} to another client.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="current-client" className="text-right">
              Current Client
            </Label>
            <div id="current-client" className="col-span-3">
              <p className="text-sm font-medium">
                {invoice?.client ? `${invoice.client.first_name} ${invoice.client.last_name}` : "No client assigned"}
              </p>
              {invoice?.client?.email && (
                <p className="text-xs text-muted-foreground">{invoice.client.email}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-client" className="text-right">
              New Client
            </Label>
            <div className="col-span-3">
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
                disabled={isLoadingClients || transferMutation.isPending}
              >
                <SelectTrigger id="new-client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingClients ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading clients...
                    </div>
                  ) : clients.length > 0 ? (
                    clients.map(client => (
                      <SelectItem 
                        key={client.id} 
                        value={client.id}
                        disabled={client.id === invoice?.client?.id}
                      >
                        {client.first_name} {client.last_name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="text-center p-2 text-sm text-muted-foreground">
                      No clients found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={transferMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedClientId || transferMutation.isPending || selectedClientId === invoice?.client?.id}
          >
            {transferMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Transfer Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
