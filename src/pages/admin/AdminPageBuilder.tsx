import { useState, useEffect } from 'react';
import { GripVertical, Plus, Trash2, Eye, Save, ChevronDown, ChevronUp, Settings2, Type, Image, ShoppingBag, Star, Video, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Section {
  id: string;
  type: string;
  order: number;
  visible: boolean;
  settings: Record<string, any>;
}

const SECTION_TYPES = [
  { type: 'hero', label: 'Hero Banner', icon: Image, description: 'Full-width hero with CTA' },
  { type: 'product_grid', label: 'Product Grid', icon: ShoppingBag, description: 'Display products in grid' },
  { type: 'category_cards', label: 'Category Cards', icon: Layers, description: 'Category showcase' },
  { type: 'showcase_slider', label: 'Showcase Slider', icon: Star, description: 'Editorial image slider' },
  { type: 'offer_banner', label: 'Offer Banner', icon: Type, description: 'Promotional banner' },
  { type: 'video_section', label: 'Video Section', icon: Video, description: 'YouTube/MP4 embed' },
  { type: 'text_block', label: 'Text Block', icon: Type, description: 'Rich text content' },
];

const defaultSettings: Record<string, Record<string, any>> = {
  hero: { title: 'Welcome to Our Store', subtitle: 'Shop Premium Products', cta_text: 'Shop Now', cta_link: '/shop' },
  product_grid: { title: 'Featured Products', limit: 8, columns: 4 },
  category_cards: { title: 'Shop by Category' },
  showcase_slider: { title: 'Latest Collection' },
  offer_banner: { title: 'Special Offer', subtitle: 'Get 20% off on all items', cta_text: 'Shop Now', cta_link: '/shop', background_color: '#8B1A3A' },
  video_section: { title: 'Watch Our Story', video_url: '' },
  text_block: { title: '', content: '' },
};

export const AdminPageBuilder = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchLayout(); }, []);

  const fetchLayout = async () => {
    const { data, error } = await supabase
      .from('page_layouts')
      .select('*')
      .eq('slug', 'homepage')
      .maybeSingle();

    if (data) {
      setSections((data.sections as any) || []);
      setIsPublished(data.is_published);
    } else if (!error) {
      // Create default homepage layout
      const defaultSections: Section[] = [
        { id: crypto.randomUUID(), type: 'hero', order: 0, visible: true, settings: defaultSettings.hero },
        { id: crypto.randomUUID(), type: 'category_cards', order: 1, visible: true, settings: defaultSettings.category_cards },
        { id: crypto.randomUUID(), type: 'showcase_slider', order: 2, visible: true, settings: defaultSettings.showcase_slider },
        { id: crypto.randomUUID(), type: 'product_grid', order: 3, visible: true, settings: defaultSettings.product_grid },
      ];
      setSections(defaultSections);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: existing } = await supabase
      .from('page_layouts')
      .select('id')
      .eq('slug', 'homepage')
      .maybeSingle();

    const payload = {
      slug: 'homepage',
      title: 'Homepage',
      sections: sections as any,
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
    };

    if (existing) {
      await supabase.from('page_layouts').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('page_layouts').insert(payload);
    }
    
    setSaving(false);
    toast({ title: 'Layout saved!', description: isPublished ? 'Changes are now live.' : 'Saved as draft.' });
  };

  const addSection = (type: string) => {
    const newSection: Section = {
      id: crypto.randomUUID(),
      type,
      order: sections.length,
      visible: true,
      settings: { ...(defaultSettings[type] || {}) },
    };
    setSections([...sections, newSection]);
    setExpandedSection(newSection.id);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newSections.length) return;
    [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
    newSections.forEach((s, i) => s.order = i);
    setSections(newSections);
  };

  const updateSectionSettings = (id: string, key: string, value: any) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, settings: { ...s.settings, [key]: value } } : s
    ));
  };

  const toggleVisibility = (id: string) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, visible: !s.visible } : s
    ));
  };

  const getSectionIcon = (type: string) => {
    const found = SECTION_TYPES.find(t => t.type === type);
    return found ? found.icon : Layers;
  };

  const getSectionLabel = (type: string) => {
    const found = SECTION_TYPES.find(t => t.type === type);
    return found ? found.label : type;
  };

  const renderSettings = (section: Section) => {
    const { type, settings } = section;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        {settings.title !== undefined && (
          <div>
            <Label>Title</Label>
            <Input value={settings.title} onChange={e => updateSectionSettings(section.id, 'title', e.target.value)} />
          </div>
        )}
        {settings.subtitle !== undefined && (
          <div>
            <Label>Subtitle</Label>
            <Input value={settings.subtitle} onChange={e => updateSectionSettings(section.id, 'subtitle', e.target.value)} />
          </div>
        )}
        {settings.cta_text !== undefined && (
          <div>
            <Label>Button Text</Label>
            <Input value={settings.cta_text} onChange={e => updateSectionSettings(section.id, 'cta_text', e.target.value)} />
          </div>
        )}
        {settings.cta_link !== undefined && (
          <div>
            <Label>Button Link</Label>
            <Input value={settings.cta_link} onChange={e => updateSectionSettings(section.id, 'cta_link', e.target.value)} />
          </div>
        )}
        {settings.limit !== undefined && (
          <div>
            <Label>Product Limit</Label>
            <Input type="number" value={settings.limit} onChange={e => updateSectionSettings(section.id, 'limit', parseInt(e.target.value) || 8)} min={4} max={24} />
          </div>
        )}
        {settings.columns !== undefined && (
          <div>
            <Label>Columns</Label>
            <Select value={settings.columns.toString()} onValueChange={v => updateSectionSettings(section.id, 'columns', parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Columns</SelectItem>
                <SelectItem value="3">3 Columns</SelectItem>
                <SelectItem value="4">4 Columns</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {settings.video_url !== undefined && (
          <div className="md:col-span-2">
            <Label>Video URL</Label>
            <Input value={settings.video_url} onChange={e => updateSectionSettings(section.id, 'video_url', e.target.value)} placeholder="https://youtube.com/..." />
          </div>
        )}
        {settings.content !== undefined && (
          <div className="md:col-span-2">
            <Label>Content</Label>
            <Textarea value={settings.content} onChange={e => updateSectionSettings(section.id, 'content', e.target.value)} rows={4} />
          </div>
        )}
        {settings.background_color !== undefined && (
          <div>
            <Label>Background Color</Label>
            <div className="flex gap-2">
              <Input type="color" value={settings.background_color} onChange={e => updateSectionSettings(section.id, 'background_color', e.target.value)} className="w-12 h-10 p-1" />
              <Input value={settings.background_color} onChange={e => updateSectionSettings(section.id, 'background_color', e.target.value)} />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Page Builder</h2>
          <p className="text-sm text-muted-foreground">Drag sections to reorder your homepage</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            <Label className="text-sm">{isPublished ? 'Published' : 'Draft'}</Label>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save size={16} /> {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        <AnimatePresence>
          {sections.map((section, index) => {
            const Icon = getSectionIcon(section.type);
            const isExpanded = expandedSection === section.id;

            return (
              <motion.div
                key={section.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className={`${!section.visible ? 'opacity-50' : ''} transition-opacity`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-0.5 hover:bg-secondary rounded disabled:opacity-30">
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1} className="p-0.5 hover:bg-secondary rounded disabled:opacity-30">
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      
                      <GripVertical size={16} className="text-muted-foreground" />
                      
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon size={16} className="text-primary" />
                      </div>
                      
                      <div className="flex-1">
                        <span className="font-medium text-sm">{getSectionLabel(section.type)}</span>
                        {section.settings.title && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{section.settings.title}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch checked={section.visible} onCheckedChange={() => toggleVisibility(section.id)} />
                        <Button variant="ghost" size="icon" onClick={() => setExpandedSection(isExpanded ? null : section.id)}>
                          <Settings2 size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeSection(section.id)} className="text-destructive">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          {renderSettings(section)}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Section */}
      <Card>
        <CardHeader><CardTitle className="text-base">Add Section</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SECTION_TYPES.map(sType => (
              <button
                key={sType.type}
                onClick={() => addSection(sType.type)}
                className="flex flex-col items-center gap-2 p-4 border border-border rounded-lg hover:border-primary/30 hover:bg-secondary/30 transition-all text-center"
              >
                <sType.icon size={20} className="text-primary" />
                <span className="text-xs font-medium">{sType.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
