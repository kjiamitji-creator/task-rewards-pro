import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AppSettings {
  id?: string;
  website_name: string;
  coin_value: number;
  coins_per_minute: number;
  min_withdrawal: number;
  currency: string;
  admin_email: string;
  admin_password: string;
}

const DEFAULTS: AppSettings = {
  website_name: 'VidCoin',
  coin_value: 1,
  coins_per_minute: 1,
  min_withdrawal: 100,
  currency: 'INR',
  admin_email: '',
  admin_password: 'kumar',
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase.from('app_settings').select('*').limit(1).maybeSingle();
    if (data) setSettings(data as unknown as AppSettings);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();

    const channel = supabase
      .channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload) => {
        if (payload.new) setSettings(payload.new as unknown as AppSettings);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateSettings = async (updates: Partial<AppSettings>) => {
    if (settings.id) {
      await supabase.from('app_settings').update(updates as any).eq('id', settings.id);
    }
    await fetchSettings();
  };

  return { settings, updateSettings, loading };
}
