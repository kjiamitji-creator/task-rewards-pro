import { useState, useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { VideoAd } from '@/hooks/useAds';

interface Props {
  ads: VideoAd[];
  page: string;
  onComplete: () => void;
  trackEvent?: (ad_id: string, ad_type: string, event_type: string, duration?: number, skippedAt?: number) => void;
}

export function VideoAdOverlay({ ads, page, onComplete, trackEvent }: Props) {
  const pageAds = ads.filter(ad => ad.page === page);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [canClose, setCanClose] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchedRef = useRef(0);

  const currentAd = pageAds[currentAdIndex];

  useEffect(() => {
    if (!currentAd) {
      onComplete();
      return;
    }
    setCountdown(currentAd.duration);
    setCanClose(false);
    setRedirected(false);
    setIsPlaying(false);
    setIsBuffering(true);
    watchedRef.current = 0;

    trackEvent?.(currentAd.id, 'video', 'view');

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentAdIndex, currentAd]);

  useEffect(() => {
    if (isPlaying && countdown > 0) {
      timerRef.current = setInterval(() => {
        watchedRef.current += 1;
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setCanClose(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, countdown]);

  if (!currentAd || pageAds.length === 0) return null;

  const handleCutClick = () => {
    if (!redirected && currentAd.redirect_link) {
      window.open(currentAd.redirect_link, '_blank');
      setRedirected(true);
      trackEvent?.(currentAd.id, 'video', 'click', watchedRef.current);
    } else {
      trackEvent?.(currentAd.id, 'video', 'complete', watchedRef.current);
      if (currentAdIndex < pageAds.length - 1) {
        setCurrentAdIndex(prev => prev + 1);
      } else {
        onComplete();
      }
    }
  };

  const handleCanPlay = () => {
    setIsBuffering(false);
    videoRef.current?.play().catch(() => {});
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => {
    setIsPlaying(false);
    setCanClose(true);
    setCountdown(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          ref={videoRef}
          src={currentAd.video_url}
          className="max-w-full max-h-full w-full h-full object-contain"
          autoPlay
          playsInline
          onCanPlayThrough={handleCanPlay}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
        />

        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 size={48} className="text-white animate-spin" />
          </div>
        )}

        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {countdown > 0 && (
            <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
              Ad {currentAdIndex + 1}/{pageAds.length} · {countdown}s
            </span>
          )}
          {canClose && (
            <button
              onClick={handleCutClick}
              className="bg-white/90 hover:bg-white text-black text-sm font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-colors shadow-lg"
            >
              {!redirected && currentAd.redirect_link ? 'Visit Sponsor' : 'Close'}
              <X size={14} />
            </button>
          )}
        </div>

        {!canClose && !isBuffering && (
          <p className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-xs">
            Ad will end in {countdown}s
          </p>
        )}
      </div>
    </div>
  );
}
