import { useState, useEffect, useRef, useCallback } from 'react';
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
  
  const pendingSecondsRef = useRef<Record<string, number>>({});
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<UserRewardProgress[]>([]);
  const rewardsRef = useRef<Reward[]>([]);
  const initializingRef = useRef<Set<string>>(new Set());

  // Keep refs in sync
  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { rewardsRef.current = rewards; }, [rewards]);

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

  const flushToDB = useCallback(async () => {
    if (!user) return;
    const pending = { ...pendingSecondsRef.current };
    if (Object.keys(pending).length === 0) return;
    pendingSecondsRef.current = {};

    for (const [progressId, seconds] of Object.entries(pending)) {
      if (seconds <= 0) continue;
      const { data: current } = await supabase
        .from('user_reward_progress')
        .select('watch_seconds')
        .eq('id', progressId)
        .single();
      
      if (current) {
        await supabase
          .from('user_reward_progress')
          .update({ 
            watch_seconds: (current as any).watch_seconds + seconds, 
            updated_at: new Date().toISOString() 
          } as any)
          .eq('id', progressId);
      }
    }
    
    await fetchProgress();
  }, [user]);

  useEffect(() => {
    fetchRewards().then(() => fetchProgress()).then(() => setLoading(false));
    const rewardsChannel = supabase
      .channel('rewards-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, () => fetchRewards())
      .subscribe();
    return () => { supabase.removeChannel(rewardsChannel); };
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchProgress();
    const progressChannel = supabase
      .channel('progress-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_reward_progress', filter: `user_id=eq.${user.id}` }, () => fetchProgress())
      .subscribe();
    return () => { supabase.removeChannel(progressChannel); };
  }, [user]);

  useEffect(() => {
    flushTimerRef.current = setInterval(() => flushToDB(), 5000);
    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      flushToDB();
    };
  }, [flushToDB]);

  const updateWatchProgress = useCallback(async (seconds: number) => {
    if (!user) return;
    const currentRewards = rewardsRef.current;
    const currentProgress = progressRef.current;
    if (currentRewards.length === 0) return;

    for (const reward of currentRewards) {
      const existing = currentProgress.find(p => p.reward_id === reward.id);
      if (existing?.claimed) continue;

      if (existing) {
        // Accumulate locally
        pendingSecondsRef.current[existing.id] = (pendingSecondsRef.current[existing.id] || 0) + seconds;
        // Update local state for UI
        setProgress(prev => prev.map(p => 
          p.id === existing.id ? { ...p, watch_seconds: p.watch_seconds + seconds } : p
        ));
      } else {
        // Prevent duplicate inserts - check if already initializing
        if (initializingRef.current.has(reward.id)) continue;
        initializingRef.current.add(reward.id);
        
        // Use upsert to avoid duplicate key errors
        const { data, error } = await supabase
          .from('user_reward_progress')
          .upsert(
            { user_id: user.id, reward_id: reward.id, watch_seconds: seconds } as any,
            { onConflict: 'user_id,reward_id' }
          )
          .select()
          .single();
        
        if (data) {
          setProgress(prev => {
            const exists = prev.find(p => p.reward_id === reward.id);
            if (exists) return prev;
            return [...prev, data as unknown as UserRewardProgress];
          });
        } else if (error) {
          // If upsert failed, fetch fresh data
          await fetchProgress();
        }
        
        initializingRef.current.delete(reward.id);
      }
    }
  }, [user]);

  const claimReward = async (rewardId: string) => {
    if (!user) return false;
    await flushToDB();
    const reward = rewards.find(r => r.id === rewardId);
    const prog = progress.find(p => p.reward_id === rewardId);
    if (!reward || !prog || prog.claimed) return false;
    if (prog.watch_seconds < reward.watch_time_minutes * 60) return false;

    await supabase
      .from('user_reward_progress')
      .update({ claimed: true, claimed_at: new Date().toISOString() } as any)
      .eq('id', prog.id);

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
