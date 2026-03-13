import { useState } from 'react';
import AdminBottomNav from '@/components/AdminBottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Gift, Clock, Coins } from 'lucide-react';
import { useRewards } from '@/hooks/useRewards';
import { toast } from 'sonner';

export default function AdminRewards() {
  const { rewards, createReward, deleteReward } = useRewards();
  const [watchTime, setWatchTime] = useState('');
  const [coinAmount, setCoinAmount] = useState('');

  const handleCreate = async () => {
    const time = parseInt(watchTime);
    const coins = parseInt(coinAmount);
    if (!time || time <= 0) return toast.error('Enter valid watch time');
    if (!coins || coins <= 0) return toast.error('Enter valid coin amount');

    await createReward(time, coins);
    setWatchTime('');
    setCoinAmount('');
    toast.success('Reward created!');
  };

  const handleDelete = async (id: string) => {
    await deleteReward(id);
    toast.success('Reward deleted');
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold">Create Rewards</h1>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Create form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus size={18} /> New Reward
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Watch Time (minutes)</Label>
              <Input
                type="number"
                placeholder="e.g. 60 for 1 hour"
                value={watchTime}
                onChange={e => setWatchTime(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Coin Amount</Label>
              <Input
                type="number"
                placeholder="e.g. 50"
                value={coinAmount}
                onChange={e => setCoinAmount(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate} className="w-full gap-2">
              <Plus size={16} /> Create Reward
            </Button>
          </CardContent>
        </Card>

        {/* Existing rewards */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Active Rewards ({rewards.length})
          </h2>
          {rewards.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Gift size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No rewards yet. Create one above!</p>
              </CardContent>
            </Card>
          ) : (
            rewards.map(reward => (
              <Card key={reward.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Gift size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock size={12} /> {formatTime(reward.watch_time_minutes)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Coins size={12} /> +{reward.coin_amount} coins
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(reward.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
      <AdminBottomNav />
    </div>
  );
}
