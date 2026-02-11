import { useState } from 'react';
import AdminBottomNav from '@/components/AdminBottomNav';
import { useSettings } from '@/hooks/useSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { settings, updateSettings } = useSettings();
  const [form, setForm] = useState(settings);

  const handleSave = () => {
    updateSettings(form);
    toast.success('Settings saved!');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4"><h1 className="text-xl font-bold">Settings</h1></header>
      <main className="max-w-lg mx-auto px-4 py-6">
        <Card>
          <CardHeader><CardTitle>Platform Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><Label>Website Name</Label><Input value={form.websiteName} onChange={e => setForm({ ...form, websiteName: e.target.value })} /></div>
            <div className="space-y-1"><Label>Coin Value per Task</Label><Input type="number" value={form.coinValue} onChange={e => setForm({ ...form, coinValue: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Minimum Withdrawal (coins)</Label><Input type="number" value={form.minWithdrawal} onChange={e => setForm({ ...form, minWithdrawal: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Currency</Label><Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} /></div>
            <div className="space-y-1"><Label>Admin Email</Label><Input value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })} /></div>
            <Button onClick={handleSave} className="w-full gap-2"><Save size={16} /> Save Settings</Button>
          </CardContent>
        </Card>
      </main>
      <AdminBottomNav />
    </div>
  );
}
