-- Create a junction table to support handlers belonging to multiple branches
CREATE TABLE public.client_branches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id, branch_id)
);

-- Enable RLS
ALTER TABLE public.client_branches ENABLE ROW LEVEL SECURITY;

-- Create policies for client_branches
CREATE POLICY "Anyone can view client branches" 
ON public.client_branches 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert client branches" 
ON public.client_branches 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete client branches" 
ON public.client_branches 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX idx_client_branches_client_id ON public.client_branches(client_id);
CREATE INDEX idx_client_branches_branch_id ON public.client_branches(branch_id);

-- Backfill existing data: add current branch_id to junction table for all clients with a branch
INSERT INTO public.client_branches (client_id, branch_id)
SELECT id, branch_id 
FROM public.clients 
WHERE branch_id IS NOT NULL
ON CONFLICT (client_id, branch_id) DO NOTHING;