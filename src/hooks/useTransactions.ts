import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Transaction {
  id: string;
  user_id: string;
  user_name: string;
  amount: number;
  upi_id: string;
  account_name: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'withdrawal' | 'credit';
  created_at: string;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { user, isAdmin } = useAuth();

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTransactions(data as unknown as Transaction[]);
  };

  useEffect(() => {
    if (user) fetchTransactions();

    const channel = supabase
      .channel('txn-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const addTransaction = async (txn: Omit<Transaction, 'id' | 'created_at'>) => {
    await supabase.from('transactions').insert(txn as any);
    await fetchTransactions();
  };

  const updateStatus = async (id: string, status: Transaction['status']) => {
    await supabase.from('transactions').update({ status } as any).eq('id', id);
    await fetchTransactions();
  };

  return { transactions, addTransaction, updateStatus, refresh: fetchTransactions };
}
