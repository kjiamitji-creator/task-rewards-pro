import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Search, Play, Coins, Timer, Maximize2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { useAds } from '@/hooks/useAds';
import { SocialAdBanner } from '@/components/AdBanner';
import { VideoAdOverlay } from '@/components/VideoAdOverlay';
import { toast } from 'sonner';

function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [lastCreditedMinute, setLastCreditedMinute] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVideoAd, setShowVideoAd] = useState(false);
  const { addCoins, profile } = useAuth();
  const { settings } = useSettings();
  const { socialAds, videoAds } = useAds();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const coinsPerMinute = settings.coins_per_minute || 1;

  // Track watch time
  useEffect(() => {
    if (isWatching && videoId) {
      timerRef.current = setInterval(() => {
        setWatchSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWatching, videoId]);

  // Auto-credit coins every minute
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

  const handleSearch = () => {
    const id = extractVideoId(url);
    if (id) {
      setVideoId(id);
      setWatchSeconds(0);
      setEarnedCoins(0);
      setLastCreditedMinute(0);
      setIsWatching(false);
      // Show video ad before playing
      if (videoAds.length > 0) {
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

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progressToNextCoin = ((watchSeconds % 60) / 60) * 100;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      {showVideoAd && (
        <VideoAdOverlay ads={videoAds} onComplete={() => setShowVideoAd(false)} />
      )}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Social Ads */}
        <SocialAdBanner ads={socialAds} page="home" />
        {/* Search */}
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
            {/* Video Player */}
            <div
              ref={videoContainerRef}
              className="relative aspect-video rounded-xl overflow-hidden bg-muted shadow-lg border border-border"
            >
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0&modestbranding=1&fs=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                title="YouTube Video"
              />
              <button
                onClick={toggleFullscreen}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-lg p-2 transition-colors z-10"
              >
                <Maximize2 size={16} />
              </button>
            </div>

            {/* Watch Controls */}
            <Card className="overflow-hidden">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => setIsWatching(!isWatching)}
                    variant={isWatching ? 'destructive' : 'default'}
                    className="gap-2"
                  >
                    {isWatching ? (
                      <><Timer size={16} /> Pause Timer</>
                    ) : (
                      <><Play size={16} /> Start Watching</>
                    )}
                  </Button>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{formatTime(watchSeconds)}</p>
                    <p className="text-xs text-muted-foreground">Watch Time</p>
                  </div>
                </div>

                {/* Progress to next coin */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Next coin in {60 - (watchSeconds % 60)}s</span>
                    <span>{coinsPerMinute} coin/min</span>
                  </div>
                  <Progress value={progressToNextCoin} className="h-2" />
                </div>

                {/* Earned display */}
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
