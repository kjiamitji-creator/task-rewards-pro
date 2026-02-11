import { useSettings } from '@/hooks/useSettings';
import { Coins } from 'lucide-react';

export default function Header() {
  const { settings } = useSettings();

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
        <Coins size={18} className="text-primary-foreground" />
      </div>
      <h1 className="text-lg font-bold text-foreground">{settings.websiteName}</h1>
    </header>
  );
}
