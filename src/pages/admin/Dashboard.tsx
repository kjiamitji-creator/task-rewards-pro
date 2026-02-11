import { useNavigate } from 'react-router-dom';
import AdminBottomNav from '@/components/AdminBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Users, CreditCard, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const txns = JSON.parse(localStorage.getItem('transactions') || '[]');
  const pending = txns.filter((t: any) => t.status === 'pending').length;

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
          <Card><CardContent className="p-4 text-center"><Users size={22} className="mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{users.length}</p><p className="text-xs text-muted-foreground">Users</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><CreditCard size={22} className="mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{pending}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><DollarSign size={22} className="mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{txns.length}</p><p className="text-xs text-muted-foreground">Total Txns</p></CardContent></Card>
        </div>
      </main>
      <AdminBottomNav />
    </div>
  );
}
