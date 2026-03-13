import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Reward {
  id: string;
  watch_time_minutes: number;
  coin_amount: number;
  active: boolean;
  created_at: string;
}

export interface UserRewardProgress {
  id: string;
  user_id: string;
  reward_id: string;
  watch_seconds: number;
  claimed: boolean;
  claimed_at: string | null;
}

export function useRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [progress, setProgress] = useState<UserRewardProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchRewards = async () => {
    const { data } = await supabase
      .from('rewards')
      .select('*')
      .eq('active', true)
      .order('watch_time_minutes', { ascending: true });
    if (data) setRewards(data as unknown as Reward[]);
  };

  const fetchProgress = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_reward_progress')
      .select('*')
      .eq('user_id', user.id);
    if (data) setProgress(data as unknown as UserRewardProgress[]);
  };

  useEffect(() => {
    fetchRewards().then(() => fetchProgress()).then(() => setLoading(false));

    const rewardsChannel = supabase
      .channel('rewards-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, () => {
        fetchRewards();
      })
      .subscribe();

    return () => { supabase.removeChannel(rewardsChannel); };
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchProgress();

    const progressChannel = supabase
      .channel('progress-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_reward_progress', filter: `user_id=eq.${user.id}` }, () => {
        fetchProgress();
      })
      .subscribe();

    return () => { supabase.removeChannel(progressChannel); };
  }, [user]);

  const updateWatchProgress = async (seconds: number) => {
    if (!user || rewards.length === 0) return;

    for (const reward of rewards) {
      const existing = progress.find(p => p.reward_id === reward.id);
      if (existing?.claimed) continue;

      if (existing) {
        await supabase
          .from('user_reward_progress')
          .update({ watch_seconds: existing.watch_seconds + seconds, updated_at: new Date().toISOString() } as any)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_reward_progress')
          .insert({ user_id: user.id, reward_id: reward.id, watch_seconds: seconds } as any);
      }
    }
    await fetchProgress();
  };

  const claimReward = async (rewardId: string) => {
    if (!user) return false;
    const reward = rewards.find(r => r.id === rewardId);
    const prog = progress.find(p => p.reward_id === rewardId);
    if (!reward || !prog || prog.claimed) return false;

    const requiredSeconds = reward.watch_time_minutes * 60;
    if (prog.watch_seconds < requiredSeconds) return false;

    // Mark as claimed
    await supabase
      .from('user_reward_progress')
      .update({ claimed: true, claimed_at: new Date().toISOString() } as any)
      .eq('id', prog.id);

    // Add coins to profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('coins')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ coins: (profile as any).coins + reward.coin_amount } as any)
        .eq('user_id', user.id);
    }

    await fetchProgress();
    return true;
  };

  const createReward = async (watchTimeMinutes: number, coinAmount: number) => {
    await supabase.from('rewards').insert({ watch_time_minutes: watchTimeMinutes, coin_amount: coinAmount } as any);
    await fetchRewards();
  };

  const deleteReward = async (id: string) => {
    await supabase.from('rewards').delete().eq('id', id);
    await fetchRewards();
  };

  return { rewards, progress, loading, updateWatchProgress, claimReward, createReward, deleteReward, fetchRewards };
}
