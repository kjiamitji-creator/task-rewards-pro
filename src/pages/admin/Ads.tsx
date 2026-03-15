import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminBottomNav from '@/components/AdminBottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Trash2, Plus, Loader2, Upload, Video, Code, CheckCircle, Image, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useAds } from '@/hooks/useAds';

type TabType = 'video' | 'social' | 'image';

export default function AdminAds() {
  const navigate = useNavigate();
  const {
    socialAds, videoAds, imageAds, loading,
    addSocialAd, deleteSocialAd,
    addVideoAd, deleteVideoAd,
    addImageAd, deleteImageAd,
    uploadVideoFile, uploadImageFile,
  } = useAds();

  const [activeTab, setActiveTab] = useState<TabType>('video');

  // Social ad state
  const [adCode, setAdCode] = useState('');
  const [adPage, setAdPage] = useState('home');
  const [adDuration, setAdDuration] = useState('30');
  const [addingSocial, setAddingSocial] = useState(false);

  // Video ad state
  const [videoPage, setVideoPage] = useState('home');
  const [redirectLink, setRedirectLink] = useState('');
  const [videoDuration, setVideoDuration] = useState('15');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image ad state
  const [imagePage, setImagePage] = useState('home');
  const [imageRedirectLink, setImageRedirectLink] = useState('');
  const [imageDuration, setImageDuration] = useState('10');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState('');
  const [creatingImage, setCreatingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleAddSocial = async () => {
    if (!adCode.trim()) { toast.error('Enter ad code'); return; }
    setAddingSocial(true);
    try {
      await addSocialAd(adCode, adPage, Number(adDuration));
      setAdCode('');
      toast.success('Social ad added');
    } catch (err: any) {
      toast.error('Failed: ' + (err.message || 'Unknown error'));
    }
    setAddingSocial(false);
  };

  const handleSelectVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) { toast.error('Select a video file'); return; }
    setUploading(true);
    setUploadProgress(0);
    setUploadedFileName(file.name);
    const url = await uploadVideoFile(file, p => setUploadProgress(p));
    if (url) { setUploadedVideoUrl(url); toast.success('Video uploaded!'); }
    else { toast.error('Upload failed'); setUploadedFileName(''); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateVideoAd = async () => {
    if (!uploadedVideoUrl) { toast.error('Upload a video first'); return; }
    setCreating(true);
    try {
      await addVideoAd(uploadedVideoUrl, redirectLink, Number(videoDuration), videoPage);
      setUploadedVideoUrl(null); setUploadedFileName(''); setRedirectLink('');
      toast.success('Video ad created!');
    } catch (err: any) { toast.error('Failed: ' + (err.message || 'Unknown error')); }
    setCreating(false);
  };

  const handleSelectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Select an image file'); return; }
    setUploadingImage(true);
    setImageUploadProgress(0);
    setUploadedImageName(file.name);
    const url = await uploadImageFile(file, p => setImageUploadProgress(p));
    if (url) { setUploadedImageUrl(url); toast.success('Image uploaded!'); }
    else { toast.error('Upload failed'); setUploadedImageName(''); }
    setUploadingImage(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleCreateImageAd = async () => {
    if (!uploadedImageUrl) { toast.error('Upload an image first'); return; }
    setCreatingImage(true);
    try {
      await addImageAd(uploadedImageUrl, imageRedirectLink, Number(imageDuration), imagePage);
      setUploadedImageUrl(null); setUploadedImageName(''); setImageRedirectLink('');
      toast.success('Image ad created!');
    } catch (err: any) { toast.error('Failed: ' + (err.message || 'Unknown error')); }
    setCreatingImage(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'video', label: 'Video', icon: Video },
    { key: 'social', label: 'Social', icon: Code },
    { key: 'image', label: 'Image', icon: Image },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold">Ads Manager</h1>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-card border-b border-border">
        <div className="flex max-w-lg mx-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* VIDEO TAB */}
        {activeTab === 'video' && (
          <>
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground">Upload Video</p>
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleSelectVideo} />
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} variant={uploadedVideoUrl ? 'outline' : 'default'} className="w-full gap-2">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : uploadedVideoUrl ? <CheckCircle size={16} /> : <Upload size={16} />}
                  {uploading ? `Uploading... ${uploadProgress}%` : uploadedVideoUrl ? `Uploaded: ${uploadedFileName}` : 'Select & Upload Video'}
                </Button>
                {uploading && <Progress value={uploadProgress} className="h-2" />}

                <Select value={videoPage} onValueChange={setVideoPage}>
                  <SelectTrigger><SelectValue placeholder="Page" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="profile">Profile</SelectItem>
                    <SelectItem value="rewards">Rewards</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Redirect link" value={redirectLink} onChange={e => setRedirectLink(e.target.value)} />
                <Input type="number" placeholder="Duration (seconds)" value={videoDuration} onChange={e => setVideoDuration(e.target.value)} />
                <Button onClick={handleCreateVideoAd} disabled={!uploadedVideoUrl || creating} className="w-full gap-2">
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {creating ? 'Creating...' : 'Create Video Ad'}
                </Button>
              </CardContent>
            </Card>

            {videoAds.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Active Video Ads ({videoAds.length})</p>
                {videoAds.map(ad => (
                  <Card key={ad.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/admin/ads/video/${ad.id}`)}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <span className="text-sm truncate flex-1"><Video size={12} className="inline mr-1" />{ad.page} · {ad.duration}s</span>
                      <Eye size={14} className="text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* SOCIAL TAB */}
        {activeTab === 'social' && (
          <>
            <Card>
              <CardContent className="p-4 space-y-3">
                <Textarea placeholder="Paste ad embed code..." value={adCode} onChange={e => setAdCode(e.target.value)} rows={4} />
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
                  <Button onClick={handleAddSocial} size="icon" disabled={addingSocial}>
                    {addingSocial ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {socialAds.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Active Social Ads ({socialAds.length})</p>
                {socialAds.map(ad => (
                  <Card key={ad.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/admin/ads/social/${ad.id}`)}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <span className="text-sm truncate flex-1"><Code size={12} className="inline mr-1" />{ad.page} · {ad.duration}d</span>
                      <Eye size={14} className="text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* IMAGE TAB */}
        {activeTab === 'image' && (
          <>
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground">Upload Image</p>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleSelectImage} />
                <Button onClick={() => imageInputRef.current?.click()} disabled={uploadingImage} variant={uploadedImageUrl ? 'outline' : 'default'} className="w-full gap-2">
                  {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : uploadedImageUrl ? <CheckCircle size={16} /> : <Upload size={16} />}
                  {uploadingImage ? `Uploading... ${imageUploadProgress}%` : uploadedImageUrl ? `Uploaded: ${uploadedImageName}` : 'Select & Upload Image'}
                </Button>
                {uploadingImage && <Progress value={imageUploadProgress} className="h-2" />}

                <Input placeholder="Redirect link (click destination)" value={imageRedirectLink} onChange={e => setImageRedirectLink(e.target.value)} />
                <Input type="number" placeholder="Timer (seconds)" value={imageDuration} onChange={e => setImageDuration(e.target.value)} />
                <Select value={imagePage} onValueChange={setImagePage}>
                  <SelectTrigger><SelectValue placeholder="Page" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home (before video)</SelectItem>
                    <SelectItem value="wallet">Wallet (on withdraw)</SelectItem>
                    <SelectItem value="rewards">Rewards (on claim)</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCreateImageAd} disabled={!uploadedImageUrl || creatingImage} className="w-full gap-2">
                  {creatingImage ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {creatingImage ? 'Creating...' : 'Create Image Ad'}
                </Button>
              </CardContent>
            </Card>

            {imageAds.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Active Image Ads ({imageAds.length})</p>
                {imageAds.map(ad => (
                  <Card key={ad.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/admin/ads/image/${ad.id}`)}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <span className="text-sm truncate flex-1"><Image size={12} className="inline mr-1" />{ad.page} · {ad.duration}s</span>
                      <Eye size={14} className="text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <AdminBottomNav />
    </div>
  );
}
