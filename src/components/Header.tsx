import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Coins } from 'lucide-react';

export default function Header() {
  const { settings } = useSettings();
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Coins size={18} className="text-primary-foreground" />
        </div>
        <h1 className="text-lg font-bold text-foreground">{settings.website_name}</h1>
      </div>
      {profile && (
        <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1">
          <Coins size={14} className="text-primary" />
          <span className="text-sm font-bold text-primary">{profile.coins}</span>
        </div>
      )}
    </header>
  );
}
