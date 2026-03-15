import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminBottomNav from '@/components/AdminBottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, Snowflake, Eye, MousePointer, SkipForward, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAds, type AdAnalytics } from '@/hooks/useAds';

export default function AdDetail() {
  const { adType, adId } = useParams<{ adType: string; adId: string }>();
  const navigate = useNavigate();
  const { socialAds, videoAds, imageAds, deleteVideoAd, deleteSocialAd, deleteImageAd, freezeImageAd, freezeVideoAd, freezeSocialAd, getAdAnalytics } = useAds();
  const [analytics, setAnalytics] = useState<AdAnalytics | null>(null);
  const [freezeDays, setFreezeDays] = useState('7');
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const ad = adType === 'video'
    ? videoAds.find(a => a.id === adId)
    : adType === 'social'
    ? socialAds.find(a => a.id === adId)
    : imageAds.find(a => a.id === adId);

  useEffect(() => {
    if (!adId) return;
    const load = async () => {
      const data = await getAdAnalytics(adId);
      setAnalytics(data);
      setLoadingAnalytics(false);
    };
    load();
    const interval = setInterval(load, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, [adId]);

  const handleDelete = async () => {
    if (!adId || !adType) return;
    if (adType === 'video') await deleteVideoAd(adId);
    else if (adType === 'social') await deleteSocialAd(adId);
    else await deleteImageAd(adId);
    toast.success('Ad deleted');
    navigate('/admin/ads');
  };

  const handleFreeze = async () => {
    if (!adId || !adType) return;
    const days = parseInt(freezeDays) || 7;
    if (adType === 'video') await freezeVideoAd(adId, days);
    else if (adType === 'social') await freezeSocialAd(adId, days);
    else await freezeImageAd(adId, days);
    toast.success(`Ad frozen for ${days} days`);
    navigate('/admin/ads');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/ads')}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold">Ad Details</h1>
        <Badge variant="secondary" className="ml-auto capitalize">{adType}</Badge>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Preview */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Preview</CardTitle></CardHeader>
          <CardContent>
            {adType === 'video' && ad && (
              <video src={(ad as any).video_url} controls className="w-full rounded-lg" />
            )}
            {adType === 'image' && ad && (
              <img src={(ad as any).image_url} alt="Ad" className="w-full rounded-lg" />
            )}
            {adType === 'social' && ad && (
              <div className="bg-muted p-3 rounded-lg text-xs font-mono overflow-auto max-h-32">
                {(ad as any).code}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardContent className="p-4 space-y-2 text-sm">
            {ad && 'redirect_link' in ad && (
              <div>
                <span className="text-muted-foreground">Link: </span>
                <span className="break-all">{(ad as any).redirect_link || 'None'}</span>
              </div>
            )}
            {ad && (
              <>
                <div><span className="text-muted-foreground">Page: </span>{(ad as any).page}</div>
                <div><span className="text-muted-foreground">Duration: </span>{(ad as any).duration}{adType === 'social' ? ' days' : 's'}</div>
                <div><span className="text-muted-foreground">Created: </span>{new Date((ad as any).created_at).toLocaleDateString()}</div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Button variant="destructive" className="w-full gap-2" onClick={handleDelete}>
              <Trash2 size={16} /> Delete Ad
            </Button>
            <div className="flex gap-2">
              <Input type="number" value={freezeDays} onChange={e => setFreezeDays(e.target.value)} className="w-24" placeholder="Days" />
              <Button variant="secondary" className="flex-1 gap-2" onClick={handleFreeze}>
                <Snowflake size={16} /> Freeze
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Analytics Dashboard */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Live Analytics</CardTitle></CardHeader>
          <CardContent>
            {loadingAnalytics ? (
              <div className="flex justify-center py-6">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <Eye size={18} className="mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{analytics?.views || 0}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <MousePointer size={18} className="mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{analytics?.clicks || 0}</p>
                  <p className="text-xs text-muted-foreground">Clicks</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <SkipForward size={18} className="mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{analytics?.skips || 0}</p>
                  <p className="text-xs text-muted-foreground">Skips</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <Clock size={18} className="mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{analytics?.total_watch_time || 0}s</p>
                  <p className="text-xs text-muted-foreground">Watch Time</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <AdminBottomNav />
    </div>
  );
}
