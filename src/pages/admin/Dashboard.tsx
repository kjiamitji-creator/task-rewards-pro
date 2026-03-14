import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminBottomNav from '@/components/AdminBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Users, CreditCard, DollarSign, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    rejectedPayments: 0,
    totalTransactions: 0,
    totalCoinsInCirculation: 0,
    totalWithdrawn: 0,
  });

  const fetchStats = async () => {
    const [
      { count: totalUsers },
      { count: pendingPayments },
      { count: approvedPayments },
      { count: rejectedPayments },
      { count: totalTransactions },
      { data: profilesData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('transactions').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('coins, total_withdrawn'),
    ]);

    const totalCoins = (profilesData || []).reduce((sum: number, p: any) => sum + (p.coins || 0), 0);
    const totalWith = (profilesData || []).reduce((sum: number, p: any) => sum + (p.total_withdrawn || 0), 0);

    setStats({
      totalUsers: totalUsers || 0,
      pendingPayments: pendingPayments || 0,
      approvedPayments: approvedPayments || 0,
      rejectedPayments: rejectedPayments || 0,
      totalTransactions: totalTransactions || 0,
      totalCoinsInCirculation: totalCoins,
      totalWithdrawn: totalWith,
    });
  };

  useEffect(() => {
    fetchStats();

    const ch1 = supabase.channel('dash-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchStats())
      .subscribe();
    const ch2 = supabase.channel('dash-txns')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, []);

  const cards = [
    { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'text-blue-500' },
    { icon: Clock, label: 'Pending Payments', value: stats.pendingPayments, color: 'text-yellow-500' },
    { icon: CheckCircle, label: 'Approved', value: stats.approvedPayments, color: 'text-green-500' },
    { icon: XCircle, label: 'Rejected', value: stats.rejectedPayments, color: 'text-red-500' },
    { icon: CreditCard, label: 'Total Transactions', value: stats.totalTransactions, color: 'text-primary' },
    { icon: TrendingUp, label: 'Coins in Circulation', value: stats.totalCoinsInCirculation, color: 'text-emerald-500' },
    { icon: DollarSign, label: 'Total Withdrawn', value: stats.totalWithdrawn, color: 'text-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <Button variant="outline" size="sm" onClick={() => navigate('/home')} className="gap-1">
          <ExternalLink size={14} /> Visit Site
        </Button>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {cards.map(({ icon: Icon, label, value, color }) => (
            <Card key={label}>
              <CardContent className="p-4 text-center">
                <Icon size={22} className={`mx-auto mb-1 ${color}`} />
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <AdminBottomNav />
    </div>
  );
}
