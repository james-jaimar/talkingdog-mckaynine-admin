-- Create a table to track monthly franchise payments
CREATE TABLE public.franchise_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  total_course_fees NUMERIC NOT NULL DEFAULT 0,
  total_enrollment_fees NUMERIC NOT NULL DEFAULT 0,
  total_franchise_fees NUMERIC NOT NULL DEFAULT 0,
  total_due NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_reference TEXT,
  payment_method TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(branch_id, month, year)
);

-- Enable RLS
ALTER TABLE public.franchise_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all franchise payments" 
ON public.franchise_payments 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can create franchise payments" 
ON public.franchise_payments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update franchise payments" 
ON public.franchise_payments 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can delete franchise payments" 
ON public.franchise_payments 
FOR DELETE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_franchise_payments_updated_at
BEFORE UPDATE ON public.franchise_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for efficient lookups
CREATE INDEX idx_franchise_payments_branch_period ON public.franchise_payments(branch_id, year, month);