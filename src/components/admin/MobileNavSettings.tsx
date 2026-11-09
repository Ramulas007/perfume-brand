import { useDesignSettings } from '@/hooks/useDesignSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Smartphone, Save, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

const ICON_OPTIONS = ['Home', 'LayoutGrid', 'Search', 'ShoppingCart', 'User', 'Heart', 'Bell', 'Phone', 'Star', 'Tag', 'Package'];

export const MobileNavSettings = () => {
  const { settings, update, save, dirty } = useDesignSettings();
  const nav = settings.mobileNav;

  const setItem = (idx: number, patch: Partial<typeof nav.items[number]>) => {
    const items = nav.items.map((it, i) => i === idx ? { ...it, ...patch } : it);
    update({ mobileNav: { items } });
  };
  const removeItem = (idx: number) =>
    update({ mobileNav: { items: nav.items.filter((_, i) => i !== idx) } });
  const addItem = () => {
    if (nav.items.length >= 6) return;
    update({ mobileNav: { items: [...nav.items, { id: `nav-${Date.now()}`, label: 'New', icon: 'Star', href: '/' }] } });
  };
  const moveItem = (idx: number, dir: -1 | 1) => {
    const ni = idx + dir;
    if (ni < 0 || ni >= nav.items.length) return;
    const items = [...nav.items];
    [items[idx], items[ni]] = [items[ni], items[idx]];
    update({ mobileNav: { items } });
  };

  const handleSave = async () => {
    try { await save(); toast.success('Mobile navigation saved'); }
    catch { toast.error('Failed to save'); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="text-primary" size={22} />
          <h3 className="text-lg font-semibold">Mobile Navigation</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Mobile bottom navigation bar control korun. Items, style, color, position সব কিছু এখান থেকে set করতে parben.
        </p>

        <div className="space-y-5">
          {/* Enable */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="font-medium">Enable Bottom Navigation</Label>
              <p className="text-xs text-muted-foreground">Mobile-e bottom bar show korbe</p>
            </div>
            <Switch checked={nav.enabled} onCheckedChange={v => update({ mobileNav: { enabled: v } })} />
          </div>

          {/* Safe Area */}
          <div className="rounded-lg border p-3 space-y-3">
            <div>
              <Label className="font-medium">Mobile Navigation Safe Area</Label>
              <p className="text-xs text-muted-foreground">Footer & floating buttons jate nav-er piche na hide hoi.</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Auto Adjust Footer</span>
              <Switch checked={nav.safeArea?.adjustFooter ?? true}
                onCheckedChange={v => update({ mobileNav: { safeArea: { adjustFooter: v } } })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Auto Adjust WhatsApp Button</span>
              <Switch checked={nav.safeArea?.adjustWhatsapp ?? true}
                onCheckedChange={v => update({ mobileNav: { safeArea: { adjustWhatsapp: v } } })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Auto Adjust Floating Buttons</span>
              <Switch checked={nav.safeArea?.adjustFloating ?? true}
                onCheckedChange={v => update({ mobileNav: { safeArea: { adjustFloating: v } } })} />
            </div>
          </div>

          {/* Header mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Navigation Mode</Label>
              <Select value={nav.headerMode} onValueChange={(v: any) => update({ mobileNav: { headerMode: v } })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">Header Only</SelectItem>
                  <SelectItem value="bottom-only">Bottom Only</SelectItem>
                  <SelectItem value="both">Header + Bottom</SelectItem>
                  <SelectItem value="none">Disable Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Show On</Label>
              <Select value={nav.showOn} onValueChange={(v: any) => update({ mobileNav: { showOn: v } })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile">Mobile Only</SelectItem>
                  <SelectItem value="mobile-tablet">Mobile + Tablet</SelectItem>
                  <SelectItem value="all">All Devices</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Position</Label>
              <Select value={nav.position} onValueChange={(v: any) => update({ mobileNav: { position: v } })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Bottom</SelectItem>
                  <SelectItem value="floating">Floating Bar</SelectItem>
                  <SelectItem value="dock">Rounded Dock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Style</Label>
              <Select value={nav.style} onValueChange={(v: any) => update({ mobileNav: { style: v } })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="glass">Glassmorphism</SelectItem>
                  <SelectItem value="ios">iOS</SelectItem>
                  <SelectItem value="android">Android</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-2">
            {([
              ['showLabels', 'Show Labels'],
              ['iconsOnly', 'Icons Only'],
              ['autoHideOnScroll', 'Auto Hide on Scroll'],
              ['sticky', 'Sticky'],
              ['shadow', 'Shadow'],
              ['blur', 'Backdrop Blur'],
            ] as const).map(([k, label]) => (
              <div key={k} className="flex items-center justify-between rounded-lg border p-2.5">
                <span className="text-sm">{label}</span>
                <Switch checked={(nav as any)[k]} onCheckedChange={v => update({ mobileNav: { [k]: v } as any })} />
              </div>
            ))}
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            <div>
              <Label>Bar Height ({nav.height}px)</Label>
              <Slider min={48} max={96} step={2} value={[nav.height]}
                onValueChange={([v]) => update({ mobileNav: { height: v } })} className="mt-2" />
            </div>
            <div>
              <Label>Icon Size ({nav.iconSize}px)</Label>
              <Slider min={14} max={32} step={1} value={[nav.iconSize]}
                onValueChange={([v]) => update({ mobileNav: { iconSize: v } })} className="mt-2" />
            </div>
            <div>
              <Label>Label Size ({nav.labelSize}px)</Label>
              <Slider min={8} max={14} step={1} value={[nav.labelSize]}
                onValueChange={([v]) => update({ mobileNav: { labelSize: v } })} className="mt-2" />
            </div>
            <div>
              <Label>Border Radius ({nav.radius}px)</Label>
              <Slider min={0} max={40} step={1} value={[nav.radius]}
                onValueChange={([v]) => update({ mobileNav: { radius: v } })} className="mt-2" />
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-3 gap-3">
            {([
              ['bgColor', 'Background'],
              ['activeColor', 'Active'],
              ['inactiveColor', 'Inactive'],
            ] as const).map(([k, label]) => (
              <div key={k}>
                <Label className="text-xs">{label}</Label>
                <div className="flex gap-1 mt-1">
                  <Input type="color" value={(nav as any)[k]}
                    onChange={e => update({ mobileNav: { [k]: e.target.value } as any })}
                    className="h-9 w-10 p-1 cursor-pointer" />
                  <Input value={(nav as any)[k]}
                    onChange={e => update({ mobileNav: { [k]: e.target.value } as any })}
                    className="h-9 text-xs font-mono" />
                </div>
              </div>
            ))}
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Navigation Items ({nav.items.length}/6)</Label>
              <Button size="sm" variant="outline" onClick={addItem} disabled={nav.items.length >= 6}>
                <Plus size={14} className="mr-1" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {nav.items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center rounded-lg border p-2">
                  <Input value={item.label} onChange={e => setItem(idx, { label: e.target.value })} placeholder="Label" className="h-9" />
                  <Select value={item.icon} onValueChange={v => setItem(idx, { icon: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{ICON_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input value={item.href} onChange={e => setItem(idx, { href: e.target.value })} placeholder="/path" className="h-9" />
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-9 w-8" onClick={() => moveItem(idx, -1)}><ArrowUp size={14} /></Button>
                    <Button size="icon" variant="ghost" className="h-9 w-8" onClick={() => moveItem(idx, 1)}><ArrowDown size={14} /></Button>
                    <Button size="icon" variant="ghost" className="h-9 w-8 text-destructive" onClick={() => removeItem(idx)}><Trash2 size={14} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={!dirty} className="w-full">
            <Save size={16} className="mr-2" /> Save Mobile Navigation
          </Button>
        </div>
      </div>
    </div>
  );
};
