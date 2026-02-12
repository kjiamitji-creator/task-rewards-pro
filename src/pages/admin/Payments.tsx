import AdminBottomNav from '@/components/AdminBottomNav';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminPayments() {
  const { transactions, updateStatus } = useTransactions();
  const requests = transactions.filter(t => t.status === 'pending');
  const approved = transactions.filter(t => t.status === 'approved');
  const rejected = transactions.filter(t => t.status === 'rejected');

  const TxnCard = ({ txn }: { txn: any }) => (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium">{txn.user_name}</p>
            <p className="text-sm text-muted-foreground">{txn.upi_id} · {txn.account_name}</p>
            <p className="text-sm font-semibold">{txn.amount} coins</p>
          </div>
          <Badge variant={txn.status === 'approved' ? 'default' : txn.status === 'rejected' ? 'destructive' : 'secondary'}>{txn.status}</Badge>
        </div>
        <div className="flex gap-2">
          {txn.status !== 'approved' && <Button size="sm" onClick={() => updateStatus(txn.id, 'approved')}>Approve</Button>}
          {txn.status !== 'rejected' && <Button size="sm" variant="destructive" onClick={() => updateStatus(txn.id, 'rejected')}>Reject</Button>}
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = () => <p className="text-center text-muted-foreground py-8">No transactions</p>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4"><h1 className="text-xl font-bold">Payments</h1></header>
      <main className="max-w-lg mx-auto px-4 py-6">
        <Tabs defaultValue="requests">
          <TabsList className="w-full">
            <TabsTrigger value="requests" className="flex-1">Requests ({requests.length})</TabsTrigger>
            <TabsTrigger value="approved" className="flex-1">Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1">Rejected ({rejected.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="requests" className="space-y-3 mt-4">{requests.length ? requests.map(t => <TxnCard key={t.id} txn={t} />) : <EmptyState />}</TabsContent>
          <TabsContent value="approved" className="space-y-3 mt-4">{approved.length ? approved.map(t => <TxnCard key={t.id} txn={t} />) : <EmptyState />}</TabsContent>
          <TabsContent value="rejected" className="space-y-3 mt-4">{rejected.length ? rejected.map(t => <TxnCard key={t.id} txn={t} />) : <EmptyState />}</TabsContent>
        </Tabs>
      </main>
      <AdminBottomNav />
    </div>
  );
}
