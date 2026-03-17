import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { useTransactions } from '@/hooks/useTransactions';
import { useAds } from '@/hooks/useAds';
import { VideoAdOverlay, preloadVideoAds } from '@/components/VideoAdOverlay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Coins, ArrowDownToLine, History, Save, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Wallet() {
  const { user, profile, deductCoins, refreshProfile } = useAuth();
  const { settings } = useSettings();
  const { transactions } = useTransactions();
  const { videoAds, trackAdEvent } = useAds();
  
  const [savedUpi, setSavedUpi] = useState('');
  const [savedName, setSavedName] = useState('');
  const [savedMobile, setSavedMobile] = useState('');
  const [editingUpi, setEditingUpi] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [open, setOpen] = useState(false);
  const [showVideoAd, setShowVideoAd] = useState(false);
  const [pendingWithdraw, setPendingWithdraw] = useState(false);

  useEffect(() => {
    if (videoAds.length > 0) preloadVideoAds(videoAds);
  }, [videoAds]);

  useEffect(() => {
    if (!user) return;
    const loadUpiDetails = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('upi_id, account_name, mobile_number')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setSavedUpi(data.upi_id || '');
        setSavedName(data.account_name || '');
        setSavedMobile(data.mobile_number || '');
      }
    };
    loadUpiDetails();
  }, [user]);

  if (!profile || !user) return null;

  const currencyAmount = (profile.coins * settings.coin_value).toFixed(2);
  const userTxns = transactions.filter(t => t.user_id === user.id);
  const hasUpiSaved = savedUpi && savedName && savedMobile;

  const handleSaveUpi = async () => {
    if (!upiId.trim() || !accountName.trim() || !mobileNumber.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    await supabase.from('profiles').update({
      upi_id: upiId, account_name: accountName, mobile_number: mobileNumber,
    }).eq('user_id', user.id);
    setSavedUpi(upiId);
    setSavedName(accountName);
    setSavedMobile(mobileNumber);
    setEditingUpi(false);
    toast.success('UPI details saved!');
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (amount < settings.min_withdrawal) { toast.error(`Minimum withdrawal: ${settings.min_withdrawal} coins`); return; }
    if (amount > profile.coins) { toast.error('Amount is not available in your balance'); return; }
    if (!hasUpiSaved) { toast.error('Save your UPI details first'); return; }

    // Show video ad before withdrawal if available
    const walletVideoAds = videoAds.filter(a => a.page === 'wallet');
    if (walletVideoAds.length > 0 && !pendingWithdraw) {
      setPendingWithdraw(true);
      setShowVideoAd(true);
      return;
    }

    await executeWithdraw(amount);
  };

  const executeWithdraw = async (amount?: number) => {
    const amt = amount || parseInt(withdrawAmount);
    // Instantly deduct coins
    await deductCoins(amt);
    // Insert transaction
    await supabase.from('transactions').insert({
      user_id: user.id, user_name: profile.name, amount: amt,
      upi_id: savedUpi, account_name: savedName, status: 'pending', type: 'withdrawal',
    });
    await refreshProfile();
    setOpen(false);
    setWithdrawAmount('');
    setPendingWithdraw(false);
    toast.success('Withdrawal request submitted!');
  };

  const handleVideoAdComplete = () => {
    setShowVideoAd(false);
    if (pendingWithdraw) {
      executeWithdraw();
    }
  };

  const statusVariant = (s: string) =>
    s === 'approved' ? 'default' : s === 'rejected' ? 'destructive' : 'secondary';

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      {showVideoAd && (
        <VideoAdOverlay ads={videoAds} page="wallet" onComplete={handleVideoAdComplete} trackEvent={trackAdEvent} />
      )}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Balance Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground text-center">
            <Coins size={32} className="mx-auto mb-2 opacity-90" />
            <p className="text-5xl font-extrabold tracking-tight">{profile.coins}</p>
            <p className="text-xs font-medium opacity-70 mt-1">coins</p>
            <div className="mt-3 bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
              <p className="text-lg font-bold">{settings.currency} {currencyAmount}</p>
            </div>
          </div>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Payment Details</h3>
              {hasUpiSaved && !editingUpi && (
                <Button variant="ghost" size="sm" onClick={() => {
                  setUpiId(savedUpi); setAccountName(savedName); setMobileNumber(savedMobile); setEditingUpi(true);
                }}>
                  <Pencil size={14} className="mr-1" /> Edit
                </Button>
              )}
            </div>
            {hasUpiSaved && !editingUpi ? (
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">UPI ID:</span> {savedUpi}</p>
                <p><span className="text-muted-foreground">Name:</span> {savedName}</p>
                <p><span className="text-muted-foreground">Mobile:</span> {savedMobile}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Input placeholder="UPI ID (e.g. name@upi)" value={upiId} onChange={e => setUpiId(e.target.value)} />
                <Input placeholder="Account Holder Name" value={accountName} onChange={e => setAccountName(e.target.value)} />
                <Input placeholder="Mobile Number" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} />
                <Button onClick={handleSaveUpi} className="w-full gap-2"><Save size={16} /> Save Details</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdraw */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2" disabled={!hasUpiSaved}>
              <ArrowDownToLine size={18} /> {hasUpiSaved ? 'Withdraw' : 'Save UPI details first'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Withdraw Coins</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>UPI: {savedUpi}</p>
                <p>Name: {savedName}</p>
              </div>
              <Input type="number" placeholder="Enter coin amount" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Minimum: {settings.min_withdrawal} coins · Balance: {profile.coins} coins</p>
                {withdrawAmount && parseInt(withdrawAmount) > 0 && (
                  <p className="font-medium text-foreground">
                    ≈ {settings.currency} {(parseInt(withdrawAmount) * settings.coin_value).toFixed(2)}
                  </p>
                )}
              </div>
              {withdrawAmount && parseInt(withdrawAmount) > 0 && parseInt(withdrawAmount) < settings.min_withdrawal && (
                <p className="text-sm text-destructive font-medium">Amount is not enough for withdrawal</p>
              )}
              {withdrawAmount && parseInt(withdrawAmount) > profile.coins && (
                <p className="text-sm text-destructive font-medium">Amount is not available in your balance</p>
              )}
              <Button onClick={handleWithdraw} className="w-full">Submit Request</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Transaction History */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2"><History size={18} /> Transaction History</h3>
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
                      <p className="font-bold text-lg">{t.amount} <span className="text-sm font-normal text-muted-foreground">coins</span></p>
                      <p className="text-xs text-muted-foreground">≈ {settings.currency} {(t.amount * settings.coin_value).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(t.created_at).toLocaleDateString()} · {t.upi_id}</p>
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
