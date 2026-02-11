import { useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Play, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
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
  const [rewarded, setRewarded] = useState<Set<string>>(new Set());
  const { addCoins } = useAuth();
  const { settings } = useSettings();

  const handleSearch = () => {
    const id = extractVideoId(url);
    if (id) {
      setVideoId(id);
    } else {
      toast.error('Please enter a valid YouTube URL');
    }
  };

  const handleComplete = () => {
    if (videoId && !rewarded.has(videoId)) {
      addCoins(settings.coinValue);
      setRewarded(prev => new Set(prev).add(videoId));
      toast.success(`+${settings.coinValue} coins earned! 🎉`);
    } else if (videoId && rewarded.has(videoId)) {
      toast.info('Already earned coins for this video');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Paste a YouTube video link and watch to earn coins
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon" className="shrink-0">
                <Search size={18} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {videoId && (
          <div className="space-y-4">
            <div className="aspect-video rounded-xl overflow-hidden bg-muted shadow-md">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0&modestbranding=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                title="YouTube Video"
              />
            </div>

            <Button
              onClick={handleComplete}
              disabled={rewarded.has(videoId)}
              className="w-full gap-2"
              variant={rewarded.has(videoId) ? 'secondary' : 'default'}
            >
              {rewarded.has(videoId) ? (
                <>
                  <CheckCircle size={18} /> Coins Earned
                </>
              ) : (
                <>
                  <Play size={18} /> Complete & Earn +{settings.coinValue} Coins
                </>
              )}
            </Button>
          </div>
        )}

        {!videoId && (
          <div className="text-center py-16 text-muted-foreground">
            <Play size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Start Watching</p>
            <p className="text-sm">Paste a YouTube link above to begin earning</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
