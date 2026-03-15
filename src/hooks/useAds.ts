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

export interface ImageAd {
  id: string;
  image_url: string;
  redirect_link: string;
  duration: number;
  active: boolean;
  frozen_until: string | null;
  page: string;
  created_at: string;
}

export interface AdAnalytics {
  ad_id: string;
  ad_type: string;
  views: number;
  clicks: number;
  skips: number;
  total_watch_time: number;
}

export function useAds() {
  const [socialAds, setSocialAds] = useState<SocialAd[]>([]);
  const [videoAds, setVideoAds] = useState<VideoAd[]>([]);
  const [imageAds, setImageAds] = useState<ImageAd[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAds = async () => {
    const [socialRes, videoRes, imageRes] = await Promise.all([
      supabase.from('social_ads').select('*').eq('active', true),
      supabase.from('video_ads').select('*').eq('active', true),
      supabase.from('image_ads' as any).select('*').eq('active', true),
    ]);
    if (socialRes.data) setSocialAds(socialRes.data as unknown as SocialAd[]);
    if (videoRes.data) setVideoAds(videoRes.data as unknown as VideoAd[]);
    if (imageRes.data) {
      const now = new Date();
      const active = (imageRes.data as unknown as ImageAd[]).filter(ad => {
        if (ad.frozen_until && new Date(ad.frozen_until) > now) return false;
        return true;
      });
      setImageAds(active);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAds();

    const channel = supabase
      .channel('ads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_ads' }, () => fetchAds())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_ads' }, () => fetchAds())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'image_ads' }, () => fetchAds())
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

  const addImageAd = async (image_url: string, redirect_link: string, duration: number, page: string) => {
    const { error } = await supabase.from('image_ads' as any).insert({ image_url, redirect_link, duration, page } as any);
    if (error) throw error;
    await fetchAds();
  };

  const deleteImageAd = async (id: string) => {
    await supabase.from('image_ads' as any).delete().eq('id', id);
    await fetchAds();
  };

  const freezeImageAd = async (id: string, days: number) => {
    const freezeUntil = new Date();
    freezeUntil.setDate(freezeUntil.getDate() + days);
    await supabase.from('image_ads' as any).update({ frozen_until: freezeUntil.toISOString() } as any).eq('id', id);
    await fetchAds();
  };

  const freezeVideoAd = async (id: string, days: number) => {
    // For video ads, just deactivate
    await supabase.from('video_ads').update({ active: false } as any).eq('id', id);
    await fetchAds();
  };

  const freezeSocialAd = async (id: string, days: number) => {
    await supabase.from('social_ads').update({ active: false } as any).eq('id', id);
    await fetchAds();
  };

  // Track ad analytics
  const trackAdEvent = async (ad_id: string, ad_type: string, event_type: string, duration_watched?: number, skipped_at?: number) => {
    await supabase.from('ad_analytics' as any).insert({
      ad_id, ad_type, event_type,
      duration_watched: duration_watched || 0,
      skipped_at: skipped_at || null,
    } as any);
  };

  // Get analytics for a specific ad
  const getAdAnalytics = async (ad_id: string): Promise<AdAnalytics | null> => {
    const { data } = await supabase.from('ad_analytics' as any).select('*').eq('ad_id', ad_id);
    if (!data || (data as any[]).length === 0) return null;
    const events = data as any[];
    return {
      ad_id,
      ad_type: events[0]?.ad_type || 'unknown',
      views: events.filter(e => e.event_type === 'view').length,
      clicks: events.filter(e => e.event_type === 'click').length,
      skips: events.filter(e => e.event_type === 'skip').length,
      total_watch_time: events.reduce((sum: number, e: any) => sum + (e.duration_watched || 0), 0),
    };
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

  // Upload image for image ads
  const uploadImageFile = async (
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      const fileName = `${Date.now()}-${file.name}`;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/ad-images/${fileName}`;

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
          const { data } = supabase.storage.from('ad-images').getPublicUrl(fileName);
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

  return {
    socialAds, videoAds, imageAds, loading,
    addSocialAd, deleteSocialAd,
    addVideoAd, deleteVideoAd,
    addImageAd, deleteImageAd, freezeImageAd,
    freezeVideoAd, freezeSocialAd,
    trackAdEvent, getAdAnalytics,
    uploadVideoFile, uploadImageFile, fetchAds,
  };
}
