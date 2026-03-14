import { useState, useEffect } from 'react';
import AdminBottomNav from '@/components/AdminBottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  user_id: string;
  user_name: string;
  amount: number;
  upi_id: string | null;
  account_name: string | null;
  status: string;
  type: string;
  created_at: string;
}

export default function AdminPayments() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTransactions(data as unknown as Transaction[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
    const channel = supabase
      .channel('admin-payments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchTransactions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleApprove = async (txn: Transaction) => {
    setActionLoading(txn.id);
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'approved' } as any)
      .eq('id', txn.id);
    if (error) {
      toast.error('Failed: ' + error.message);
    } else {
      toast.success(`Payment of ${txn.amount} coins approved for ${txn.user_name}`);
    }
    await fetchTransactions();
    setActionLoading(null);
  };

  const handleReject = async (txn: Transaction) => {
    setActionLoading(txn.id);
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'rejected' } as any)
      .eq('id', txn.id);
    if (error) {
      toast.error('Failed: ' + error.message);
      setActionLoading(null);
      return;
    }
    // Refund coins back to user's wallet
    const { data: profileData } = await supabase
      .from('profiles')
      .select('coins, total_withdrawn')
      .eq('user_id', txn.user_id)
      .maybeSingle();
    if (profileData) {
      await supabase.from('profiles').update({
        coins: (profileData as any).coins + txn.amount,
        total_withdrawn: Math.max(0, (profileData as any).total_withdrawn - txn.amount),
      } as any).eq('user_id', txn.user_id);
    }
    toast.success(`Payment rejected. ${txn.amount} coins refunded to ${txn.user_name}'s wallet`);
    await fetchTransactions();
    setActionLoading(null);
  };

  const pending = transactions.filter(t => t.status === 'pending');
  const approved = transactions.filter(t => t.status === 'approved');
  const rejected = transactions.filter(t => t.status === 'rejected');

  const TxnCard = ({ txn }: { txn: Transaction }) => (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium">{txn.user_name}</p>
            <p className="text-sm text-muted-foreground">{txn.upi_id} · {txn.account_name}</p>
            <p className="text-sm font-semibold">{txn.amount} coins</p>
            <p className="text-xs text-muted-foreground">{new Date(txn.created_at).toLocaleString()}</p>
          </div>
          <Badge variant={txn.status === 'approved' ? 'default' : txn.status === 'rejected' ? 'destructive' : 'secondary'}>{txn.status}</Badge>
        </div>
        {txn.status === 'pending' && (
          <div className="flex gap-2">
            <Button size="sm" disabled={actionLoading === txn.id} onClick={() => handleApprove(txn)}>
              {actionLoading === txn.id ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Approve
            </Button>
            <Button size="sm" variant="destructive" disabled={actionLoading === txn.id} onClick={() => handleReject(txn)}>
              {actionLoading === txn.id ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const EmptyState = () => <p className="text-center text-muted-foreground py-8">No transactions</p>;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4"><h1 className="text-xl font-bold">Payments</h1></header>
      <main className="max-w-lg mx-auto px-4 py-6">
        <Tabs defaultValue="requests">
          <TabsList className="w-full">
            <TabsTrigger value="requests" className="flex-1">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved" className="flex-1">Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1">Rejected ({rejected.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="requests" className="space-y-3 mt-4">
            {pending.length ? pending.map(t => <TxnCard key={t.id} txn={t} />) : <EmptyState />}
          </TabsContent>
          <TabsContent value="approved" className="space-y-3 mt-4">
            {approved.length ? approved.map(t => <TxnCard key={t.id} txn={t} />) : <EmptyState />}
          </TabsContent>
          <TabsContent value="rejected" className="space-y-3 mt-4">
            {rejected.length ? rejected.map(t => <TxnCard key={t.id} txn={t} />) : <EmptyState />}
          </TabsContent>
        </Tabs>
      </main>
      <AdminBottomNav />
    </div>
  );
}
