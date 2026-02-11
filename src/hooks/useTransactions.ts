import { useState } from 'react';

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  upiId: string;
  accountName: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'withdrawal' | 'credit';
  createdAt: string;
}

function getAll(): Transaction[] {
  const stored = localStorage.getItem('transactions');
  return stored ? JSON.parse(stored) : [];
}

function save(txns: Transaction[]) {
  localStorage.setItem('transactions', JSON.stringify(txns));
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(getAll);

  const addTransaction = (txn: Omit<Transaction, 'id' | 'createdAt'>) => {
    const all = getAll();
    const newTxn: Transaction = {
      ...txn,
      id: Math.random().toString(36).substring(2, 12),
      createdAt: new Date().toISOString(),
    };
    all.push(newTxn);
    save(all);
    setTransactions(all);
  };

  const updateStatus = (id: string, status: Transaction['status']) => {
    const all = getAll();
    const txn = all.find(t => t.id === id);
    if (txn) {
      txn.status = status;
      save(all);
      setTransactions([...all]);
    }
  };

  const refresh = () => setTransactions(getAll());

  return { transactions, addTransaction, updateStatus, refresh };
}
