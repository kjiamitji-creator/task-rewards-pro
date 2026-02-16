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
  page: string;
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
    const { error } = await supabase.from('social_ads').insert({ code, page, duration } as any);
    if (error) throw error;
    await fetchAds();
  };

  const deleteSocialAd = async (id: string) => {
    await supabase.from('social_ads').delete().eq('id', id);
    await fetchAds();
  };

  const addVideoAd = async (video_url: string, redirect_link: string, duration: number, page: string) => {
    const { error } = await supabase.from('video_ads').insert({ video_url, redirect_link, duration, page } as any);
    if (error) throw error;
    await fetchAds();
  };

  const deleteVideoAd = async (id: string) => {
    await supabase.from('video_ads').delete().eq('id', id);
    await fetchAds();
  };

  // Upload video with XHR for live progress tracking
  const uploadVideoFile = async (
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      const fileName = `${Date.now()}-${file.name}`;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/ad-videos/${fileName}`;

      const formData = new FormData();
      formData.append('cacheControl', '3600');
      formData.append('', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const { data } = supabase.storage.from('ad-videos').getPublicUrl(fileName);
          resolve(data.publicUrl);
        } else {
          resolve(null);
        }
      });

      xhr.addEventListener('error', () => resolve(null));

      xhr.open('POST', url);
      xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
      xhr.setRequestHeader('Authorization', `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.send(formData);
    });
  };

  return { socialAds, videoAds, loading, addSocialAd, deleteSocialAd, addVideoAd, deleteVideoAd, uploadVideoFile, fetchAds };
}
