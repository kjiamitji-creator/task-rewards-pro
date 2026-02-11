import { useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User as UserIcon, Copy, Share2, Edit, Trophy } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { user, updateUser, getAllUsers, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [state, setState] = useState(user?.state || '');
  const [country, setCountry] = useState(user?.country || '');

  if (!user) return null;

  const referralLink = `${window.location.origin}/register?ref=${user.referralCode}`;
  const allUsers = getAllUsers();
  const referrals = allUsers.filter(u => u.referredBy === user.referralCode);

  const handleSave = () => {
    updateUser({ name, state, country });
    setEditing(false);
    toast.success('Profile updated!');
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <UserIcon size={28} className="text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold truncate">{user.name}</h2>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">State</p>
                <p className="font-medium">{user.state || '—'}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Country</p>
                <p className="font-medium">{user.country || '—'}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Currency</p>
                <p className="font-medium">{user.currency}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Tasks Done</p>
                <p className="font-medium">{user.completedTasks}</p>
              </div>
            </div>

            <Dialog open={editing} onOpenChange={setEditing}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-4 gap-2">
                  <Edit size={16} /> Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
                  <Input placeholder="State" value={state} onChange={e => setState(e.target.value)} />
                  <Input placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} />
                  <Button onClick={handleSave} className="w-full">Save Changes</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Share2 size={18} /> Referral Program
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Your Referral Code</p>
                <div className="flex items-center gap-2">
                  <Input value={user.referralCode} readOnly className="font-mono text-lg font-bold" />
                  <Button variant="outline" size="icon" onClick={copyReferral}>
                    <Copy size={16} />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-primary/5 rounded-lg p-3">
                <Trophy size={20} className="text-primary" />
                <div>
                  <p className="font-semibold">{referrals.length} Referrals</p>
                  <p className="text-xs text-muted-foreground">+10 coins per referral</p>
                </div>
              </div>

              {referrals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Referred Users</p>
                  {referrals.map(r => (
                    <div key={r.id} className="flex items-center gap-2 text-sm bg-muted rounded-lg px-3 py-2">
                      <UserIcon size={14} className="text-muted-foreground" />
                      <span>{r.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button variant="destructive" className="w-full" onClick={() => logout()}>
          Logout
        </Button>
      </main>
      <BottomNav />
    </div>
  );
}
