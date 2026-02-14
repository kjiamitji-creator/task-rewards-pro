import { useState, useRef } from 'react';
import AdminBottomNav from '@/components/AdminBottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Loader2, Upload, Video, Code } from 'lucide-react';
import { toast } from 'sonner';
import { useAds } from '@/hooks/useAds';

export default function AdminAds() {
  const { socialAds, videoAds, loading, addSocialAd, deleteSocialAd, addVideoAd, deleteVideoAd, uploadVideoFile } = useAds();
  const [adCode, setAdCode] = useState('');
  const [adPage, setAdPage] = useState('home');
  const [adDuration, setAdDuration] = useState('30');
  const [videoPage, setVideoPage] = useState('home');
  const [redirectLink, setRedirectLink] = useState('');
  const [videoDuration, setVideoDuration] = useState('15');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSocial = async () => {
    if (!adCode.trim()) { toast.error('Enter ad code'); return; }
    await addSocialAd(adCode, adPage, Number(adDuration));
    setAdCode('');
    toast.success('Social ad added');
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }
    setUploading(true);
    const url = await uploadVideoFile(file);
    if (url) {
      await addVideoAd(url, redirectLink, Number(videoDuration), videoPage);
      setRedirectLink('');
      toast.success('Video ad uploaded & added');
    } else {
      toast.error('Upload failed');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        {/* Social / Code Ads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Code size={18} /> Code Ads (AdSense, etc.)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea placeholder="Paste ad embed code here..." value={adCode} onChange={e => setAdCode(e.target.value)} rows={4} />
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
                <span className="text-sm truncate flex-1"><Code size={12} className="inline mr-1" />{ad.page} · {ad.duration}d</span>
                <Button variant="ghost" size="icon" onClick={() => deleteSocialAd(ad.id)}><Trash2 size={14} /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Direct Video Upload Ads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Video size={18} /> Video Ads (Direct Upload)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={videoPage} onValueChange={setVideoPage}>
              <SelectTrigger><SelectValue placeholder="Select page" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
                <SelectItem value="profile">Profile</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Redirect link (click destination)" value={redirectLink} onChange={e => setRedirectLink(e.target.value)} />
            <Input type="number" placeholder="Duration (seconds)" value={videoDuration} onChange={e => setVideoDuration(e.target.value)} />
            <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full gap-2"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading ? 'Uploading...' : 'Upload Video'}
            </Button>
            {videoAds.map(ad => (
              <div key={ad.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <span className="text-sm truncate flex-1">
                  <Video size={12} className="inline mr-1" />{ad.page} · {ad.duration}s · {ad.redirect_link || 'No link'}
                </span>
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
