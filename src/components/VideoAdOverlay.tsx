import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { VideoAd } from '@/hooks/useAds';

interface Props {
  ads: VideoAd[];
  onComplete: () => void;
}

export function VideoAdOverlay({ ads, onComplete }: Props) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentAd = ads[currentAdIndex];

  useEffect(() => {
    if (!currentAd) {
      onComplete();
      return;
    }
    setCountdown(currentAd.duration);
    setCanSkip(false);

    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setCanSkip(true);
          return 0;
        }
        if (prev <= currentAd.duration - 5) setCanSkip(true);
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentAdIndex, currentAd]);

  if (!currentAd || ads.length === 0) return null;

  const handleSkip = () => {
    if (currentAdIndex < ads.length - 1) {
      setCurrentAdIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleAdClick = () => {
    if (currentAd.redirect_link) {
      window.open(currentAd.redirect_link, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div className="relative w-full max-w-2xl mx-4">
        <div className="aspect-video rounded-xl overflow-hidden bg-black cursor-pointer" onClick={handleAdClick}>
          <video
            src={currentAd.video_url}
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
          />
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {countdown > 0 && (
            <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full">
              Ad {currentAdIndex + 1}/{ads.length} · {countdown}s
            </span>
          )}
          {canSkip && (
            <button
              onClick={handleSkip}
              className="bg-white/90 hover:bg-white text-black text-sm font-medium px-4 py-1.5 rounded-full flex items-center gap-1 transition-colors"
            >
              Skip <X size={14} />
            </button>
          )}
        </div>
        {currentAd.redirect_link && (
          <p className="text-center text-white/60 text-xs mt-2">Click ad to visit sponsor</p>
        )}
      </div>
    </div>
  );
}
