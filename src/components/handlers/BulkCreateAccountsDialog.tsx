import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useBulkHandlerAccounts } from "@/hooks/useBulkHandlerAccounts";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BulkCreateAccountsDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'preview' | 'confirm' | 'running' | 'complete'>('preview');
  const { preview, createAllAccounts } = useBulkHandlerAccounts();

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setStep('preview');
      await preview.refetch();
    }
  };

  const handleConfirm = () => {
    setStep('confirm');
  };

  const handleExecute = async () => {
    setStep('running');
    await createAllAccounts.mutateAsync();
    setStep('complete');
  };

  const handleClose = () => {
    setOpen(false);
    setStep('preview');
  };

  const result = createAllAccounts.data;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Bulk Create Accounts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Create Handler Accounts</DialogTitle>
          <DialogDescription>
            Create login accounts for all handlers without portal access
          </DialogDescription>
        </DialogHeader>

        {step === 'preview' && (
          <>
            {preview.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2">Loading handlers without accounts...</span>
              </div>
            ) : preview.error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {preview.error instanceof Error ? preview.error.message : 'Failed to load preview'}
                </AlertDescription>
              </Alert>
            ) : preview.data && preview.data.length > 0 ? (
              <>
                <div className="mb-2">
                  <Badge variant="secondary" className="text-base">
                    {preview.data.length} handlers without accounts
                  </Badge>
                </div>
                <ScrollArea className="h-[300px] border rounded-md p-4">
                  <div className="space-y-2">
                    {preview.data.map((handler) => (
                      <div key={handler.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span className="font-medium">{handler.name}</span>
                        <span className="text-muted-foreground text-sm">{handler.email}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>All handlers already have accounts!</p>
              </div>
            )}
          </>
        )}

        {step === 'confirm' && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Are you sure?</strong> This will create login accounts for{' '}
              <strong>{preview.data?.length}</strong> handlers. 
              Each handler will be assigned a randomly generated password.
              <br /><br />
              <em>Note: Welcome emails are NOT sent automatically. You can send them later from each handler's profile.</em>
            </AlertDescription>
          </Alert>
        )}

        {step === 'running' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Creating accounts...</p>
            <p className="text-sm text-muted-foreground">This may take a few minutes</p>
          </div>
        )}

        {step === 'complete' && result && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{result.summary.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.summary.created}</div>
                <div className="text-sm text-green-600">Created</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{result.summary.skipped}</div>
                <div className="text-sm text-amber-600">Skipped</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{result.summary.failed}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>

            <ScrollArea className="h-[250px] border rounded-md p-4">
              <div className="space-y-2">
                {result.results.map((r, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      {r.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : r.skipped ? (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{r.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {r.success ? 'Created' : r.skipReason || r.error}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          {step === 'preview' && preview.data && preview.data.length > 0 && (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleConfirm}>
                Continue
              </Button>
            </>
          )}
          {step === 'preview' && (!preview.data || preview.data.length === 0) && !preview.isLoading && (
            <Button onClick={handleClose}>Close</Button>
          )}
          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setStep('preview')}>Back</Button>
              <Button onClick={handleExecute} variant="destructive">
                Create {preview.data?.length} Accounts
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
