import { useState, useEffect } from 'react';
import { Save, FileText, Phone, Mail, MapPin, Clock, MessageCircle, Info, Target, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

export const AdminPagesContent = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [aboutContent, setAboutContent] = useState({
    heroSubtitle: 'Serving You Since 2020',
    heroTitle: 'About Us',
    heroDescription: "Bangladesh's Trusted Online Fashion Store",
    storyTitle: 'How Our Journey Began',
    storyDescription: 'Since 2020, we have been providing the best quality clothing and fashion items to the people of Bangladesh.',
    mission: 'To deliver high-quality Islamic fashion products at affordable prices to everyone.',
    vision: 'To become the most trusted and preferred online fashion brand in Bangladesh.',
    stats: {
      customers: '10,000+',
      products: '500+',
      districts: '64',
      years: '5+',
    },
    ctaTitle: 'Start Shopping Today!',
    ctaDescription: 'Stay with us and get the best offers & discounts.',
  });

  const [contactContent, setContactContent] = useState({
    heroSubtitle: '24/7 Customer Support',
    heroTitle: 'Contact Us',
    heroDescription: "We're always ready to help you",
    phone1: '+880 9617-827080',
    phone2: '+880 1712-345678',
    email1: 'info@oneummahbd.com',
    email2: 'support@oneummahbd.com',
    address1: 'Mirpur-10, Dhaka-1216',
    address2: 'Bangladesh',
    workingHours1: 'Sat - Thu: 9AM - 9PM',
    workingHours2: 'Friday: Closed',
    whatsappNumber: '8801712345678',
    whatsappEnabled: true,
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18...',
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['about_content', 'contact_content']);

      if (error) throw error;

      data?.forEach((setting) => {
        if (setting.key === 'about_content') {
          const content = setting.value as any;
          if (content) {
            setAboutContent(prev => ({ ...prev, ...content }));
          }
        }
        if (setting.key === 'contact_content') {
          const content = setting.value as any;
          if (content) {
            setContactContent(prev => ({
              ...prev,
              heroSubtitle: content.heroSubtitle || prev.heroSubtitle,
              heroTitle: content.heroTitle || prev.heroTitle,
              heroDescription: content.heroDescription || prev.heroDescription,
              phone1: content.phones?.[0] || prev.phone1,
              phone2: content.phones?.[1] || prev.phone2,
              email1: content.emails?.[0] || prev.email1,
              email2: content.emails?.[1] || prev.email2,
              address1: content.address?.[0] || prev.address1,
              address2: content.address?.[1] || prev.address2,
              workingHours1: content.workingHours?.[0] || prev.workingHours1,
              workingHours2: content.workingHours?.[1] || prev.workingHours2,
              whatsappNumber: content.whatsappNumber || prev.whatsappNumber,
              whatsappEnabled: content.whatsappEnabled !== false,
              mapEmbedUrl: content.mapEmbedUrl || prev.mapEmbedUrl,
            }));
          }
        }
      });
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value })
          .eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ key, value });
        if (error) throw error;
      }

      toast({ title: 'সফল!', description: 'সেটিংস সেভ হয়েছে' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAbout = () => {
    saveSetting('about_content', aboutContent);
  };

  const handleSaveContact = () => {
    const formattedContact = {
      heroSubtitle: contactContent.heroSubtitle,
      heroTitle: contactContent.heroTitle,
      heroDescription: contactContent.heroDescription,
      phones: [contactContent.phone1, contactContent.phone2].filter(Boolean),
      emails: [contactContent.email1, contactContent.email2].filter(Boolean),
      address: [contactContent.address1, contactContent.address2].filter(Boolean),
      workingHours: [contactContent.workingHours1, contactContent.workingHours2].filter(Boolean),
      whatsappNumber: contactContent.whatsappNumber,
      whatsappEnabled: contactContent.whatsappEnabled,
      mapEmbedUrl: contactContent.mapEmbedUrl,
    };
    saveSetting('contact_content', formattedContact);
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
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Page Content Management</h2>
      </div>

      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="about" className="flex items-center gap-2">
            <Info size={16} />
            About Page
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Phone size={16} />
            Contact Page
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-6">
          {/* Hero Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target size={20} className="text-primary" />
              Hero Section
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={aboutContent.heroSubtitle}
                  onChange={(e) => setAboutContent(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                  placeholder="Serving You Since 2020"
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={aboutContent.heroTitle}
                  onChange={(e) => setAboutContent(prev => ({ ...prev, heroTitle: e.target.value }))}
                  placeholder="About Us"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={aboutContent.heroDescription}
                  onChange={(e) => setAboutContent(prev => ({ ...prev, heroDescription: e.target.value }))}
                  placeholder="Bangladesh's Trusted Online Fashion Store"
                />
              </div>
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Mission & Vision
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Story Title</Label>
                <Input
                  value={aboutContent.storyTitle}
                  onChange={(e) => setAboutContent(prev => ({ ...prev, storyTitle: e.target.value }))}
                />
              </div>
              <div>
                <Label>Story Description</Label>
                <Textarea
                  value={aboutContent.storyDescription}
                  onChange={(e) => setAboutContent(prev => ({ ...prev, storyDescription: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label>Mission</Label>
                <Textarea
                  value={aboutContent.mission}
                  onChange={(e) => setAboutContent(prev => ({ ...prev, mission: e.target.value }))}
                  rows={2}
                />
              </div>
              <div>
                <Label>Vision</Label>
                <Textarea
                  value={aboutContent.vision}
                  onChange={(e) => setAboutContent(prev => ({ ...prev, vision: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Happy Customers</Label>
                <Input
                  value={aboutContent.stats.customers}
                  onChange={(e) => setAboutContent(prev => ({ 
                    ...prev, 
                    stats: { ...prev.stats, customers: e.target.value } 
                  }))}
                  placeholder="10,000+"
                />
              </div>
              <div>
                <Label>Products</Label>
                <Input
                  value={aboutContent.stats.products}
                  onChange={(e) => setAboutContent(prev => ({ 
                    ...prev, 
                    stats: { ...prev.stats, products: e.target.value } 
                  }))}
                  placeholder="500+"
                />
              </div>
              <div>
                <Label>Districts</Label>
                <Input
                  value={aboutContent.stats.districts}
                  onChange={(e) => setAboutContent(prev => ({ 
                    ...prev, 
                    stats: { ...prev.stats, districts: e.target.value } 
                  }))}
                  placeholder="64"
                />
              </div>
              <div>
                <Label>Years Experience</Label>
                <Input
                  value={aboutContent.stats.years}
                  onChange={(e) => setAboutContent(prev => ({ 
                    ...prev, 
                    stats: { ...prev.stats, years: e.target.value } 
                  }))}
                  placeholder="5+"
                />
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Call to Action</h3>
            <div className="space-y-4">
              <div>
                <Label>CTA Title</Label>
                <Input
                  value={aboutContent.ctaTitle}
                  onChange={(e) => setAboutContent(prev => ({ ...prev, ctaTitle: e.target.value }))}
                />
              </div>
              <div>
                <Label>CTA Description</Label>
                <Textarea
                  value={aboutContent.ctaDescription}
                  onChange={(e) => setAboutContent(prev => ({ ...prev, ctaDescription: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveAbout} disabled={saving} className="w-full">
            <Save size={16} className="mr-2" />
            Save About Page
          </Button>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          {/* Hero Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target size={20} className="text-primary" />
              Hero Section
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={contactContent.heroSubtitle}
                  onChange={(e) => setContactContent(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={contactContent.heroTitle}
                  onChange={(e) => setContactContent(prev => ({ ...prev, heroTitle: e.target.value }))}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={contactContent.heroDescription}
                  onChange={(e) => setContactContent(prev => ({ ...prev, heroDescription: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Phone size={20} className="text-primary" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2"><Phone size={14} /> Phone 1</Label>
                <Input
                  value={contactContent.phone1}
                  onChange={(e) => setContactContent(prev => ({ ...prev, phone1: e.target.value }))}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2"><Phone size={14} /> Phone 2</Label>
                <Input
                  value={contactContent.phone2}
                  onChange={(e) => setContactContent(prev => ({ ...prev, phone2: e.target.value }))}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2"><Mail size={14} /> Email 1</Label>
                <Input
                  value={contactContent.email1}
                  onChange={(e) => setContactContent(prev => ({ ...prev, email1: e.target.value }))}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2"><Mail size={14} /> Email 2</Label>
                <Input
                  value={contactContent.email2}
                  onChange={(e) => setContactContent(prev => ({ ...prev, email2: e.target.value }))}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2"><MapPin size={14} /> Address Line 1</Label>
                <Input
                  value={contactContent.address1}
                  onChange={(e) => setContactContent(prev => ({ ...prev, address1: e.target.value }))}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2"><MapPin size={14} /> Address Line 2</Label>
                <Input
                  value={contactContent.address2}
                  onChange={(e) => setContactContent(prev => ({ ...prev, address2: e.target.value }))}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2"><Clock size={14} /> Working Hours 1</Label>
                <Input
                  value={contactContent.workingHours1}
                  onChange={(e) => setContactContent(prev => ({ ...prev, workingHours1: e.target.value }))}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2"><Clock size={14} /> Working Hours 2</Label>
                <Input
                  value={contactContent.workingHours2}
                  onChange={(e) => setContactContent(prev => ({ ...prev, workingHours2: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* WhatsApp & Map */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageCircle size={20} className="text-green-500" />
              WhatsApp & Map
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="text-sm font-medium">Show Floating WhatsApp Button</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    হোমপেজ ও অন্য পেজে ভাসমান WhatsApp চ্যাট বাটন দেখাবে/লুকাবে
                  </p>
                </div>
                <Switch
                  checked={contactContent.whatsappEnabled}
                  onCheckedChange={(v) => setContactContent(prev => ({ ...prev, whatsappEnabled: v }))}
                />
              </div>
              <div>
                <Label>WhatsApp Number (with country code, no +)</Label>
                <Input
                  value={contactContent.whatsappNumber}
                  onChange={(e) => setContactContent(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                  placeholder="8801712345678"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Example: 8801712345678 (Bangladesh number)
                </p>
              </div>
              <div>
                <Label>Google Maps Embed URL</Label>
                <Textarea
                  value={contactContent.mapEmbedUrl}
                  onChange={(e) => setContactContent(prev => ({ ...prev, mapEmbedUrl: e.target.value }))}
                  rows={3}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Google Maps থেকে "Embed a map" option থেকে URL কপি করুন
                </p>
              </div>
            </div>
          </div>

          <Button onClick={handleSaveContact} disabled={saving} className="w-full">
            <Save size={16} className="mr-2" />
            Save Contact Page
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};
