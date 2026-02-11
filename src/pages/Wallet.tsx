import { useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { useTransactions } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Coins, ArrowDownToLine, History } from 'lucide-react';
import { toast } from 'sonner';

export default function Wallet() {
  const { user, deductCoins } = useAuth();
  const { settings } = useSettings();
  const { transactions, addTransaction } = useTransactions();
  const [upiId, setUpiId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const currencyAmount = (user.coins * settings.coinValue).toFixed(2);
  const userTxns = transactions.filter(t => t.userId === user.id);

  const handleWithdraw = () => {
    if (user.coins < settings.minWithdrawal) {
      toast.error(`Minimum withdrawal: ${settings.minWithdrawal} coins`);
      return;
    }
    if (!upiId.trim() || !accountName.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    addTransaction({
      userId: user.id,
      userName: user.name,
      amount: user.coins,
      upiId,
      accountName,
      status: 'pending',
      type: 'withdrawal',
    });
    deductCoins(user.coins);
    setOpen(false);
    setUpiId('');
    setAccountName('');
    toast.success('Withdrawal request submitted!');
  };

  const statusVariant = (s: string) =>
    s === 'approved' ? 'default' : s === 'rejected' ? 'destructive' : 'secondary';

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground text-center">
            <Coins size={36} className="mx-auto mb-2 opacity-90" />
            <p className="text-4xl font-bold">{user.coins}</p>
            <p className="text-sm opacity-80 mt-1">
              ≈ {settings.currency} {currencyAmount}
            </p>
          </div>
          <CardContent className="p-4">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <ArrowDownToLine size={18} /> Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Withdraw Coins</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="UPI ID (e.g. name@upi)"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                  />
                  <Input
                    placeholder="Account Holder Name"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimum: {settings.minWithdrawal} coins · Balance: {user.coins} coins
                  </p>
                  <Button onClick={handleWithdraw} className="w-full">
                    Submit Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <History size={18} /> Transaction History
          </h3>
          {userTxns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {userTxns.map(t => (
                <Card key={t.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{t.amount} coins</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString()} · {t.upiId}
                      </p>
                    </div>
                    <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
