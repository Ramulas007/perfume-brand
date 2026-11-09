import { useState, useEffect } from 'react';
import { Save, Key, Mail, MessageSquare, CreditCard, Search, Shield, Globe, Eye, EyeOff, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Json } from '@/integrations/supabase/types';

interface APIConfig {
  resend_api_key: string;
  whatsapp_api_key: string;
  facebook_pixel_id: string;
  google_analytics_id: string;
  google_ads_id: string;
  cloudflare_api_key: string;
  sms_api_key: string;
  steadfast_api_key: string;
  steadfast_secret_key: string;
  replicate_api_key: string;
}

interface APIField {
  key: keyof APIConfig;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  placeholder: string;
}

const apiFields: APIField[] = [
  {
    key: 'resend_api_key',
    label: 'Resend API Key',
    description: 'Email notification পাঠানোর জন্য (resend.com থেকে নিন)',
    icon: Mail,
    color: 'bg-blue-500',
    placeholder: 're_xxxxxxxxxx',
  },
  {
    key: 'whatsapp_api_key',
    label: 'WhatsApp Business API',
    description: 'WhatsApp message পাঠানোর জন্য',
    icon: MessageSquare,
    color: 'bg-green-500',
    placeholder: 'whatsapp_api_key',
  },
  {
    key: 'sms_api_key',
    label: 'SMS API Key',
    description: 'SMS notification পাঠানোর জন্য',
    icon: MessageSquare,
    color: 'bg-purple-500',
    placeholder: 'sms_api_key',
  },
  {
    key: 'facebook_pixel_id',
    label: 'Facebook Pixel ID',
    description: 'Facebook Ads tracking এর জন্য',
    icon: Globe,
    color: 'bg-indigo-500',
    placeholder: 'xxxxxxxxxxxxxxxxx',
  },
  {
    key: 'google_analytics_id',
    label: 'Google Analytics ID',
    description: 'Website analytics এর জন্য',
    icon: Search,
    color: 'bg-yellow-500',
    placeholder: 'G-XXXXXXXXXX',
  },
  {
    key: 'google_ads_id',
    label: 'Google Ads Conversion ID',
    description: 'Google Ads conversion tracking এর জন্য',
    icon: CreditCard,
    color: 'bg-red-500',
    placeholder: 'AW-XXXXXXXXXX',
  },
  {
    key: 'cloudflare_api_key',
    label: 'Cloudflare API Key',
    description: 'CDN এবং security এর জন্য',
    icon: Shield,
    color: 'bg-orange-500',
    placeholder: 'cloudflare_api_key',
  },
  {
    key: 'steadfast_api_key',
    label: 'Steadfast API Key',
    description: 'Steadfast Courier API Key',
    icon: Shield,
    color: 'bg-rose-500',
    placeholder: 'steadfast_api_key',
  },
  {
    key: 'steadfast_secret_key',
    label: 'Steadfast Secret Key',
    description: 'Steadfast Courier Secret Key',
    icon: Shield,
    color: 'bg-rose-600',
    placeholder: 'steadfast_secret_key',
  },
  {
    key: 'replicate_api_key',
    label: 'Replicate API Key',
    description: 'AI Mockup Generator এর জন্য (replicate.com থেকে নিন)',
    icon: Sparkles,
    color: 'bg-purple-600',
    placeholder: 'r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
];

export const AdminAPISettings = () => {
  const [apiConfig, setApiConfig] = useState<APIConfig>({
    resend_api_key: '',
    whatsapp_api_key: '',
    facebook_pixel_id: '',
    google_analytics_id: '',
    google_ads_id: '',
    cloudflare_api_key: '',
    sms_api_key: '',
    steadfast_api_key: '',
    steadfast_secret_key: '',
    replicate_api_key: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchAPISettings();
  }, []);

  const fetchAPISettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'api_settings')
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        const settings = data.value as unknown as APIConfig;
        setApiConfig({
          resend_api_key: settings.resend_api_key || '',
          whatsapp_api_key: settings.whatsapp_api_key || '',
          facebook_pixel_id: settings.facebook_pixel_id || '',
          google_analytics_id: settings.google_analytics_id || '',
          google_ads_id: settings.google_ads_id || '',
          cloudflare_api_key: settings.cloudflare_api_key || '',
          sms_api_key: settings.sms_api_key || '',
          steadfast_api_key: settings.steadfast_api_key || '',
          steadfast_secret_key: settings.steadfast_secret_key || '',
          replicate_api_key: settings.replicate_api_key || '',
        });
      }
    } catch (error) {
      console.error('Error fetching API settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAPIKey = async (key: keyof APIConfig) => {
    setSaving(key);
    try {
      // Upsert sensitive API keys (admin-only row)
      const { error: apiErr } = await supabase
        .from('site_settings')
        .upsert(
          { key: 'api_settings', value: apiConfig as unknown as Json, updated_at: new Date().toISOString() },
          { onConflict: 'key' },
        );
      if (apiErr) throw apiErr;

      // Mirror only public tracking IDs into a publicly-readable row
      const trackingValue = {
        google_analytics_id: apiConfig.google_analytics_id || '',
        google_ads_id: apiConfig.google_ads_id || '',
        facebook_pixel_id: apiConfig.facebook_pixel_id || '',
      } as unknown as Json;

      const { error: trackErr } = await supabase
        .from('site_settings')
        .upsert(
          { key: 'tracking_settings', value: trackingValue, updated_at: new Date().toISOString() },
          { onConflict: 'key' },
        );
      if (trackErr) throw trackErr;

      toast({
        title: 'সফল!',
        description: `${apiFields.find(f => f.key === key)?.label} সংরক্ষিত হয়েছে`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'API key সংরক্ষণ করা যায়নি',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleChange = (key: keyof APIConfig, value: string) => {
    setApiConfig(prev => ({ ...prev, [key]: value }));
  };

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isConfigured = (key: keyof APIConfig) => {
    return apiConfig[key] && apiConfig[key].trim().length > 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Key className="text-primary" />
            API Settings
          </h2>
          <p className="text-muted-foreground mt-1">
            বিভিন্ন সার্ভিসের API keys এখানে configure করুন। API key দিলে সেই feature automatically চালু হবে।
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {apiFields.map((field) => (
          <Card key={field.key} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${field.color}`} />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${field.color} text-white`}>
                    <field.icon size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{field.label}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {field.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={isConfigured(field.key) ? 'default' : 'secondary'}>
                  {isConfigured(field.key) ? 'Active' : 'Not Set'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showKeys[field.key] ? 'text' : 'password'}
                    value={apiConfig[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey(field.key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Button
                  onClick={() => saveAPIKey(field.key)}
                  disabled={saving === field.key}
                  size="sm"
                >
                  {saving === field.key ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                  ) : (
                    <Save size={16} />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            নিরাপত্তা নোট
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• সব API keys encrypted ভাবে সংরক্ষিত থাকে।</p>
          <p>• শুধুমাত্র Admin রা এই keys দেখতে এবং পরিবর্তন করতে পারবে।</p>
          <p>• API key পরিবর্তন করলে সংশ্লিষ্ট service এর সাথে নতুন করে connect হবে।</p>
          <p>• Resend API key দিলে Email notification automatically কাজ করবে।</p>
        </CardContent>
      </Card>
    </div>
  );
};
