import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminBottomNav from '@/components/AdminBottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Snowflake, Trash2, Eye, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  coins: number;
  completed_tasks: number;
  total_withdrawn: number;
  frozen_until: string | null;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data as unknown as UserProfile[]);
    if (error) toast.error('Failed to load users');
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    const channel = supabase
      .channel('admin-users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const isFrozen = (u: UserProfile) => {
    if (!u.frozen_until) return false;
    return new Date(u.frozen_until) > new Date();
  };

  const freezeUser = async (user: UserProfile) => {
    setActionLoading(user.id);
    const frozen = isFrozen(user);
    const updates = frozen
      ? { frozen_until: null }
      : { frozen_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
    const { error } = await supabase.from('profiles').update(updates as any).eq('id', user.id);
    if (error) toast.error('Failed: ' + error.message);
    else toast.success(frozen ? `${user.name} unfrozen` : `${user.name} frozen for 7 days`);
    await fetchUsers();
    setActionLoading(null);
  };

  const deleteUser = async (user: UserProfile) => {
    if (!confirm(`Permanently delete ${user.name}? This cannot be undone.`)) return;
    setActionLoading(user.id);
    await supabase.from('transactions').delete().eq('user_id', user.user_id);
    await supabase.from('user_reward_progress').delete().eq('user_id', user.user_id);
    const { error } = await supabase.from('profiles').delete().eq('id', user.id);
    if (error) toast.error('Failed: ' + error.message);
    else toast.success(`${user.name} deleted permanently`);
    await fetchUsers();
    setActionLoading(null);
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold">Users ({users.length})</h1>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No users found</p>
        ) : (
          filtered.map(u => {
            const frozen = isFrozen(u);
            return (
              <Card key={u.id} className={frozen ? 'border-blue-400/40 opacity-80' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{u.name}</p>
                        {frozen && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700">Frozen</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span>Coins: {u.coins}</span>
                        <span>Tasks: {u.completed_tasks}</span>
                        <span>Withdrawn: {u.total_withdrawn}</span>
                      </div>
                      {frozen && u.frozen_until && (
                        <p className="text-xs text-blue-600 mt-1">
                          Frozen until: {new Date(u.frozen_until).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/admin/users/${u.user_id}`)}
                        title="View details"
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        variant={frozen ? 'default' : 'secondary'}
                        size="icon"
                        className="h-8 w-8"
                        disabled={actionLoading === u.id}
                        onClick={() => freezeUser(u)}
                        title={frozen ? 'Unfreeze' : 'Freeze 7 days'}
                      >
                        {actionLoading === u.id ? <Loader2 size={14} className="animate-spin" /> : <Snowflake size={14} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={actionLoading === u.id}
                        onClick={() => deleteUser(u)}
                        title="Delete permanently"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </main>
      <AdminBottomNav />
    </div>
  );
}
