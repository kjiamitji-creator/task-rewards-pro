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
  const [visitClicked, setVisitClicked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchedRef = useRef(0);

  const currentAd = pageAds[currentAdIndex];

  useEffect(() => {
    if (!currentAd) { onComplete(); return; }
    setCountdown(currentAd.duration);
    setCanClose(false);
    setImageLoaded(false);
    setVisitClicked(false);
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
    // First click on close: open redirect link
    if (!visitClicked && currentAd.redirect_link) {
      window.open(currentAd.redirect_link, '_blank');
      trackEvent?.(currentAd.id, 'image', 'click', watchedRef.current);
      setVisitClicked(true);
      return;
    }
    // Second click: close ad
    trackEvent?.(currentAd.id, 'image', 'complete', watchedRef.current);
    if (currentAdIndex < pageAds.length - 1) {
      setCurrentAdIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-200">
      {/* Ad badge */}
      <div className="absolute top-3 left-3 z-20">
        <span className="bg-white/10 backdrop-blur-md text-white/80 text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/10">
          Ad {currentAdIndex + 1}/{pageAds.length}
        </span>
      </div>

      {/* Loading spinner */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 size={40} className="text-white/70 animate-spin" />
        </div>
      )}

      {/* Full screen image */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <img
          src={currentAd.image_url}
          alt="Advertisement"
          className="w-full h-full object-contain"
          onLoad={() => setImageLoaded(true)}
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Bottom bar - always at bottom */}
      {imageLoaded && (
        <div className="bg-black/90 backdrop-blur-md border-t border-white/10 px-4 py-3 flex items-center gap-3 safe-area-bottom">
          {/* Visit button */}
          {currentAd.redirect_link && (
            <button
              onClick={handleVisit}
              className="flex-1 bg-white text-black font-semibold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <ExternalLink size={16} />
              Visit Website
            </button>
          )}

          {/* Timer or Close */}
          {canClose ? (
            <button
              onClick={handleClose}
              className={`${currentAd.redirect_link ? 'w-auto' : 'flex-1'} bg-white/15 text-white font-medium text-sm py-3 px-5 rounded-xl flex items-center justify-center gap-2 border border-white/20 hover:bg-white/25 active:scale-[0.98] transition-all`}
            >
              <X size={16} />
              {visitClicked ? 'Close' : 'Close'}
            </button>
          ) : (
            <div className="bg-white/10 text-white text-sm font-semibold px-5 py-3 rounded-xl tabular-nums border border-white/10 text-center min-w-[60px]">
              {countdown}s
            </div>
          )}
        </div>
      )}
    </div>
  );
}
