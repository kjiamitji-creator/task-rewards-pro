import { Gift, Trophy, Clock, Coins, Check } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRewards } from '@/hooks/useRewards';
import { toast } from 'sonner';

export default function Rewards() {
  const { rewards, progress, loading, claimReward } = useRewards();

  const handleClaim = async (rewardId: string, coins: number) => {
    const success = await claimReward(rewardId);
    if (success) {
      toast.success(`🎉 ${coins} coins claimed and added to your wallet!`);
    } else {
      toast.error('Could not claim reward');
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const formatSeconds = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Trophy size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Rewards</h1>
          <p className="text-sm text-muted-foreground">Watch videos & earn bonus coins!</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5 h-32" />
              </Card>
            ))}
          </div>
        ) : rewards.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Gift size={40} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium">No rewards available yet</p>
              <p className="text-xs mt-1">Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rewards.map((reward) => {
              const prog = progress.find(p => p.reward_id === reward.id);
              const watchedSeconds = prog?.watch_seconds || 0;
              const requiredSeconds = reward.watch_time_minutes * 60;
              const percentage = Math.min((watchedSeconds / requiredSeconds) * 100, 100);
              const isComplete = watchedSeconds >= requiredSeconds;
              const isClaimed = prog?.claimed || false;

              return (
                <Card
                  key={reward.id}
                  className={`overflow-hidden transition-all border ${
                    isClaimed
                      ? 'border-green-500/30 bg-green-500/5'
                      : isComplete
                      ? 'border-primary/40 shadow-md shadow-primary/10'
                      : 'border-border'
                  }`}
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isClaimed ? 'bg-green-500/10' : 'bg-primary/10'
                        }`}>
                          {isClaimed ? (
                            <Check size={20} className="text-green-500" />
                          ) : (
                            <Gift size={20} className="text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            Watch {formatTime(reward.watch_time_minutes)}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock size={12} className="text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatSeconds(watchedSeconds)} / {formatTime(reward.watch_time_minutes)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
                        <Coins size={14} className="text-primary" />
                        <span className="text-sm font-bold text-primary">+{reward.coin_amount}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <Progress value={percentage} className="h-3" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{Math.round(percentage)}% complete</span>
                        {!isClaimed && !isComplete && (
                          <span>{formatTime(Math.max(0, Math.ceil((requiredSeconds - watchedSeconds) / 60)))} left</span>
                        )}
                      </div>
                    </div>

                    {/* Claim button */}
                    {isClaimed ? (
                      <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500/10 text-green-600 text-sm font-medium">
                        <Check size={16} />
                        Claimed!
                      </div>
                    ) : isComplete ? (
                      <Button
                        onClick={() => handleClaim(reward.id, reward.coin_amount)}
                        className="w-full gap-2 animate-pulse"
                      >
                        <Gift size={16} />
                        Claim {reward.coin_amount} Coins
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
