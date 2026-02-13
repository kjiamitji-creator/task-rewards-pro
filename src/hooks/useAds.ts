import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SocialAd {
  id: string;
  code: string;
  page: string;
  duration: number;
  active: boolean;
  created_at: string;
}

export interface VideoAd {
  id: string;
  video_url: string;
  redirect_link: string;
  duration: number;
  active: boolean;
  created_at: string;
}

export function useAds() {
  const [socialAds, setSocialAds] = useState<SocialAd[]>([]);
  const [videoAds, setVideoAds] = useState<VideoAd[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAds = async () => {
    const [socialRes, videoRes] = await Promise.all([
      supabase.from('social_ads').select('*').eq('active', true),
      supabase.from('video_ads').select('*').eq('active', true),
    ]);
    if (socialRes.data) setSocialAds(socialRes.data as unknown as SocialAd[]);
    if (videoRes.data) setVideoAds(videoRes.data as unknown as VideoAd[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAds();

    const channel = supabase
      .channel('ads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_ads' }, () => fetchAds())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_ads' }, () => fetchAds())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const addSocialAd = async (code: string, page: string, duration: number) => {
    await supabase.from('social_ads').insert({ code, page, duration } as any);
    await fetchAds();
  };

  const deleteSocialAd = async (id: string) => {
    await supabase.from('social_ads').delete().eq('id', id);
    await fetchAds();
  };

  const addVideoAd = async (video_url: string, redirect_link: string, duration: number) => {
    await supabase.from('video_ads').insert({ video_url, redirect_link, duration } as any);
    await fetchAds();
  };

  const deleteVideoAd = async (id: string) => {
    await supabase.from('video_ads').delete().eq('id', id);
    await fetchAds();
  };

  return { socialAds, videoAds, loading, addSocialAd, deleteSocialAd, addVideoAd, deleteVideoAd };
}
