import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Sparkles, Settings, Menu,
  FolderTree, Tag, BarChart3, Users, Bell, Zap, Image as ImageIcon,
  Wallet, FileText, BookOpen, Wand2, Plus, X, Save,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';
import { toast } from 'sonner';

/* ---------------- Settings (localStorage) ---------------- */

export type AdminMobileNavPrefs = {
  enabled: boolean;
  showLabels: boolean;
};

const PREF_KEY = 'adminMobileNavPrefs';
const DEFAULTS: AdminMobileNavPrefs = { enabled: true, showLabels: true };

export const getAdminMobileNavPrefs = (): AdminMobileNavPrefs => {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch { return DEFAULTS; }
};

export const useAdminMobileNavPrefs = () => {
  const [prefs, setPrefs] = useState<AdminMobileNavPrefs>(getAdminMobileNavPrefs);
  useEffect(() => {
    const onStorage = () => setPrefs(getAdminMobileNavPrefs());
    window.addEventListener('storage', onStorage);
    window.addEventListener('admin-mobile-nav-prefs', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('admin-mobile-nav-prefs', onStorage);
    };
  }, []);
  return prefs;
};

export const AdminMobileNavSettings = () => {
  const [prefs, setPrefs] = useState<AdminMobileNavPrefs>(getAdminMobileNavPrefs);
  const save = () => {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
      window.dispatchEvent(new Event('admin-mobile-nav-prefs'));
      toast.success('Admin mobile navigation saved');
    } catch { toast.error('Failed to save'); }
  };
  return (
    <div className="bg-card rounded-xl border border-border p-6 max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Smartphone className="text-primary" size={22} />
        <h3 className="text-lg font-semibold">Mobile Admin Navigation</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Admin panel-er jonno bottom navigation bar control korun. Mobile-only.
      </p>

      <div className="rounded-lg border p-3 flex items-center justify-between">
        <div>
          <Label className="font-medium">Enable Mobile Admin Navigation</Label>
          <p className="text-xs text-muted-foreground">Mobile-e admin dashboard-e bottom nav show korbe</p>
        </div>
        <Switch checked={prefs.enabled} onCheckedChange={v => setPrefs(p => ({ ...p, enabled: v }))} />
      </div>

      <div className="rounded-lg border p-3 flex items-center justify-between">
        <div>
          <Label className="font-medium">Show Labels</Label>
          <p className="text-xs text-muted-foreground">Off korle icons-only mode</p>
        </div>
        <Switch checked={prefs.showLabels} onCheckedChange={v => setPrefs(p => ({ ...p, showLabels: v }))} />
      </div>

      <Button onClick={save} className="w-full">
        <Save size={16} className="mr-2" /> Save Settings
      </Button>
    </div>
  );
};

/* ---------------- Bottom Nav Bar ---------------- */

export type AdminTab =
  | 'dashboard' | 'products' | 'categories' | 'banners' | 'orders' | 'coupons'
  | 'ai-upload' | 'mockup-generator' | 'page-content' | 'pages'
  | 'users' | 'notifications' | 'finance' | 'sales'
  | 'settings' | 'api-settings' | 'image-migration';

const PRIMARY: { id: AdminTab; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
];

const MORE_ITEMS: { id: AdminTab; label: string; icon: any }[] = [
  { id: 'ai-upload', label: 'AI Upload', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'banners', label: 'Banners', icon: ImageIcon },
  { id: 'coupons', label: 'Coupons', icon: Tag },
  { id: 'sales', label: 'Sales Report', icon: BarChart3 },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'users', label: 'Users & Admins', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'api-settings', label: 'API Settings', icon: Zap },
  { id: 'page-content', label: 'Page Content', icon: BookOpen },
  { id: 'pages', label: 'Legal Pages', icon: FileText },
  { id: 'mockup-generator', label: 'AI Mockups', icon: Wand2 },
];

type QuickAction = { label: string; icon: any; tab: AdminTab };
const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Add Product', icon: Package, tab: 'products' },
  { label: 'Add Banner', icon: ImageIcon, tab: 'banners' },
  { label: 'Add Category', icon: FolderTree, tab: 'categories' },
  { label: 'Create Coupon', icon: Tag, tab: 'coupons' },
  { label: 'AI Product Upload', icon: Sparkles, tab: 'ai-upload' },
];

interface Props {
  activeTab: AdminTab;
  setActiveTab: (t: AdminTab) => void;
}

export const AdminMobileNav = ({ activeTab, setActiveTab }: Props) => {
  const prefs = useAdminMobileNavPrefs();
  const [moreOpen, setMoreOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  if (!prefs.enabled) return null;

  const go = (t: AdminTab) => {
    setActiveTab(t);
    setMoreOpen(false);
    setQuickOpen(false);
  };

  const isMoreActive = MORE_ITEMS.some(m => m.id === activeTab);

  // Balanced: 2 left + center FAB + 2 right (last right = More)
  const left = PRIMARY.slice(0, 2);
  const right = PRIMARY.slice(2, 4);

  const Item = ({ item, active }: { item: { id: string; label: string; icon: any }; active: boolean }) => (
    <button
      onClick={() => go(item.id as AdminTab)}
      className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 group"
    >
      {active && (
        <motion.div
          layoutId="admin-mnav-active"
          className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <item.icon
        size={prefs.showLabels ? 20 : 22}
        className={`transition-colors ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
      />
      {prefs.showLabels && (
        <span className={`text-[10px] font-medium leading-none ${active ? 'text-primary' : 'text-muted-foreground'}`}>
          {item.label}
        </span>
      )}
    </button>
  );

  return (
    <>
      {/* Bottom Nav */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="relative flex items-stretch h-14">
          {left.map(it => <Item key={it.id} item={it} active={activeTab === it.id} />)}

          {/* Center FAB spacer */}
          <div className="w-16 relative">
            <button
              onClick={() => setQuickOpen(true)}
              className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform ring-4 ring-background"
              aria-label="Quick actions"
            >
              <Plus size={26} />
            </button>
          </div>

          {right.map(it => <Item key={it.id} item={it} active={activeTab === it.id} />)}

          {/* More */}
          <button
            onClick={() => setMoreOpen(true)}
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 group"
          >
            {isMoreActive && (
              <motion.div
                layoutId="admin-mnav-active"
                className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Menu
              size={prefs.showLabels ? 20 : 22}
              className={`transition-colors ${isMoreActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
            />
            {prefs.showLabels && (
              <span className={`text-[10px] font-medium leading-none ${isMoreActive ? 'text-primary' : 'text-muted-foreground'}`}>More</span>
            )}
          </button>
        </div>
      </nav>

      {/* Spacer is handled by parent via padding-bottom */}

      {/* More Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-background rounded-t-3xl border-t border-border max-h-[85vh] flex flex-col"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex justify-center pt-3"><div className="w-10 h-1 rounded-full bg-muted" /></div>
              <div className="flex items-center justify-between px-5 py-3">
                <h3 className="font-semibold">More Tools</h3>
                <button onClick={() => setMoreOpen(false)} className="p-1.5 rounded-md hover:bg-secondary"><X size={18} /></button>
              </div>
              <div className="overflow-y-auto px-3 pb-4">
                <div className="grid grid-cols-3 gap-2">
                  {MORE_ITEMS.map(item => {
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => go(item.id)}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary/40 hover:bg-secondary border-border'
                        }`}
                      >
                        <item.icon size={20} />
                        <span className="text-[11px] font-medium text-center leading-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick Actions Modal */}
      <AnimatePresence>
        {quickOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setQuickOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-background rounded-t-3xl border-t border-border"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex justify-center pt-3"><div className="w-10 h-1 rounded-full bg-muted" /></div>
              <div className="flex items-center justify-between px-5 py-3">
                <h3 className="font-semibold flex items-center gap-2"><Plus size={18} className="text-primary" /> Quick Actions</h3>
                <button onClick={() => setQuickOpen(false)} className="p-1.5 rounded-md hover:bg-secondary"><X size={18} /></button>
              </div>
              <div className="p-4 pt-1 grid grid-cols-2 gap-2.5">
                {QUICK_ACTIONS.map(qa => (
                  <button
                    key={qa.label}
                    onClick={() => go(qa.tab)}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 hover:from-primary/10 hover:to-primary/5 border border-border active:scale-[0.98] transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <qa.icon size={18} />
                    </div>
                    <span className="text-sm font-medium leading-tight">{qa.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
