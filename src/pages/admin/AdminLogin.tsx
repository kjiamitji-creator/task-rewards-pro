import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Fetch admin password from app_settings
    const { data } = await supabase
      .from('app_settings')
      .select('admin_password')
      .limit(1)
      .maybeSingle();

    const correctPassword = (data as any)?.admin_password || 'kumar';

    if (adminLogin(password, correctPassword)) {
      navigate('/admin');
    } else {
      setError('Incorrect password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <Shield size={28} className="text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Panel</CardTitle>
          <CardDescription>Enter admin password to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            <Input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
            />
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <LogIn size={18} /> {loading ? 'Verifying...' : 'Enter Admin Panel'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
