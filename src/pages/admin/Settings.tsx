import { useState, useEffect } from 'react';
import AdminBottomNav from '@/components/AdminBottomNav';
import { useSettings } from '@/hooks/useSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Globe, Coins, Clock, ArrowDownToLine, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { settings, updateSettings } = useSettings();
  const [form, setForm] = useState(settings);

  useEffect(() => { setForm(settings); }, [settings]);

  const handleSave = async () => {
    await updateSettings(form);
    toast.success('Settings saved and applied instantly!');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Changes apply in real-time across the platform</p>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Website Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe size={16} className="text-primary" /> Website Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Website Name</Label>
              <Input value={form.website_name} onChange={e => setForm({ ...form, website_name: e.target.value })} placeholder="Your website name" />
              <p className="text-xs text-muted-foreground">Displayed in header across all pages</p>
            </div>
            <div className="space-y-1">
              <Label>Currency</Label>
              <Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} placeholder="INR" />
            </div>
          </CardContent>
        </Card>

        {/* Earning Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Coins size={16} className="text-primary" /> Earning Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Coins Per Minute of Watching</Label>
              <Input type="number" value={form.coins_per_minute} onChange={e => setForm({ ...form, coins_per_minute: Number(e.target.value) })} />
              <p className="text-xs text-muted-foreground">How many coins user earns per minute of video watching</p>
            </div>
            <div className="space-y-1">
              <Label>Coin Value (coins per 1 {form.currency})</Label>
              <Input type="number" value={form.coin_value} onChange={e => setForm({ ...form, coin_value: Number(e.target.value) })} />
              <p className="text-xs text-muted-foreground">E.g. 100 means 100 coins = 1 {form.currency}</p>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownToLine size={16} className="text-primary" /> Withdrawal Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Minimum Withdrawal (coins)</Label>
              <Input type="number" value={form.min_withdrawal} onChange={e => setForm({ ...form, min_withdrawal: Number(e.target.value) })} />
              <p className="text-xs text-muted-foreground">Users must have at least this many coins to withdraw</p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock size={16} className="text-primary" /> Admin Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Admin Email</Label>
              <Input value={form.admin_email} onChange={e => setForm({ ...form, admin_email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Admin Login Password</Label>
              <Input type="password" value={form.admin_password} onChange={e => setForm({ ...form, admin_password: e.target.value })} />
              <p className="text-xs text-muted-foreground">Change this to update admin panel login password instantly</p>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full gap-2" size="lg">
          <Save size={16} /> Save All Settings
        </Button>
      </main>
      <AdminBottomNav />
    </div>
  );
}
