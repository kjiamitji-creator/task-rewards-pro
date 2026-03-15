import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Play, Coins, Maximize2, RectangleHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { useRewards } from '@/hooks/useRewards';
import { useAds } from '@/hooks/useAds';
import { SocialAdBanner } from '@/components/AdBanner';
import { VideoAdOverlay } from '@/components/VideoAdOverlay';
import { ImageAdOverlay } from '@/components/ImageAdOverlay';
import { toast } from 'sonner';

function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

let ytApiLoaded = false;
let ytApiReady = false;
const ytReadyCallbacks: (() => void)[] = [];

function loadYTApi(cb: () => void) {
  if (ytApiReady) { cb(); return; }
  ytReadyCallbacks.push(cb);
  if (ytApiLoaded) return;
  ytApiLoaded = true;
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
  (window as any).onYouTubeIframeAPIReady = () => {
    ytApiReady = true;
    ytReadyCallbacks.forEach(fn => fn());
    ytReadyCallbacks.length = 0;
  };
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [lastCreditedMinute, setLastCreditedMinute] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showVideoAd, setShowVideoAd] = useState(false);
  const [showImageAd, setShowImageAd] = useState(false);
  const [imageAdShownAt, setImageAdShownAt] = useState(0);
  const { addCoins, profile } = useAuth();
  const { settings } = useSettings();
  const { updateWatchProgress } = useRewards();
  const { socialAds, videoAds, imageAds, trackAdEvent } = useAds();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playerContainerId = 'yt-player-container';

  const coinsPerMinute = settings.coins_per_minute || 1;

  // Initialize YouTube player when videoId changes
  useEffect(() => {
    if (!videoId) return;

    const initPlayer = () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }

      playerRef.current = new (window as any).YT.Player(playerContainerId, {
        videoId,
        playerVars: {
          autoplay: 1, controls: 1, rel: 0, modestbranding: 1, fs: 1, playsinline: 1,
        },
        events: {
          onStateChange: (event: any) => {
            const YT = (window as any).YT;
            if (event.data === YT.PlayerState.PLAYING) {
              setIsWatching(true);
            } else {
              setIsWatching(false);
            }
          },
        },
      });
    };

    loadYTApi(initPlayer);

    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // Timer — runs only when video is playing
  useEffect(() => {
    if (isWatching && videoId) {
      timerRef.current = setInterval(() => {
        setWatchSeconds(prev => prev + 1);
        updateWatchProgress(1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWatching, videoId]);

  // Credit coins
  useEffect(() => {
    const currentMinute = Math.floor(watchSeconds / 60);
    if (currentMinute > lastCreditedMinute && videoId) {
      const newCoins = (currentMinute - lastCreditedMinute) * coinsPerMinute;
      setLastCreditedMinute(currentMinute);
      setEarnedCoins(prev => prev + newCoins);
      addCoins(newCoins);
      toast.success(`+${newCoins} coin${newCoins > 1 ? 's' : ''} earned! 🎉`, {
        description: `${currentMinute} minute${currentMinute > 1 ? 's' : ''} watched`,
      });
    }
  }, [watchSeconds, lastCreditedMinute, videoId, coinsPerMinute]);

  // Show image ad every 10 minutes
  useEffect(() => {
    if (!isWatching || !videoId) return;
    const minutesWatched = Math.floor(watchSeconds / 60);
    const imageAdsForHome = imageAds.filter(a => a.page === 'home');
    if (imageAdsForHome.length > 0 && minutesWatched > 0 && minutesWatched % 10 === 0 && minutesWatched !== imageAdShownAt) {
      setImageAdShownAt(minutesWatched);
      // Pause the youtube video
      try { playerRef.current?.pauseVideo(); } catch {}
      setShowImageAd(true);
    }
  }, [watchSeconds, isWatching, videoId, imageAds, imageAdShownAt]);

  const handleImageAdComplete = () => {
    setShowImageAd(false);
    // Resume youtube video
    try { playerRef.current?.playVideo(); } catch {}
  };

  const handleSearch = () => {
    const id = extractVideoId(url);
    if (id) {
      setVideoId(id);
      setWatchSeconds(0);
      setEarnedCoins(0);
      setLastCreditedMinute(0);
      setIsWatching(false);
      setImageAdShownAt(0);
      // Show image ad before video starts
      const homeImageAds = imageAds.filter(a => a.page === 'home');
      if (homeImageAds.length > 0) {
        setShowImageAd(true);
      } else if (videoAds.filter(a => a.page === 'home').length > 0) {
        setShowVideoAd(true);
      }
    } else {
      toast.error('Please enter a valid YouTube URL');
    }
  };

  const toggleFullscreen = useCallback(() => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      {showImageAd && (
        <ImageAdOverlay ads={imageAds} page="home" onComplete={handleImageAdComplete} trackEvent={trackAdEvent} />
      )}
      {showVideoAd && (
        <VideoAdOverlay ads={videoAds} page="home" onComplete={() => setShowVideoAd(false)} trackEvent={trackAdEvent} />
      )}
      <main className={`mx-auto px-4 py-6 space-y-5 ${isTheaterMode ? 'max-w-4xl' : 'max-w-lg'}`}>
        <Card className="border-primary/20 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Play size={14} className="text-primary" />
              Paste a YouTube link and watch to earn <strong>{coinsPerMinute} coin/min</strong>
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="icon" className="shrink-0">
                <Search size={18} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {videoId && (
          <div className="space-y-4">
            <div
              ref={videoContainerRef}
              className="relative aspect-video rounded-xl overflow-hidden bg-muted shadow-lg border border-border"
            >
              <div id={playerContainerId} className="w-full h-full" />
              <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                <button
                  onClick={() => setIsTheaterMode(prev => !prev)}
                  className={`bg-black/60 hover:bg-black/80 text-white rounded-lg p-2 transition-colors ${isTheaterMode ? 'ring-2 ring-primary' : ''}`}
                  title={isTheaterMode ? 'Exit Theater Mode' : 'Theater Mode (16:9)'}
                >
                  <RectangleHorizontal size={16} />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="bg-black/60 hover:bg-black/80 text-white rounded-lg p-2 transition-colors"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>

            {/* Social ads between video and earnings */}
            <SocialAdBanner ads={socialAds} page="home" />

            {/* Earnings card */}
            <Card className="overflow-hidden">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isWatching ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                    <span className="text-sm font-medium">{isWatching ? 'Earning...' : 'Paused'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{coinsPerMinute} coin/min</p>
                </div>

                <div className="flex items-center justify-center gap-3 bg-primary/5 rounded-xl p-4">
                  <Coins size={28} className="text-primary" />
                  <div>
                    <p className="text-3xl font-bold text-primary">+{earnedCoins}</p>
                    <p className="text-xs text-muted-foreground">Coins earned this session</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!videoId && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Play size={36} className="text-primary opacity-60" />
            </div>
            <p className="text-lg font-semibold">Start Watching & Earning</p>
            <p className="text-sm mt-1">Paste a YouTube link above to begin</p>
            <p className="text-xs mt-2 text-primary font-medium">{coinsPerMinute} coin per minute of watching</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
