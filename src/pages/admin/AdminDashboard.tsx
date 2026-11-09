import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FolderTree,
  FileText,
  Settings,
  BarChart3,
  Menu,
  LogOut,
  Home,
  Image as ImageIcon,
  ChevronRight,
  Activity,
  Zap,
  BookOpen,
  Tag,
  Wallet,
  ChevronDown,
  Users,
  Bell,
  Sparkles,
  Wand2,
  Store,
  Bot,
  FileEdit,
  UserCog,
  SlidersHorizontal,
  Palette,
  X,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/context/AuthContext';
import { AdminProducts } from './AdminProducts';
import { AdminOrders } from './AdminOrders';
import { AdminCategories } from './AdminCategories';
import { AdminPages } from './AdminPages';
import { AdminSettings } from './AdminSettings';
import { AdminSales } from './AdminSales';
import { AdminBanners } from './AdminBanners';
import { AdminAPISettings } from './AdminAPISettings';
import { AdminImageMigration } from './AdminImageMigration';

import { AdminPagesContent } from './AdminPagesContent';
import { AdminCoupons } from './AdminCoupons';
import { AdminFinanceDashboard } from './AdminFinanceDashboard';
import { AdminUsers } from './AdminUsers';
import { AdminNotifications } from '@/components/admin/AdminNotifications';
import { AIProductUpload } from '@/components/admin/AIProductUpload';
import { MockupGenerator } from '@/components/admin/MockupGenerator';
import { AdminProfileMenu } from '@/components/admin/AdminProfileMenu';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSiteSettings } from '@/hooks/useSiteSettings';

type Tab =
  | 'dashboard'
  | 'products' | 'categories' | 'banners' | 'orders' | 'coupons'
  | 'ai-upload' | 'mockup-generator'
  | 'page-content' | 'pages'
  | 'users' | 'notifications'
  | 'finance' | 'sales'
  | 'settings' | 'api-settings' | 'image-migration';

type MenuItem = { id: Tab; label: string; icon: any };
type MenuGroup = { id: string; label: string; icon: any; items: MenuItem[] };

const menuGroups: MenuGroup[] = [
  {
    id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard,
    items: [{ id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard }],
  },
  {
    id: 'store', label: 'Store Management', icon: Store,
    items: [
      { id: 'products', label: 'Products', icon: Package },
      { id: 'categories', label: 'Categories', icon: FolderTree },
      { id: 'banners', label: 'Banners', icon: ImageIcon },
      { id: 'orders', label: 'Orders', icon: ShoppingBag },
      { id: 'coupons', label: 'Coupons', icon: Tag },
    ],
  },
  {
    id: 'ai', label: 'AI Tools', icon: Bot,
    items: [
      { id: 'ai-upload', label: 'AI Product Upload', icon: Sparkles },
      { id: 'mockup-generator', label: 'AI Mockup Generator', icon: Wand2 },
    ],
  },
  {
    id: 'content', label: 'Content Management', icon: FileEdit,
    items: [
      { id: 'page-content', label: 'Page Content', icon: BookOpen },
      { id: 'pages', label: 'Legal Pages', icon: FileText },
    ],
  },
  {
    id: 'users', label: 'User Management', icon: UserCog,
    items: [
      { id: 'users', label: 'Users & Admins', icon: Users },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    id: 'finance', label: 'Finance & Reports', icon: Wallet,
    items: [
      { id: 'finance', label: 'Finance & Accounts', icon: Wallet },
      { id: 'sales', label: 'Sales Report', icon: BarChart3 },
    ],
  },
  {
    id: 'system', label: 'System Settings', icon: SlidersHorizontal,
    items: [
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'api-settings', label: 'API Settings', icon: Zap },
      { id: 'image-migration', label: 'Convert Images → WebP', icon: ImageIcon },
    ],
  },
];

const findGroupForTab = (tab: Tab) =>
  menuGroups.find((g) => g.items.some((i) => i.id === tab))?.id ?? 'dashboard';

const tabLabel = (tab: Tab) => {
  for (const g of menuGroups) {
    const it = g.items.find((i) => i.id === tab);
    if (it) return it.label;
  }
  return 'Dashboard';
};

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    [findGroupForTab('dashboard')]: true,
  }));
  const { isAdmin, loading } = useAdmin();
  const { user, signOut } = useAuth();
  const { logoUrl, siteName } = useSiteSettings();
  const navigate = useNavigate();

  useEffect(() => {
    const g = findGroupForTab(activeTab);
    setOpenGroups((prev) => ({ ...prev, [g]: true }));
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-primary/20 rounded-full" />
            <div className="absolute inset-0 w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-sm">
          <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity size={24} className="text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground text-sm mb-6">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'coupons': return <AdminCoupons />;
      case 'banners': return <AdminBanners />;
      case 'products': return <AdminProducts />;
      case 'orders': return <AdminOrders />;
      case 'categories': return <AdminCategories />;
      case 'sales': return <AdminSales />;
      case 'page-content': return <AdminPagesContent />;
      case 'pages': return <AdminPages />;
      case 'settings': return <AdminSettings />;
      case 'api-settings': return <AdminAPISettings />;
      case 'image-migration': return <AdminImageMigration />;
      
      case 'finance': return <AdminFinanceDashboard />;
      case 'users': return <AdminUsers />;
      case 'notifications': return <AdminNotifications />;
      case 'ai-upload': return <AIProductUpload />;
      case 'mockup-generator': return <MockupGenerator />;
      default: return <DashboardOverview setActiveTab={setActiveTab} userEmail={user?.email} />;
    }
  };

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const initials = (user?.email || 'A').slice(0, 2).toUpperCase();

  const SidebarInner = (
    <>
      {/* Brand */}
      <div className="relative h-20 flex items-center justify-between px-4 border-b border-white/10 shrink-0 bg-gradient-to-r from-black via-zinc-900 to-black overflow-hidden group">
        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="flex items-center gap-3.5 relative">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-white/30 blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="relative w-14 h-14 bg-gradient-to-br from-white to-zinc-200 rounded-2xl flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(255,255,255,0.25)] ring-1 ring-white/40 group-hover:scale-[1.03] transition-transform duration-300">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="w-10 h-10 object-contain" />
              ) : (
                <img src="/helpful-perfumes/helpful-perfumes-logo-transparent.png" alt="Helpful Perfumes" className="w-10 h-10 object-contain" />
              )}
            </div>
          </div>
          <div className="leading-tight min-w-0">
            <p className="font-bold text-white text-[17px] tracking-tight truncate">{siteName || 'Helpful Perfumes'}</p>
            <p className="text-[10px] font-semibold text-white/45 uppercase tracking-[0.22em] mt-0.5">Dashboard</p>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white p-1 relative">
          <X size={18} />
        </button>
      </div>

      {/* Profile */}
      <div className="px-3 py-4 border-b border-white/10 shrink-0">
        <AdminProfileMenu />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {menuGroups.map((group, gi) => {
          const isOpen = !!openGroups[group.id];
          const hasActive = group.items.some((i) => i.id === activeTab);
          const single = group.items.length === 1;
          return (
            <div key={group.id}>
              {gi > 0 && <div className="h-px bg-white/5 mx-2 my-2" />}
              <button
                onClick={() => (single ? (setActiveTab(group.items[0].id), setSidebarOpen(false)) : toggleGroup(group.id))}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  hasActive
                    ? 'text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <group.icon size={16} className="shrink-0" />
                <span className="flex-1 text-left font-medium tracking-tight">{group.label}</span>
                {!single && (
                  <motion.div animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} className="text-white/40" />
                  </motion.div>
                )}
              </button>

              {!single && (
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-0.5 py-1">
                        {group.items.map((item) => {
                          const active = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-all relative ${
                                active
                                  ? 'bg-white text-black font-medium shadow-sm'
                                  : 'text-white/55 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <item.icon size={14} className="shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-white/10 p-3 space-y-1 shrink-0">
        <button
          onClick={() => {
            const host = window.location.hostname;
            if (host.startsWith('admin.')) {
              window.location.href = `${window.location.protocol}//${host.replace(/^admin\./, '')}/`;
            } else {
              navigate('/');
            }
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
        >
          <Home size={16} />
          <span>View Store</span>
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-300 hover:text-white hover:bg-red-500/20 transition-all"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 w-[270px] h-screen flex flex-col bg-gradient-to-b from-zinc-950 via-neutral-950 to-black border-r border-white/10 shadow-2xl transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {SidebarInner}
      </aside>

      {/* Main */}
      <div className="flex flex-col min-h-screen lg:pl-[270px]">
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border h-16 flex items-center px-4 md:px-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="font-semibold tracking-tight">{tabLabel(activeTab)}</h2>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Welcome back, manage your store with ease
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Live</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>

      <AdminMobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ setActiveTab, userEmail }: { setActiveTab: (tab: Tab) => void; userEmail?: string | null }) => {
  const [stats, setStats] = useState({
    products: 0, orders: 0, users: 0, totalSales: 0,
    todayOrders: 0, todayRevenue: 0, pendingOrders: 0, lowStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [latestProducts, setLatestProducts] = useState<any[]>([]);
  const [salesByDay, setSalesByDay] = useState<{ day: string; value: number }[]>([]);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); sevenDaysAgo.setHours(0,0,0,0);

      const [productsRes, ordersRes, usersRes, todayOrdersRes, pendingRes, lowStockRes, recentRes, latestProdRes, weeklyRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, total_amount'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, total_amount').gte('created_at', todayISO),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('in_stock', false),
        supabase.from('orders').select('id, full_name, total_amount, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('products').select('id, name, price, image_url, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('orders').select('total_amount, created_at').gte('created_at', sevenDaysAgo.toISOString()),
      ]);

      const totalSales = ordersRes.data?.reduce((s, o) => s + Number(o.total_amount || 0), 0) || 0;
      const todayRevenue = todayOrdersRes.data?.reduce((s, o) => s + Number(o.total_amount || 0), 0) || 0;

      setStats({
        products: productsRes.count || 0,
        orders: ordersRes.data?.length || 0,
        users: usersRes.count || 0,
        totalSales,
        todayOrders: todayOrdersRes.data?.length || 0,
        todayRevenue,
        pendingOrders: pendingRes.count || 0,
        lowStockProducts: lowStockRes.count || 0,
      });
      setRecentOrders(recentRes.data || []);
      setLatestProducts(latestProdRes.data || []);

      // Sales by day (last 7 days)
      const buckets: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
        buckets[d.toISOString().slice(0,10)] = 0;
      }
      weeklyRes.data?.forEach((o: any) => {
        const k = new Date(o.created_at).toISOString().slice(0,10);
        if (k in buckets) buckets[k] += Number(o.total_amount || 0);
      });
      setSalesByDay(Object.entries(buckets).map(([k, v]) => ({
        day: new Date(k).toLocaleDateString(undefined, { weekday: 'short' }),
        value: v,
      })));
    } catch (e) { console.error(e); }
  };

  const overall = [
    { title: 'Total Products', value: stats.products, icon: Package, tone: 'from-blue-500/10 to-blue-500/0 text-blue-600 dark:text-blue-400', tab: 'products' as Tab },
    { title: 'Total Orders', value: stats.orders, icon: ShoppingBag, tone: 'from-violet-500/10 to-violet-500/0 text-violet-600 dark:text-violet-400', tab: 'orders' as Tab },
    { title: 'Total Revenue', value: `৳${stats.totalSales.toLocaleString()}`, icon: DollarSign, tone: 'from-emerald-500/10 to-emerald-500/0 text-emerald-600 dark:text-emerald-400', tab: 'sales' as Tab },
    { title: 'Total Users', value: stats.users, icon: Users, tone: 'from-amber-500/10 to-amber-500/0 text-amber-600 dark:text-amber-400', tab: 'users' as Tab },
  ];

  const quickActions = [
    { label: 'Add Product', icon: Package, tab: 'products' as Tab },
    { label: 'View Orders', icon: ShoppingBag, tab: 'orders' as Tab },
    { label: 'New Banner', icon: ImageIcon, tab: 'banners' as Tab },
    { label: 'Coupons', icon: Tag, tab: 'coupons' as Tab },
    { label: 'AI Upload', icon: Sparkles, tab: 'ai-upload' as Tab },
    { label: 'Settings', icon: Settings, tab: 'settings' as Tab },
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'confirmed': case 'processing': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'shipped': return 'bg-violet-500/10 text-violet-600 dark:text-violet-400';
      case 'delivered': case 'completed': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  const maxSale = Math.max(1, ...salesByDay.map((s) => s.value));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-zinc-950 via-neutral-900 to-black text-white border border-white/10">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-xs uppercase tracking-widest text-white/50 mb-2">Welcome back</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Hello, Admin 👋</h1>
          <p className="text-sm text-white/60 mt-2 max-w-md">
            Here's a quick snapshot of your store. {stats.todayOrders} order{stats.todayOrders === 1 ? '' : 's'} today, ৳{stats.todayRevenue.toLocaleString()} revenue.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {overall.map((s, i) => (
          <motion.button
            key={s.title}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => setActiveTab(s.tab)}
            className={`text-left relative overflow-hidden bg-card rounded-2xl p-5 border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all group`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${s.tone} opacity-60`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center">
                  <s.icon size={18} />
                </div>
                <ChevronRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold tracking-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.title}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Sales chart + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Sales Analytics</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Revenue for the last 7 days</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={14} /> Live
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-40">
              {salesByDay.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.value / maxSale) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="w-full rounded-t-md bg-gradient-to-t from-foreground to-foreground/60"
                      title={`৳${d.value.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => setActiveTab(a.tab)}
                  className="flex flex-col items-start gap-2 p-3 rounded-xl border border-border hover:border-foreground/30 hover:bg-secondary/40 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <a.icon size={15} />
                  </div>
                  <span className="text-xs font-medium">{a.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders + Latest products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <button onClick={() => setActiveTab('orders')} className="text-xs text-muted-foreground hover:text-foreground">View all</button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{o.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">৳{Number(o.total_amount).toLocaleString()}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColor(o.status)}`}>{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Latest Products</CardTitle>
            <button onClick={() => setActiveTab('products')} className="text-xs text-muted-foreground hover:text-foreground">View all</button>
          </CardHeader>
          <CardContent>
            {latestProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No products yet</p>
            ) : (
              <div className="space-y-2">
                {latestProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="w-10 h-10 rounded-md bg-secondary overflow-hidden shrink-0">
                      {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-semibold shrink-0">৳{Number(p.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-4 space-y-4 border-l border-border">
            {[
              { icon: ShoppingBag, text: `${stats.todayOrders} new order${stats.todayOrders === 1 ? '' : 's'} received today`, time: 'Today' },
              { icon: DollarSign, text: `৳${stats.todayRevenue.toLocaleString()} revenue earned today`, time: 'Today' },
              { icon: Package, text: `${stats.lowStockProducts} product${stats.lowStockProducts === 1 ? '' : 's'} out of stock`, time: 'Now' },
              { icon: Activity, text: `${stats.pendingOrders} pending order${stats.pendingOrders === 1 ? '' : 's'} awaiting action`, time: 'Now' },
            ].map((a, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-background border-2 border-foreground/40" />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <a.icon size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{a.text}</p>
                    <p className="text-[11px] text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
