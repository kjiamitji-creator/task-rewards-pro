import { CreditCard, Users, Megaphone, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const items = [
  { path: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/ads', icon: Megaphone, label: 'Ads' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {items.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
