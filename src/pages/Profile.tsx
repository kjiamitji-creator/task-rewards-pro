import { useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useAds } from '@/hooks/useAds';
import { ImageAdOverlay, preloadImageAds } from '@/components/ImageAdOverlay';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User as UserIcon, Copy, Share2, Edit, Trophy, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function Profile() {
  const { profile, updateProfile, logout } = useAuth();
  const { imageAds, trackAdEvent } = useAds();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [state, setState] = useState(profile?.state || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [showImageAd, setShowImageAd] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);

  useEffect(() => {
    if (imageAds.length > 0) preloadImageAds(imageAds);
  }, [imageAds]);

  if (!profile) return null;

  const referralLink = `${window.location.origin}/register?ref=${profile.referral_code}`;

  const handleSave = async () => {
    // Show image ad before saving if available
    const profileImageAds = imageAds.filter(a => a.page === 'profile');
    if (profileImageAds.length > 0 && !pendingSave) {
      setPendingSave(true);
      setShowImageAd(true);
      return;
    }
    await executeSave();
  };

  const executeSave = async () => {
    await updateProfile({ name, state, country });
    setEditing(false);
    setPendingSave(false);
    toast.success('Profile updated!');
  };

  const handleImageAdComplete = () => {
    setShowImageAd(false);
    if (pendingSave) {
      executeSave();
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(profile.referral_code || '');
    toast.success('Referral code copied!');
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      {showImageAd && (
        <ImageAdOverlay ads={imageAds} page="profile" onComplete={handleImageAdComplete} trackEvent={trackAdEvent} />
      )}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <UserIcon size={28} className="text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold truncate">{profile.name}</h2>
                <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">State</p>
                <p className="font-medium">{profile.state || '—'}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Country</p>
                <p className="font-medium">{profile.country || '—'}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Currency</p>
                <p className="font-medium">{profile.currency}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Tasks Done</p>
                <p className="font-medium">{profile.completed_tasks}</p>
              </div>
            </div>

            <Dialog open={editing} onOpenChange={setEditing}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-4 gap-2">
                  <Edit size={16} /> Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
                  <Input placeholder="State" value={state} onChange={e => setState(e.target.value)} />
                  <Input placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} />
                  <Button onClick={handleSave} className="w-full">Save Changes</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Share2 size={18} /> Referral Program
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Your Referral Code</p>
                <div className="flex items-center gap-2">
                  <Input value={profile.referral_code} readOnly className="font-mono text-lg font-bold" />
                  <Button variant="outline" size="icon" onClick={copyReferralCode}><Copy size={16} /></Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Your Referral Link</p>
                <div className="flex items-center gap-2">
                  <Input value={referralLink} readOnly className="text-xs" />
                  <Button variant="outline" size="icon" onClick={copyReferralLink}><LinkIcon size={16} /></Button>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-primary/5 rounded-lg p-3">
                <Trophy size={20} className="text-primary" />
                <div>
                  <p className="font-semibold">Referral Program</p>
                  <p className="text-xs text-muted-foreground">+10 coins per referral</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button variant="destructive" className="w-full" onClick={() => logout()}>Logout</Button>
      </main>
      <BottomNav />
    </div>
  );
}
