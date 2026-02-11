import { useState } from 'react';
import AdminBottomNav from '@/components/AdminBottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

export default function AdminUsers() {
  const { getAllUsers, toggleBlockUser } = useAuth();
  const [search, setSearch] = useState('');
  const [, setRefresh] = useState(0);
  const users = getAllUsers().filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const handleToggle = (id: string) => { toggleBlockUser(id); setRefresh(n => n + 1); };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4"><h1 className="text-xl font-bold">Users</h1></header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {users.length === 0 ? <p className="text-center text-muted-foreground py-8">No users found</p> : users.map(u => (
          <Card key={u.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span>Coins: {u.coins}</span>
                    <span>Tasks: {u.completedTasks}</span>
                    <span>Withdrawn: {u.totalWithdrawn}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {u.blocked && <Badge variant="destructive">Blocked</Badge>}
                  <Button size="sm" variant={u.blocked ? 'default' : 'destructive'} onClick={() => handleToggle(u.id)}>
                    {u.blocked ? 'Unblock' : 'Block'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </main>
      <AdminBottomNav />
    </div>
  );
}
