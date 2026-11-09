import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User as UserIcon, Mail, Lock, Image as ImageIcon, Moon, Sun, LogOut,
  ChevronDown, Pencil, Trash2, Upload, ShieldCheck, Loader2, Check,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toCdnUrl, brandedFileName } from '@/lib/cdn';

type Section = 'profile' | 'email' | 'password' | 'avatar' | 'appearance';

export const AdminProfileMenu = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section>('profile');

  // edit name
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  // email
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // password
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  // avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // appearance
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'dark' : 'light'
  );

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      setFullName(data?.full_name || user.user_metadata?.full_name || 'Admin');
      setAvatarUrl(data?.avatar_url || null);
      setNameDraft(data?.full_name || user.user_metadata?.full_name || '');
    })();
  }, [user?.id]);

  const initials = (fullName || user?.email || 'A')
    .split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

  const openSection = (s: Section) => {
    setSection(s);
    setOpen(true);
  };

  const applyTheme = (t: 'light' | 'dark') => {
    setTheme(t);
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    try { localStorage.setItem('theme', t); } catch {}
  };

  /* ---------- Save name ---------- */
  const saveName = async () => {
    if (!user?.id || !nameDraft.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ user_id: user.id, full_name: nameDraft.trim() }, { onConflict: 'user_id' });
      if (error) throw error;
      await supabase.auth.updateUser({ data: { full_name: nameDraft.trim() } });
      setFullName(nameDraft.trim());
      toast({ title: 'Name updated' });
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    } finally {
      setSavingName(false);
    }
  };

  /* ---------- Change email ---------- */
  const changeEmail = async () => {
    if (!user?.email || !newEmail || !emailPassword) {
      toast({ title: 'Fill all fields', variant: 'destructive' });
      return;
    }
    setSavingEmail(true);
    try {
      const { error: reauth } = await supabase.auth.signInWithPassword({
        email: user.email, password: emailPassword,
      });
      if (reauth) throw new Error('Current password is incorrect');
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast({ title: 'Verification sent', description: `Confirm the change from ${newEmail}` });
      setNewEmail(''); setEmailPassword('');
    } catch (e: any) {
      toast({ title: 'Email change failed', description: e.message, variant: 'destructive' });
    } finally {
      setSavingEmail(false);
    }
  };

  /* ---------- Change password ---------- */
  const changePassword = async () => {
    if (!user?.email) return;
    if (newPwd.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (newPwd !== confirmPwd) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setSavingPwd(true);
    try {
      const { error: reauth } = await supabase.auth.signInWithPassword({
        email: user.email, password: currentPwd,
      });
      if (reauth) throw new Error('Current password is incorrect');
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      toast({ title: 'Password updated' });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (e: any) {
      toast({ title: 'Password change failed', description: e.message, variant: 'destructive' });
    } finally {
      setSavingPwd(false);
    }
  };

  /* ---------- Avatar ---------- */
  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast({ title: 'Please upload an image', variant: 'destructive' }); return;
    }
    if (f.size > 3 * 1024 * 1024) {
      toast({ title: 'Image must be under 3MB', variant: 'destructive' }); return;
    }
    setPendingFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const saveAvatar = async () => {
    if (!user?.id || !pendingFile) return;
    setUploadingAvatar(true);
    try {
      const ext = pendingFile.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${brandedFileName('avatar', ext)}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, pendingFile, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = toCdnUrl(pub.publicUrl);
      const { error } = await supabase.from('profiles')
        .upsert({ user_id: user.id, avatar_url: url }, { onConflict: 'user_id' });
      if (error) throw error;
      setAvatarUrl(url);
      setPendingFile(null); setPreviewUrl(null);
      toast({ title: 'Profile picture updated' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    if (!user?.id) return;
    try {
      await supabase.from('profiles')
        .upsert({ user_id: user.id, avatar_url: null }, { onConflict: 'user_id' });
      setAvatarUrl(null); setPreviewUrl(null); setPendingFile(null);
      toast({ title: 'Profile picture removed' });
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  /* ---------- UI ---------- */
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="group w-full text-left rounded-2xl p-3.5 bg-gradient-to-br from-white/[0.09] to-white/[0.02] border border-white/10 hover:border-white/25 hover:from-white/[0.13] transition-all backdrop-blur-sm shadow-lg shadow-black/30"
          >
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-white to-zinc-300 text-black font-semibold flex items-center justify-center overflow-hidden ring-2 ring-white/25 shadow-md">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base">{initials}</span>
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 ring-[2.5px] ring-zinc-950 flex items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                  <span className="relative w-1.5 h-1.5 rounded-full bg-white" />
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-white text-[14px] font-semibold truncate leading-tight">{fullName || 'Admin'}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-1.5 py-[3px] rounded-md bg-gradient-to-r from-amber-400/20 to-amber-500/10 border border-amber-300/20 text-[9px] font-bold text-amber-200 uppercase tracking-[0.12em]">
                    <ShieldCheck size={9} /> Admin
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400/90 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                  </span>
                </div>
              </div>
              <ChevronDown size={15} className="text-white/40 group-hover:text-white/80 group-hover:translate-y-0.5 transition-all self-center shrink-0" />
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start" sideOffset={8}
          className="w-64 bg-zinc-950/95 backdrop-blur-xl border-white/10 text-white shadow-2xl"
        >
          <DropdownMenuLabel className="text-white/50 text-[11px] uppercase tracking-widest font-medium">
            Account
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => openSection('profile')} className="gap-3 focus:bg-white/10 focus:text-white cursor-pointer">
            <UserIcon size={15} /> Profile Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openSection('profile')} className="gap-3 focus:bg-white/10 focus:text-white cursor-pointer">
            <Pencil size={15} /> Edit Name
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openSection('email')} className="gap-3 focus:bg-white/10 focus:text-white cursor-pointer">
            <Mail size={15} /> Change Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openSection('password')} className="gap-3 focus:bg-white/10 focus:text-white cursor-pointer">
            <Lock size={15} /> Change Password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openSection('avatar')} className="gap-3 focus:bg-white/10 focus:text-white cursor-pointer">
            <ImageIcon size={15} /> Change Picture
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem onClick={() => openSection('appearance')} className="gap-3 focus:bg-white/10 focus:text-white cursor-pointer">
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />} Appearance
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem onClick={signOut} className="gap-3 text-red-300 focus:bg-red-500/15 focus:text-red-200 cursor-pointer">
            <LogOut size={15} /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-lg">Account Settings</DialogTitle>
            <DialogDescription>Manage your profile, security and appearance.</DialogDescription>
          </DialogHeader>

          <Tabs value={section} onValueChange={(v) => setSection(v as Section)} className="w-full">
            <div className="px-6 pt-4">
              <TabsList className="w-full grid grid-cols-5 h-auto bg-secondary/60 p-1">
                <TabsTrigger value="profile" className="text-xs gap-1.5"><UserIcon size={13}/> Profile</TabsTrigger>
                <TabsTrigger value="email" className="text-xs gap-1.5"><Mail size={13}/> Email</TabsTrigger>
                <TabsTrigger value="password" className="text-xs gap-1.5"><Lock size={13}/> Password</TabsTrigger>
                <TabsTrigger value="avatar" className="text-xs gap-1.5"><ImageIcon size={13}/> Picture</TabsTrigger>
                <TabsTrigger value="appearance" className="text-xs gap-1.5"><Sun size={13}/> Theme</TabsTrigger>
              </TabsList>
            </div>

            <div className="px-6 py-6">
              <TabsContent value="profile" className="space-y-4 mt-0">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-700 text-white flex items-center justify-center overflow-hidden ring-2 ring-border">
                    {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <span className="font-semibold">{initials}</span>}
                  </div>
                  <div>
                    <p className="font-semibold">{fullName || 'Admin'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="Your name" />
                </div>
                <Button onClick={saveName} disabled={savingName} className="w-full">
                  {savingName ? <Loader2 size={14} className="animate-spin mr-2" /> : <Check size={14} className="mr-2" />} Save changes
                </Button>
              </TabsContent>

              <TabsContent value="email" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label>Current Email</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>New Email</Label>
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@email.com" />
                </div>
                <div className="space-y-2">
                  <Label>Current Password <span className="text-muted-foreground text-xs">(required)</span></Label>
                  <Input type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} />
                </div>
                <Button onClick={changeEmail} disabled={savingEmail} className="w-full">
                  {savingEmail && <Loader2 size={14} className="animate-spin mr-2" />} Send verification
                </Button>
              </TabsContent>

              <TabsContent value="password" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
                </div>
                <Button onClick={changePassword} disabled={savingPwd} className="w-full">
                  {savingPwd && <Loader2 size={14} className="animate-spin mr-2" />} Update password
                </Button>
              </TabsContent>

              <TabsContent value="avatar" className="space-y-4 mt-0">
                <div className="flex flex-col items-center gap-4 p-6 rounded-xl border border-dashed border-border bg-secondary/30">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-700 text-white flex items-center justify-center overflow-hidden ring-4 ring-background shadow-lg">
                    {previewUrl ? (
                      <img src={previewUrl} className="w-full h-full object-cover" />
                    ) : avatarUrl ? (
                      <img src={avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-semibold">{initials}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">PNG / JPG, max 3MB. Preview before saving.</p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={onFilePick} className="hidden" />
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={14} className="mr-2" /> Choose Image
                    </Button>
                    {pendingFile && (
                      <Button size="sm" onClick={saveAvatar} disabled={uploadingAvatar}>
                        {uploadingAvatar ? <Loader2 size={14} className="animate-spin mr-2" /> : <Check size={14} className="mr-2" />}
                        Save Picture
                      </Button>
                    )}
                    {(avatarUrl || previewUrl) && (
                      <Button variant="ghost" size="sm" onClick={removeAvatar} className="text-destructive hover:text-destructive">
                        <Trash2 size={14} className="mr-2" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-4 mt-0">
                <p className="text-sm text-muted-foreground">Choose how the admin panel looks on this device.</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => applyTheme('light')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${theme === 'light' ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/40'}`}
                  >
                    <Sun size={18} className="mb-2" />
                    <p className="font-medium text-sm">Light</p>
                    <p className="text-xs text-muted-foreground">Bright surfaces</p>
                  </button>
                  <button
                    onClick={() => applyTheme('dark')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${theme === 'dark' ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/40'}`}
                  >
                    <Moon size={18} className="mb-2" />
                    <p className="font-medium text-sm">Dark</p>
                    <p className="text-xs text-muted-foreground">Low light comfort</p>
                  </button>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="px-6 py-4 border-t bg-secondary/30">
            <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
