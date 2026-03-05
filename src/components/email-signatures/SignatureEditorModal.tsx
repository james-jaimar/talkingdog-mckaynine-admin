import { useState, useEffect } from "react";
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
import { EmailSignature, EmailSignatureInput } from "@/hooks/useEmailSignatures";

interface SignatureEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signature: EmailSignature | null;
  onSave: (data: EmailSignatureInput) => Promise<void>;
  isSaving: boolean;
}

const emptyForm: EmailSignatureInput = {
  name: "",
  title: "",
  phone: "",
  company: "",
  email: "",
  website: "www.mckaynine.co.za",
  is_default: false,
};

export function SignatureEditorModal({ open, onOpenChange, signature, onSave, isSaving }: SignatureEditorModalProps) {
  const [form, setForm] = useState<EmailSignatureInput>(emptyForm);

  useEffect(() => {
    if (signature) {
      setForm({
        name: signature.name,
        title: signature.title,
        phone: signature.phone,
        company: signature.company || "",
        email: signature.email,
        website: signature.website,
        is_default: signature.is_default,
      });
    } else {
      setForm(emptyForm);
    }
  }, [signature, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
    onOpenChange(false);
  };

  const update = (field: keyof EmailSignatureInput, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{signature ? "Edit Signature" : "New Signature"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sig-name">Name</Label>
            <Input id="sig-name" value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="Ady Hawkins" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sig-title">Title</Label>
            <Input id="sig-title" value={form.title} onChange={(e) => update("title", e.target.value)} required placeholder="McKaynine - Delta" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sig-phone">Phone</Label>
            <Input id="sig-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} required placeholder="083 400 2987" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sig-company">Company (optional)</Label>
            <Input id="sig-company" value={form.company || ""} onChange={(e) => update("company", e.target.value)} placeholder="Company name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sig-email">Email</Label>
            <Input id="sig-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required placeholder="delta@mckaynine.co.za" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sig-website">Website</Label>
            <Input id="sig-website" value={form.website} onChange={(e) => update("website", e.target.value)} required placeholder="www.mckaynine.co.za" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : signature ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
