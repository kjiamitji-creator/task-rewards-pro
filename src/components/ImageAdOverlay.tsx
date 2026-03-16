import { useState, useEffect, useRef } from 'react';
import { X, Loader2, ExternalLink } from 'lucide-react';
import type { ImageAd } from '@/hooks/useAds';

interface Props {
  ads: ImageAd[];
  page: string;
  onComplete: () => void;
  trackEvent?: (ad_id: string, ad_type: string, event_type: string, duration?: number, skippedAt?: number) => void;
}

// Preload images globally when ads are fetched
const preloadedImages = new Set<string>();
export function preloadImageAds(ads: ImageAd[]) {
  ads.forEach(ad => {
    if (!preloadedImages.has(ad.image_url)) {
      const img = new Image();
      img.src = ad.image_url;
      preloadedImages.add(ad.image_url);
    }
  });
}

export function ImageAdOverlay({ ads, page, onComplete, trackEvent }: Props) {
  const pageAds = ads.filter(ad => ad.page === page);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [canClose, setCanClose] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchedRef = useRef(0);

  const currentAd = pageAds[currentAdIndex];

  useEffect(() => {
    if (!currentAd) { onComplete(); return; }
    setCountdown(currentAd.duration);
    setCanClose(false);
    setImageLoaded(false);
    watchedRef.current = 0;
    trackEvent?.(currentAd.id, 'image', 'view');
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentAdIndex, currentAd]);

  useEffect(() => {
    if (imageLoaded && countdown > 0) {
      timerRef.current = setInterval(() => {
        watchedRef.current += 1;
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timerRef.current!); setCanClose(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [imageLoaded, countdown]);

  if (!currentAd || pageAds.length === 0) return null;

  const handleVisit = () => {
    if (currentAd.redirect_link) {
      window.open(currentAd.redirect_link, '_blank');
      trackEvent?.(currentAd.id, 'image', 'click', watchedRef.current);
    }
  };

  const handleClose = () => {
    trackEvent?.(currentAd.id, 'image', 'complete', watchedRef.current);
    if (currentAdIndex < pageAds.length - 1) {
      setCurrentAdIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Loading spinner */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={40} className="text-white/70 animate-spin" />
          </div>
        )}

        {/* Ad image */}
        <img
          src={currentAd.image_url}
          alt="Advertisement"
          className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
          onLoad={() => setImageLoaded(true)}
          loading="eager"
          decoding="async"
        />

        {/* Top bar: badge + timer */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <span className="bg-white/10 backdrop-blur-md text-white/80 text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/10">
            Ad {currentAdIndex + 1}/{pageAds.length}
          </span>
          {countdown > 0 ? (
            <span className="bg-white/10 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 tabular-nums">
              {countdown}s
            </span>
          ) : null}
        </div>

        {/* Bottom action bar */}
        {imageLoaded && (
          <div className="absolute bottom-6 left-4 right-4 flex items-center gap-3 z-10">
            {currentAd.redirect_link && (
              <button
                onClick={handleVisit}
                className="flex-1 bg-white text-black font-semibold text-sm py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-xl hover:bg-white/90 active:scale-[0.98] transition-all"
              >
                <ExternalLink size={16} />
                Visit Sponsor
              </button>
            )}
            {canClose && (
              <button
                onClick={handleClose}
                className={`${currentAd.redirect_link ? '' : 'flex-1'} bg-white/15 backdrop-blur-md text-white font-medium text-sm py-3 px-5 rounded-xl flex items-center justify-center gap-2 border border-white/20 hover:bg-white/25 active:scale-[0.98] transition-all`}
              >
                <X size={16} />
                Close
              </button>
            )}
          </div>
        )}

        {/* Bottom hint */}
        {!canClose && imageLoaded && (
          <p className="absolute bottom-2 left-0 right-0 text-center text-white/30 text-[10px]">
            Ad closes in {countdown}s
          </p>
        )}
      </div>
    </div>
  );
}
