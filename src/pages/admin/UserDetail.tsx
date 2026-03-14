import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminBottomNav from '@/components/AdminBottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, User, Coins, History, Award, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  coins: number;
  completed_tasks: number;
  total_withdrawn: number;
  frozen_until: string | null;
  referral_code: string | null;
  referred_by: string | null;
  state: string | null;
  country: string | null;
  currency: string | null;
  created_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  type: string;
  upi_id: string | null;
  created_at: string;
}

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      const [{ data: pData }, { data: tData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);
      if (pData) setProfile(pData as unknown as UserProfile);
      if (tData) setTransactions(tData as unknown as Transaction[]);
      setLoading(false);
    };
    fetchData();
  }, [userId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <p className="text-muted-foreground">User not found</p>
      <Button onClick={() => navigate('/admin/users')}>Go Back</Button>
    </div>
  );

  const isFrozen = profile.frozen_until && new Date(profile.frozen_until) > new Date();

  const infoRows = [
    { label: 'Name', value: profile.name },
    { label: 'Email', value: profile.email },
    { label: 'User ID', value: profile.user_id },
    { label: 'Coins', value: profile.coins },
    { label: 'Completed Tasks', value: profile.completed_tasks },
    { label: 'Total Withdrawn', value: profile.total_withdrawn },
    { label: 'Referral Code', value: profile.referral_code || '—' },
    { label: 'Referred By', value: profile.referred_by || '—' },
    { label: 'State', value: profile.state || '—' },
    { label: 'Country', value: profile.country || '—' },
    { label: 'Currency', value: profile.currency || '—' },
    { label: 'Status', value: isFrozen ? `Frozen until ${new Date(profile.frozen_until!).toLocaleDateString()}` : 'Active' },
    { label: 'Joined', value: new Date(profile.created_at).toLocaleDateString() },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold">User Details</h1>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Profile Info */}
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={24} className="text-primary" />
              </div>
              <div>
                <p className="font-bold text-lg">{profile.name}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
              {isFrozen && <Badge variant="secondary" className="bg-blue-100 text-blue-700 ml-auto">Frozen</Badge>}
            </div>
            {infoRows.map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium text-right max-w-[60%] truncate">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-3 text-center"><Coins size={18} className="mx-auto mb-1 text-primary" /><p className="text-lg font-bold">{profile.coins}</p><p className="text-[10px] text-muted-foreground">Balance</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><Award size={18} className="mx-auto mb-1 text-green-500" /><p className="text-lg font-bold">{profile.completed_tasks}</p><p className="text-[10px] text-muted-foreground">Tasks</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><History size={18} className="mx-auto mb-1 text-orange-500" /><p className="text-lg font-bold">{profile.total_withdrawn}</p><p className="text-[10px] text-muted-foreground">Withdrawn</p></CardContent></Card>
        </div>

        {/* Transactions */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar size={16} /> Transaction History ({transactions.length})
          </h3>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">No transactions</p>
          ) : (
            <div className="space-y-2">
              {transactions.map(t => (
                <Card key={t.id}>
                  <CardContent className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{t.amount} coins · {t.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()} {t.upi_id && `· ${t.upi_id}`}
                      </p>
                    </div>
                    <Badge variant={t.status === 'approved' ? 'default' : t.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {t.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <AdminBottomNav />
    </div>
  );
}
