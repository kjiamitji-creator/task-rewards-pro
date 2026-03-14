import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  state?: string;
  country?: string;
  currency: string;
  referral_code: string;
  referred_by?: string;
  coins: number;
  completed_tasks: number;
  total_withdrawn: number;
  created_at: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; isAdmin: boolean; error?: string }>;
  register: (name: string, email: string, password: string, referralCode?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  deductCoins: (amount: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) setProfile(data as unknown as Profile);
  };

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!data);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Use setTimeout to avoid deadlocks with Supabase auth
        setTimeout(async () => {
          await fetchProfile(session.user.id);
          await checkAdmin(session.user.id);
          setLoading(false);
        }, 0);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id).then(() => checkAdmin(session.user.id)).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, isAdmin: false, error: error.message };
    if (data.user) {
      // Check if account is frozen
      const { data: prof } = await supabase.from('profiles').select('frozen_until').eq('user_id', data.user.id).maybeSingle();
      if (prof && (prof as any).frozen_until && new Date((prof as any).frozen_until) > new Date()) {
        const until = new Date((prof as any).frozen_until).toLocaleDateString();
        await supabase.auth.signOut();
        return { success: false, isAdmin: false, error: `Your account is frozen. Please wait until ${until}.` };
      }
      await fetchProfile(data.user.id);
      await checkAdmin(data.user.id);
      return { success: true, isAdmin };
    }
    return { success: false, isAdmin: false, error: 'Login failed' };
  };

  const register = async (name: string, email: string, password: string, referralCode?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { success: false, error: error.message };
    
    // Update profile with name and referral
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ name, referred_by: referralCode || null })
        .eq('user_id', data.user.id);
      
      // Credit referrer
      if (referralCode) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('user_id, coins')
          .eq('referral_code', referralCode)
          .maybeSingle();
        if (referrer) {
          await supabase
            .from('profiles')
            .update({ coins: (referrer as any).coins + 10 })
            .eq('user_id', (referrer as any).user_id);
        }
      }
    }
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    await supabase.from('profiles').update(updates as any).eq('user_id', user.id);
    await fetchProfile(user.id);
  };

  const addCoins = async (amount: number) => {
    if (!user || !profile) return;
    await supabase
      .from('profiles')
      .update({
        coins: profile.coins + amount,
        completed_tasks: profile.completed_tasks + 1,
      } as any)
      .eq('user_id', user.id);
    await fetchProfile(user.id);
  };

  const deductCoins = async (amount: number) => {
    if (!user || !profile) return;
    await supabase
      .from('profiles')
      .update({
        coins: profile.coins - amount,
        total_withdrawn: profile.total_withdrawn + amount,
      } as any)
      .eq('user_id', user.id);
    await fetchProfile(user.id);
  };

  // Realtime profile updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, (payload) => {
        setProfile(payload.new as unknown as Profile);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, login, register, logout, updateProfile, addCoins, deductCoins, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
