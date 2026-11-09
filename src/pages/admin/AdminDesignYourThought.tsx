import { useState, useEffect } from 'react';
import { Upload, Save, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { defaultDYT, DesignYourThoughtSettings } from '@/hooks/useDesignYourThought';
import { toCdnUrl, brandedFileName } from '@/lib/cdn';
import { compressProductImage } from '@/lib/imageCompress';

export const AdminDesignYourThought = () => {
  const [settings, setSettings] = useState<DesignYourThoughtSettings>(defaultDYT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'design_your_thought')
        .maybeSingle();
      if (error) throw error;
      if (data?.value) {
        setSettings({ ...defaultDYT, ...(data.value as Partial<DesignYourThoughtSettings>) });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert(
          { key: 'design_your_thought', value: settings as any },
          { onConflict: 'key' }
        );
      if (error) throw error;
      toast({ title: 'Saved', description: 'Design Your Thought banner updated.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const converted = await compressProductImage(file);
      const ext = converted.name.split('.').pop();
      const filePath = brandedFileName('dyt', ext);
      const { error: upErr } = await supabase.storage.from('banners').upload(filePath, converted, { contentType: converted.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('banners').getPublicUrl(filePath);
      setSettings((s) => ({ ...s, image_url: toCdnUrl(urlData.publicUrl) }));
      toast({ title: 'Uploaded', description: 'Background image uploaded.' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const update = <K extends keyof DesignYourThoughtSettings>(
    key: K,
    value: DesignYourThoughtSettings[K]
  ) => setSettings((s) => ({ ...s, [key]: value }));

  if (loading) {
    return <div className="p-6 text-muted-foreground text-sm">Loading...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Design Your Thought Banner</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize the promotional banner shown on your homepage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
            {settings.enabled ? (
              <Eye size={14} className="text-primary" />
            ) : (
              <EyeOff size={14} className="text-muted-foreground" />
            )}
            <Label htmlFor="enabled" className="text-sm cursor-pointer">
              {settings.enabled ? 'Visible' : 'Hidden'}
            </Label>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(v) => update('enabled', v)}
            />
          </div>
        </div>
      </div>

      {/* Live preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-2xl border border-border shadow-lg"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${settings.image_url}')`, filter: 'blur(8px)' }}
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 flex flex-col items-center text-center px-4 py-8">
          <span className="text-[10px] font-semibold tracking-[0.25em] text-white/90 uppercase mb-2">
            {settings.eyebrow}
          </span>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {settings.title_part_one}{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {settings.title_part_two}
            </span>
          </h3>
          <p className="text-xs text-white/80 max-w-md">{settings.description}</p>
        </div>
      </motion.div>

      {/* Background Image */}
      <div className="bg-card rounded-xl p-5 border border-border space-y-3">
        <Label>Background Image</Label>
        <div className="flex items-center gap-3">
          <Input
            value={settings.image_url}
            onChange={(e) => update('image_url', e.target.value)}
            placeholder="https://..."
          />
          <label className="cursor-pointer">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <Button type="button" variant="outline" disabled={uploading} asChild>
              <span>
                <Upload size={14} className="mr-1.5" />
                {uploading ? 'Uploading...' : 'Upload'}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Text fields */}
      <div className="bg-card rounded-xl p-5 border border-border grid md:grid-cols-2 gap-4">
        <div>
          <Label>Eyebrow Tag</Label>
          <Input value={settings.eyebrow} onChange={(e) => update('eyebrow', e.target.value)} />
        </div>
        <div className="md:col-span-1" />
        <div>
          <Label>Title — Part 1 (white)</Label>
          <Input
            value={settings.title_part_one}
            onChange={(e) => update('title_part_one', e.target.value)}
          />
        </div>
        <div>
          <Label>Title — Part 2 (gradient)</Label>
          <Input
            value={settings.title_part_two}
            onChange={(e) => update('title_part_two', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Description</Label>
          <Textarea
            rows={3}
            value={settings.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="bg-card rounded-xl p-5 border border-border space-y-4">
        <h3 className="font-semibold text-sm">Stats (leave blank to hide)</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Stat 1 Value</Label>
            <Input
              value={settings.stat_one_value}
              onChange={(e) => update('stat_one_value', e.target.value)}
              placeholder="1000+"
            />
            <Input
              value={settings.stat_one_label}
              onChange={(e) => update('stat_one_label', e.target.value)}
              placeholder="Designs"
            />
          </div>
          <div className="space-y-2">
            <Label>Stat 2 Value</Label>
            <Input
              value={settings.stat_two_value}
              onChange={(e) => update('stat_two_value', e.target.value)}
              placeholder="98%"
            />
            <Input
              value={settings.stat_two_label}
              onChange={(e) => update('stat_two_label', e.target.value)}
              placeholder="Happy"
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="bg-card rounded-xl p-5 border border-border grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Primary Button Text</Label>
          <Input
            value={settings.primary_button_text}
            onChange={(e) => update('primary_button_text', e.target.value)}
          />
          <Label>Primary Button Link</Label>
          <Input
            value={settings.primary_button_link}
            onChange={(e) => update('primary_button_link', e.target.value)}
            placeholder="/shop"
          />
        </div>
        <div className="space-y-2">
          <Label>Secondary Button Text</Label>
          <Input
            value={settings.secondary_button_text}
            onChange={(e) => update('secondary_button_text', e.target.value)}
          />
          <Label>Secondary Button Link</Label>
          <Input
            value={settings.secondary_button_link}
            onChange={(e) => update('secondary_button_link', e.target.value)}
            placeholder="/shop"
          />
        </div>
      </div>

      <div className="flex justify-end sticky bottom-4">
        <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg">
          <Save size={16} className="mr-1.5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};
