
-- Create business_transaction_categories table
CREATE TABLE public.business_transaction_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('expense', 'income', 'both')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.business_transaction_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage categories"
  ON public.business_transaction_categories
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed expense categories
INSERT INTO public.business_transaction_categories (name, type, sort_order) VALUES
  ('Supplies', 'expense', 1),
  ('Equipment', 'expense', 2),
  ('Maintenance', 'expense', 3),
  ('Medical', 'expense', 4),
  ('Processing Fees', 'expense', 5),
  ('Gifts', 'expense', 6),
  ('Meals/Entertainment', 'expense', 7),
  ('Product Sales', 'income', 8),
  ('Other Income', 'income', 9);

-- Create business_transactions table
CREATE TABLE public.business_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  type text NOT NULL CHECK (type IN ('expense', 'income')),
  date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  category text NOT NULL,
  vendor_or_source text,
  payment_method text,
  reference text,
  notes text,
  receipt_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.business_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all business transactions"
  ON public.business_transactions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create business transactions"
  ON public.business_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update business transactions"
  ON public.business_transactions
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete business transactions"
  ON public.business_transactions
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_business_transactions_updated_at
  BEFORE UPDATE ON public.business_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for common queries
CREATE INDEX idx_business_transactions_branch_date ON public.business_transactions (branch_id, date);
CREATE INDEX idx_business_transactions_type ON public.business_transactions (type);
