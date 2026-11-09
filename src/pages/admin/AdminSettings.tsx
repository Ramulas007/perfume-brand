import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, Sun, CreditCard, Phone, FileText, Share2, MapPin, Mail, X, ImageIcon, Globe, Type, Smartphone, Bell, Eye, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { APKManagement } from '@/components/admin/APKManagement';
import { AdminNotifications } from '@/components/admin/AdminNotifications';
import { MobileNavSettings } from '@/components/admin/MobileNavSettings';
import { AdminMobileNavSettings } from '@/components/admin/AdminMobileNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toCdnUrl, brandedFileName } from '@/lib/cdn';
import { compressProductImage } from '@/lib/imageCompress';

interface SiteSetting {
  id: string;
  key: string;
  value: any;
}

export const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('site');
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingLoader, setUploadingLoader] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [showLoaderPreview, setShowLoaderPreview] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const loaderInputRef = useRef<HTMLInputElement>(null);
  const ogImageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [siteName, setSiteName] = useState('Helpful Perfumes');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [seoSettings, setSeoSettings] = useState({
    title: 'Helpful Perfumes | Bangladesh\'s Premium Perfume Store',
    description: 'Discover authentic perfumes, fragrances, attars, and decants from Helpful Perfumes with nationwide delivery across Bangladesh.',
    ogImage: '',
    siteName: 'Helpful Perfumes'
  });
  const [headerContent, setHeaderContent] = useState({
    phone: '(880) 123 456 789',
    tagline: 'standard delivery on all orders.',
  });
  const [announcementBar, setAnnouncementBar] = useState({
    enabled: false,
    text: '',
    link: '',
  });
  const [paymentMethods, setPaymentMethods] = useState({
    bkash: true,
    nagad: true,
    roket: true,
    cod: true,
  });
  const [paymentNumbers, setPaymentNumbers] = useState({
    bkash: '01XXXXXXXXX',
    nagad: '01XXXXXXXXX',
    rocket: '01XXXXXXXXX',
  });
  const [footerContent, setFooterContent] = useState({
    tagline: 'Empowering Muslim lifestyle since 2016.',
    phone: '09617827080',
    email: 'oneummahbd@gmail.com',
    address: 'Dhaka, BD',
    copyright: 'Helpful Perfumes',
  });
  const [loaderLogoUrl, setLoaderLogoUrl] = useState('');
  const [loaderSettings, setLoaderSettings] = useState({
    rotationSpeed: 2,
    glowEnabled: true,
    pulseEnabled: true,
    backgroundColor: '#ffffff',
  });
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    instagram: '',
    youtube: '',
    linkedin: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      
      setSettings(data || []);
      
      data?.forEach((setting) => {
        if (setting.key === 'site_name') {
          const val = setting.value as any;
          setSiteName(val?.name || 'Helpful Perfumes');
        }
        if (setting.key === 'logo') {
          const val = setting.value as any;
          setLogoUrl(val?.url || '');
        }
        if (setting.key === 'favicon') {
          const val = setting.value as any;
          setFaviconUrl(val?.url || '');
        }
        if (setting.key === 'header_content') {
          const val = setting.value as any;
          if (val) {
            setHeaderContent({
              phone: val.phone || '(880) 123 456 789',
              tagline: val.tagline || 'standard delivery on all orders.',
            });
          }
        }
        if (setting.key === 'announcement_bar') {
          const val = setting.value as any;
          if (val) {
            setAnnouncementBar({
              enabled: Boolean(val.enabled),
              text: val.text || '',
              link: val.link || '',
            });
          }
        }
        if (setting.key === 'payment_methods') {
          const methods = (setting.value as string[]) || [];
          setPaymentMethods({
            bkash: methods.includes('bkash'),
            nagad: methods.includes('nagad'),
            roket: methods.includes('roket'),
            cod: methods.includes('cod'),
          });
        }
        if (setting.key === 'payment_numbers') {
          const numbers = setting.value as any;
          setPaymentNumbers({
            bkash: numbers?.bkash || '01XXXXXXXXX',
            nagad: numbers?.nagad || '01XXXXXXXXX',
            rocket: numbers?.rocket || '01XXXXXXXXX',
          });
        }
        if (setting.key === 'footer_content') {
          const content = setting.value as any;
          if (content) {
            setFooterContent({
              tagline: content.tagline || 'Empowering Muslim lifestyle since 2016.',
              phone: content.phone || '09617827080',
              email: content.email || 'oneummahbd@gmail.com',
              address: content.address || 'Dhaka, BD',
              copyright: content.copyright || 'Helpful Perfumes',
            });
          }
        }
        if (setting.key === 'social_links') {
          const links = setting.value as any;
          if (links) {
            setSocialLinks({
              facebook: links.facebook || '',
              instagram: links.instagram || '',
              youtube: links.youtube || '',
              linkedin: links.linkedin || '',
            });
          }
        }
        if (setting.key === 'loader_settings') {
          const val = setting.value as any;
          setLoaderLogoUrl(val?.loader_logo_url || '');
          setLoaderSettings({
            rotationSpeed: val?.rotationSpeed ?? 2,
            glowEnabled: val?.glowEnabled ?? true,
            pulseEnabled: val?.pulseEnabled ?? true,
            backgroundColor: val?.backgroundColor || '#ffffff',
          });
        }
        if (setting.key === 'seo_settings') {
          const val = setting.value as any;
          if (val) {
            setSeoSettings({
              title: val.title || 'Helpful Perfumes | Bangladesh\'s Premium Perfume Store',
              description: val.description || 'Discover authentic perfumes, fragrances, attars, and decants from Helpful Perfumes with nationwide delivery across Bangladesh.',
              ogImage: val.ogImage || '',
              siteName: val.siteName || 'Helpful Perfumes',
            });
          }
        }
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({ title: 'Error', description: 'Failed to fetch settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('site_settings').select('id').eq('key', key).single();
      if (existing) {
        const { error } = await supabase.from('site_settings').update({ value }).eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert({ key, value });
        if (error) throw error;
      }
      toast({ title: 'Success', description: 'Setting saved successfully' });
      
      if (key === 'logo') {
        window.dispatchEvent(new CustomEvent('site-settings-updated', { detail: { logoUrl: value?.url || '' } }));
      }
      if (key === 'site_name') {
        window.dispatchEvent(new CustomEvent('site-settings-updated', { detail: { siteName: value?.name || 'Helpful Perfumes' } }));
      }
      if (key === 'favicon') {
        window.dispatchEvent(new CustomEvent('site-settings-updated', { detail: { faviconUrl: value?.url || '' } }));
      }
      if (key === 'loader_settings') {
        window.dispatchEvent(new CustomEvent('site-settings-updated', { detail: { loaderLogoUrl: value?.loader_logo_url || '' } }));
      }
      if (key === 'seo_settings') {
        window.dispatchEvent(new CustomEvent('site-settings-updated', { detail: { seoTitle: value?.title, seoDescription: value?.description, ogImage: value?.ogImage } }));
      }
      fetchSettings();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save setting', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (
    file: File,
    bucket: string,
    prefix: string,
    onSuccess: (url: string) => void,
    setUploading: (v: boolean) => void
  ) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 2MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const converted = await compressProductImage(file);
      const fileExt = converted.name.split('.').pop();
      const fileName = brandedFileName(prefix, fileExt);
      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, converted, { contentType: converted.type });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      onSuccess(toCdnUrl(data.publicUrl));
      toast({ title: 'Uploaded', description: `${prefix} uploaded successfully` });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: error.message || 'Failed to upload', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file, 'banners', 'logo', async (url) => {
      setLogoUrl(url);
      await saveSetting('logo', { url, alt: 'Site Logo' });
    }, setUploadingLogo);
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file, 'banners', 'favicon', async (url) => {
      setFaviconUrl(url);
      await saveSetting('favicon', { url });
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) link.href = url;
    }, setUploadingFavicon);
  };

  const handleLoaderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file, 'banners', 'loader', async (url) => {
      setLoaderLogoUrl(url);
      await saveSetting('loader_settings', { ...loaderSettings, loader_logo_url: url });
    }, setUploadingLoader);
  };

  const handleRemoveLoader = () => {
    setLoaderLogoUrl('');
    if (loaderInputRef.current) loaderInputRef.current.value = '';
    saveSetting('loader_settings', { ...loaderSettings, loader_logo_url: '' });
  };

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file, 'banners', 'seo-og', async (url) => {
      const updated = { ...seoSettings, ogImage: url };
      setSeoSettings(updated);
      await saveSetting('seo_settings', updated);
    }, setUploadingOgImage);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your site, SEO, branding and integrations.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-16 z-20 -mx-4 md:mx-0 px-4 md:px-0 bg-background/80 backdrop-blur-xl pb-2">
          <div className="overflow-x-auto scrollbar-none">
            <TabsList className="inline-flex w-auto min-w-full md:w-full md:grid md:grid-cols-6 h-12 p-1 bg-secondary/70 border border-border rounded-xl">
              {[
                { v: 'site', label: 'Site', Icon: Globe },
                { v: 'seo', label: 'SEO', Icon: Search },
                { v: 'loader', label: 'Loader', Icon: Sun },
                { v: 'mobile-nav', label: 'Mobile Nav', Icon: Smartphone },
                { v: 'notifications', label: 'Alerts', Icon: Bell },
                { v: 'apk', label: 'APK', Icon: Smartphone },
              ].map(({ v, label, Icon }) => (
                <TabsTrigger
                  key={v}
                  value={v}
                  className="flex-1 min-w-[90px] md:min-w-0 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground"
                >
                  <Icon size={15} /> {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>


        <TabsContent value="site" className="space-y-8 max-w-2xl mt-0">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Type size={24} className="text-primary" />
              <h3 className="text-lg font-semibold">Website Name</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">এই নামটি সাইটের সব জায়গায় দেখাবে</p>
            <div className="space-y-4">
              <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Site Name" />
              <Button onClick={() => saveSetting('site_name', { name: siteName })} disabled={saving}>
                <Save size={16} className="mr-2" /> Save Site Name
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload size={24} className="text-primary" />
              <h3 className="text-lg font-semibold">Logo</h3>
            </div>
            <div className="space-y-4">
              {logoUrl && <img src={logoUrl} alt="Logo" className="max-h-20 mb-4" />}
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <Button onClick={() => logoInputRef.current?.click()} variant="outline" disabled={uploadingLogo}>
                <Upload size={16} className="mr-2" /> {logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe size={24} className="text-primary" />
              <h3 className="text-lg font-semibold">Favicon</h3>
            </div>
            <div className="space-y-4">
              {faviconUrl && <img src={faviconUrl} alt="Favicon" className="w-8 h-8 mb-4" />}
              <input ref={faviconInputRef} type="file" accept="image/*" onChange={handleFaviconUpload} className="hidden" />
              <Button onClick={() => faviconInputRef.current?.click()} variant="outline" disabled={uploadingFavicon}>
                <Upload size={16} className="mr-2" /> {faviconUrl ? 'Change Favicon' : 'Upload Favicon'}
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <Label>Announcement Bar</Label>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Switch checked={announcementBar.enabled} onCheckedChange={(v) => setAnnouncementBar(p => ({ ...p, enabled: v }))} />
                <span>Enable Announcement</span>
              </div>
              <Input value={announcementBar.text} onChange={(e) => setAnnouncementBar(p => ({ ...p, text: e.target.value }))} placeholder="Text" />
              <Input value={announcementBar.link} onChange={(e) => setAnnouncementBar(p => ({ ...p, link: e.target.value }))} placeholder="Link" />
              <Button onClick={() => saveSetting('announcement_bar', announcementBar)}>Save Announcement</Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
             <h3 className="font-semibold mb-4 flex items-center gap-2"><Phone size={18} /> Header Phone</h3>
             <Input value={headerContent.phone} onChange={(e) => setHeaderContent(p => ({ ...p, phone: e.target.value }))} />
             <Button className="mt-4" onClick={() => saveSetting('header_content', headerContent)}>Save Header</Button>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-6">
             <h3 className="font-semibold mb-4 flex items-center gap-2"><Share2 size={18} /> Social Links</h3>
             <div className="grid gap-4">
               <Input value={socialLinks.facebook} onChange={(e) => setSocialLinks(p => ({ ...p, facebook: e.target.value }))} placeholder="Facebook" />
               <Input value={socialLinks.instagram} onChange={(e) => setSocialLinks(p => ({ ...p, instagram: e.target.value }))} placeholder="Instagram" />
               <Button onClick={() => saveSetting('social_links', socialLinks)}>Save Social Links</Button>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-8 max-w-2xl mt-0">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Search size={24} className="text-primary" />
              <h3 className="text-lg font-semibold">SEO & Social Branding</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Manage how your website appears in search engines and social media shares.
            </p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Brand / Site Name</Label>
                <Input 
                  value={seoSettings.siteName} 
                  onChange={(e) => setSeoSettings(p => ({ ...p, siteName: e.target.value }))}
                  placeholder="e.g. Helpful Perfumes"
                />
                <p className="text-[10px] text-muted-foreground">Appears as the website name in search results and social snippets.</p>
              </div>

              <div className="space-y-2">
                <Label>SEO Primary Title</Label>
                <Input 
                  value={seoSettings.title} 
                  onChange={(e) => setSeoSettings(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Helpful Perfumes | Bangladesh's Premium Perfume Store..."
                />
                <p className="text-[10px] text-muted-foreground">Recommended length: 50-60 characters</p>
              </div>

              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea 
                  value={seoSettings.description} 
                  onChange={(e) => setSeoSettings(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe your brand for search results..."
                  className="min-h-[100px]"
                />
                <p className="text-[10px] text-muted-foreground">Recommended length: 150-160 characters</p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label>Social Sharing Image (OG Image)</Label>
                <p className="text-xs text-muted-foreground mb-4">
                  This image appears when you share your website on WhatsApp, Facebook, or Twitter.
                  Recommended size: 1200x630px.
                </p>
                {seoSettings.ogImage && (
                  <div className="relative aspect-[1200/630] w-full mb-4 bg-secondary rounded-lg overflow-hidden border">
                    <img src={seoSettings.ogImage} alt="SEO Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <input ref={ogImageInputRef} type="file" accept="image/*" onChange={handleOgImageUpload} className="hidden" />
                <Button onClick={() => ogImageInputRef.current?.click()} variant="outline" disabled={uploadingOgImage} className="w-full">
                  <ImageIcon size={16} className="mr-2" /> {seoSettings.ogImage ? 'Change Social Image' : 'Upload Social Image'}
                </Button>
              </div>

              <div className="pt-6">
                <Button onClick={() => saveSetting('seo_settings', seoSettings)} disabled={saving} className="w-full">
                  <Save size={16} className="mr-2" /> Save SEO Settings
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 bg-primary/5">
            <h4 className="text-sm font-bold flex items-center gap-2 mb-4">
              <Eye size={16} /> Search Appearance Preview
            </h4>
            <div className="bg-white p-4 rounded border shadow-sm max-w-md">
              <div className="text-[#5f6368] text-xs mb-1 truncate">{seoSettings.siteName}</div>
              <div className="text-[#1a0dab] text-xl font-medium truncate mb-1">{seoSettings.title}</div>
              <div className="text-[#006621] text-sm truncate mb-1">https://staticvibes.site</div>
              <div className="text-[#545454] text-sm line-clamp-2">{seoSettings.description}</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="loader" className="space-y-8 max-w-2xl mt-0">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sun size={24} className="text-primary" />
              <h3 className="text-lg font-semibold">Loader Settings</h3>
            </div>
            <div className="space-y-6">
              <Label>Loader Icon</Label>
              <div className="flex flex-col gap-4">
                {loaderLogoUrl ? (
                  <div className="relative inline-block w-32">
                    <img src={loaderLogoUrl} alt="Loader" className="max-h-32 object-contain border p-2" />
                    <button onClick={handleRemoveLoader} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"><X size={14} /></button>
                  </div>
                ) : (
                  <div 
                    onClick={() => loaderInputRef.current?.click()} 
                    className="border-2 border-dashed h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 rounded-xl"
                  >
                    <ImageIcon className="text-muted-foreground mb-2" />
                    <span className="text-xs">Click to upload icon</span>
                  </div>
                )}
                <input ref={loaderInputRef} type="file" accept="image/*" onChange={handleLoaderUpload} className="hidden" />
              </div>

              <div className="grid gap-4 pt-4 border-t">
                <div>
                  <Label>Rotation Speed (seconds)</Label>
                  <Input type="number" step="0.5" value={loaderSettings.rotationSpeed} onChange={(e) => setLoaderSettings(p => ({ ...p, rotationSpeed: parseFloat(e.target.value) }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Glow Effect</Label>
                  <Switch checked={loaderSettings.glowEnabled} onCheckedChange={(v) => setLoaderSettings(p => ({ ...p, glowEnabled: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Pulse Text</Label>
                  <Switch checked={loaderSettings.pulseEnabled} onCheckedChange={(v) => setLoaderSettings(p => ({ ...p, pulseEnabled: v }))} />
                </div>
                <Button onClick={() => saveSetting('loader_settings', { ...loaderSettings, loader_logo_url: loaderLogoUrl })}>
                  Save Loader Settings
                </Button>
                <Button variant="secondary" onClick={() => setShowLoaderPreview(true)}>
                  Preview Animation
                </Button>
              </div>
            </div>
          </div>

          {showLoaderPreview && (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
              <button onClick={() => setShowLoaderPreview(false)} className="absolute top-8 right-8"><X size={24} /></button>
              <motion.img 
                src={loaderLogoUrl || logoUrl} 
                className="w-32 h-32 object-contain"
                animate={{ rotate: 360 }}
                transition={{ duration: loaderSettings.rotationSpeed, repeat: Infinity, ease: "linear" }}
              />
              <p className="mt-8 animate-pulse uppercase tracking-widest">Loading...</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="mobile-nav" className="space-y-6">
          <MobileNavSettings />
          <AdminMobileNavSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <AdminNotifications />
        </TabsContent>

        <TabsContent value="apk">
          <div className="max-w-2xl">
            <APKManagement />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
