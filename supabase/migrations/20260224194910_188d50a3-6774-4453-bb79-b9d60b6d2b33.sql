
-- Create admin_payments table (mirrors franchise_payments pattern)
CREATE TABLE public.admin_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  month integer NOT NULL,
  year integer NOT NULL,
  total_admin_fees numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_date timestamp with time zone,
  payment_method text,
  payment_reference text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(branch_id, month, year)
);

-- Enable RLS
ALTER TABLE public.admin_payments ENABLE ROW LEVEL SECURITY;

-- Admin-only full access (same pattern as franchise_payments)
CREATE POLICY "Admins can view all admin payments"
  ON public.admin_payments FOR SELECT USING (true);

CREATE POLICY "Admins can create admin payments"
  ON public.admin_payments FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update admin payments"
  ON public.admin_payments FOR UPDATE USING (true);

CREATE POLICY "Admins can delete admin payments"
  ON public.admin_payments FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_admin_payments_updated_at
  BEFORE UPDATE ON public.admin_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
