import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminBottomNav from '@/components/AdminBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Users, CreditCard, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [userCount, setUserCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalTxns, setTotalTxns] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const { count: uc } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: pc } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: tc } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
      setUserCount(uc || 0);
      setPendingCount(pc || 0);
      setTotalTxns(tc || 0);
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <Button variant="outline" size="sm" onClick={() => navigate('/home')} className="gap-1">
          <ExternalLink size={14} /> Visit Site
        </Button>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4 text-center"><Users size={22} className="mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{userCount}</p><p className="text-xs text-muted-foreground">Users</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><CreditCard size={22} className="mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><DollarSign size={22} className="mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{totalTxns}</p><p className="text-xs text-muted-foreground">Total Txns</p></CardContent></Card>
        </div>
      </main>
      <AdminBottomNav />
    </div>
  );
}
