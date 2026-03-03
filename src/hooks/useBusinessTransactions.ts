import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBranch } from '@/context/BranchContext';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface BusinessTransaction {
  id: string;
  branch_id: string;
  type: 'expense' | 'income';
  date: string;
  description: string;
  amount: number;
  category: string;
  vendor_or_source: string | null;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
  receipt_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: 'expense' | 'income' | 'both';
  is_active: boolean;
  sort_order: number;
}

export interface TransactionFormData {
  type: 'expense' | 'income';
  date: string;
  description: string;
  amount: number;
  category: string;
  vendor_or_source?: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
  receipt_url?: string;
}

interface UseBusinessTransactionsParams {
  month: number;
  year: number;
  type?: 'expense' | 'income';
  category?: string;
}

export function useBusinessTransactions({ month, year, type, category }: UseBusinessTransactionsParams) {
  const { currentBranch } = useBranch();

  return useQuery({
    queryKey: ['business-transactions', currentBranch?.id, month, year, type, category],
    queryFn: async () => {
      if (!currentBranch?.id) return [];

      const monthStart = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');

      let query = supabase
        .from('business_transactions')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false });

      if (type) query = query.eq('type', type);
      if (category) query = query.eq('category', category);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as BusinessTransaction[];
    },
    enabled: !!currentBranch?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTransactionCategories(type?: 'expense' | 'income') {
  return useQuery({
    queryKey: ['business-transaction-categories', type],
    queryFn: async () => {
      let query = supabase
        .from('business_transaction_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (type) {
        query = query.or(`type.eq.${type},type.eq.both`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as TransactionCategory[];
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useAllTransactionCategories() {
  return useQuery({
    queryKey: ['business-transaction-categories-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_transaction_categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return (data || []) as TransactionCategory[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['business-transaction-categories'] });
    queryClient.invalidateQueries({ queryKey: ['business-transaction-categories-all'] });
  };

  const createCategory = useMutation({
    mutationFn: async (data: { name: string; type: string; sort_order: number }) => {
      const { data: result, error } = await supabase
        .from('business_transaction_categories')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: invalidate,
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; type?: string; sort_order?: number; is_active?: boolean }) => {
      const { data: result, error } = await supabase
        .from('business_transaction_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: invalidate,
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('business_transaction_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createCategory, updateCategory, deleteCategory };
}

export function useVendorSuggestions() {
  const { currentBranch } = useBranch();

  return useQuery({
    queryKey: ['vendor-suggestions', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];

      const { data, error } = await supabase
        .from('business_transactions')
        .select('vendor_or_source')
        .eq('branch_id', currentBranch.id)
        .not('vendor_or_source', 'is', null)
        .limit(500);

      if (error) throw error;

      const unique = [...new Set((data || []).map(d => d.vendor_or_source).filter(Boolean))];
      return unique.sort() as string[];
    },
    enabled: !!currentBranch?.id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useTransactionMutations() {
  const { currentBranch } = useBranch();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['business-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['vendor-suggestions'] });
  };

  const createTransaction = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      if (!currentBranch?.id) throw new Error('No branch selected');

      const { data: user } = await supabase.auth.getUser();

      const { data: result, error } = await supabase
        .from('business_transactions')
        .insert({
          branch_id: currentBranch.id,
          type: data.type,
          date: data.date,
          description: data.description,
          amount: data.amount,
          category: data.category,
          vendor_or_source: data.vendor_or_source || null,
          payment_method: data.payment_method || null,
          reference: data.reference || null,
          notes: data.notes || null,
          receipt_url: data.receipt_url || null,
          created_by: user?.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: invalidate,
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...data }: TransactionFormData & { id: string }) => {
      const { data: result, error } = await supabase
        .from('business_transactions')
        .update({
          type: data.type,
          date: data.date,
          description: data.description,
          amount: data.amount,
          category: data.category,
          vendor_or_source: data.vendor_or_source || null,
          payment_method: data.payment_method || null,
          reference: data.reference || null,
          notes: data.notes || null,
          receipt_url: data.receipt_url || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: invalidate,
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('business_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createTransaction, updateTransaction, deleteTransaction };
}
