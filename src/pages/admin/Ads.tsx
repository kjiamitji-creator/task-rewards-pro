import { useState } from 'react';
import AdminBottomNav from '@/components/AdminBottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface SocialAd { id: string; code: string; page: string; duration: number; }
interface VideoAd { id: string; videoUrl: string; redirectLink: string; duration: number; }

export default function AdminAds() {
  const [socialAds, setSocialAds] = useState<SocialAd[]>(() => JSON.parse(localStorage.getItem('socialAds') || '[]'));
  const [videoAds, setVideoAds] = useState<VideoAd[]>(() => JSON.parse(localStorage.getItem('videoAds') || '[]'));
  const [adCode, setAdCode] = useState('');
  const [adPage, setAdPage] = useState('home');
  const [adDuration, setAdDuration] = useState('30');
  const [videoUrl, setVideoUrl] = useState('');
  const [redirectLink, setRedirectLink] = useState('');
  const [videoDuration, setVideoDuration] = useState('15');

  const addSocialAd = () => {
    if (!adCode.trim()) { toast.error('Enter ad code'); return; }
    const ad: SocialAd = { id: Math.random().toString(36).substring(2), code: adCode, page: adPage, duration: Number(adDuration) };
    const updated = [...socialAds, ad];
    setSocialAds(updated);
    localStorage.setItem('socialAds', JSON.stringify(updated));
    setAdCode('');
    toast.success('Social ad added');
  };

  const deleteSocialAd = (id: string) => {
    const updated = socialAds.filter(a => a.id !== id);
    setSocialAds(updated);
    localStorage.setItem('socialAds', JSON.stringify(updated));
  };

  const addVideoAd = () => {
    if (!videoUrl.trim()) { toast.error('Enter video URL'); return; }
    const ad: VideoAd = { id: Math.random().toString(36).substring(2), videoUrl, redirectLink, duration: Number(videoDuration) };
    const updated = [...videoAds, ad];
    setVideoAds(updated);
    localStorage.setItem('videoAds', JSON.stringify(updated));
    setVideoUrl('');
    setRedirectLink('');
    toast.success('Video ad added');
  };

  const deleteVideoAd = (id: string) => {
    const updated = videoAds.filter(a => a.id !== id);
    setVideoAds(updated);
    localStorage.setItem('videoAds', JSON.stringify(updated));
  };

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
              <Button onClick={addSocialAd} size="icon"><Plus size={16} /></Button>
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
              <Button onClick={addVideoAd}><Plus size={16} className="mr-1" /> Add</Button>
            </div>
            {videoAds.map(ad => (
              <div key={ad.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <span className="text-sm truncate flex-1">{ad.duration}s · {ad.redirectLink || 'No link'}</span>
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
