import { useState } from 'react';

export interface AppSettings {
  websiteName: string;
  coinValue: number;
  minWithdrawal: number;
  currency: string;
  adminEmail: string;
}

const DEFAULTS: AppSettings = {
  websiteName: 'VidCoin',
  coinValue: 1,
  minWithdrawal: 100,
  currency: 'INR',
  adminEmail: 'amit128kumarku@gmail.com',
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = localStorage.getItem('appSettings');
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
  });

  const updateSettings = (updates: Partial<AppSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    localStorage.setItem('appSettings', JSON.stringify(updated));
  };

  return { settings, updateSettings };
}
