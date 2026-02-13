import { useState } from 'react';
import AdminBottomNav from '@/components/AdminBottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAds } from '@/hooks/useAds';

export default function AdminAds() {
  const { socialAds, videoAds, loading, addSocialAd, deleteSocialAd, addVideoAd, deleteVideoAd } = useAds();
  const [adCode, setAdCode] = useState('');
  const [adPage, setAdPage] = useState('home');
  const [adDuration, setAdDuration] = useState('30');
  const [videoUrl, setVideoUrl] = useState('');
  const [redirectLink, setRedirectLink] = useState('');
  const [videoDuration, setVideoDuration] = useState('15');

  const handleAddSocial = async () => {
    if (!adCode.trim()) { toast.error('Enter ad code'); return; }
    await addSocialAd(adCode, adPage, Number(adDuration));
    setAdCode('');
    toast.success('Social ad added');
  };

  const handleAddVideo = async () => {
    if (!videoUrl.trim()) { toast.error('Enter video URL'); return; }
    await addVideoAd(videoUrl, redirectLink, Number(videoDuration));
    setVideoUrl('');
    setRedirectLink('');
    toast.success('Video ad added');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4"><h1 className="text-xl font-bold">Ads Manager</h1></header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Social Media Ads</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea placeholder="Ad embed code..." value={adCode} onChange={e => setAdCode(e.target.value)} />
            <div className="flex gap-2">
              <Select value={adPage} onValueChange={setAdPage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Days" value={adDuration} onChange={e => setAdDuration(e.target.value)} className="w-20" />
              <Button onClick={handleAddSocial} size="icon"><Plus size={16} /></Button>
            </div>
            {socialAds.map(ad => (
              <div key={ad.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <span className="text-sm truncate flex-1">{ad.page} · {ad.duration}d</span>
                <Button variant="ghost" size="icon" onClick={() => deleteSocialAd(ad.id)}><Trash2 size={14} /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Direct Video Ads</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Video URL" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
            <Input placeholder="Redirect link" value={redirectLink} onChange={e => setRedirectLink(e.target.value)} />
            <div className="flex gap-2">
              <Input type="number" placeholder="Duration (sec)" value={videoDuration} onChange={e => setVideoDuration(e.target.value)} />
              <Button onClick={handleAddVideo}><Plus size={16} className="mr-1" /> Add</Button>
            </div>
            {videoAds.map(ad => (
              <div key={ad.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <span className="text-sm truncate flex-1">{ad.duration}s · {ad.redirect_link || 'No link'}</span>
                <Button variant="ghost" size="icon" onClick={() => deleteVideoAd(ad.id)}><Trash2 size={14} /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
      <AdminBottomNav />
    </div>
  );
}
