import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, ChevronDown, ChevronRight, LogOut, UserCircle, Shield, Phone, Home, Bell, History, TrendingUp, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';

import { useAuth } from '@/context/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useCategories } from '@/hooks/useProducts';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useDesignSettings } from '@/hooks/useDesignSettings';
import { products } from '@/data/products';
import { isCustomProduct } from '@/types/product';
import { OptimizedImage } from './OptimizedImage';
import { isLocalPerfumeCatalogEnabled } from '@/data/perfumeCatalog';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(null);
  const [mobileShowCategories, setMobileShowCategories] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof products>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  
  const { totalItems, setIsCartOpen, totalPrice } = useCart();
  
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { categories } = useCategories();
  const { siteName, logoUrl, headerPhone, headerTagline, announcementEnabled, announcementText, announcementLink, loading: settingsLoading } = useSiteSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const adminUrl = '/admin';

  // Build parent → children tree
  const categoryTree = useMemo(() => {
    const parents = categories.filter((c: any) => !c.parent_id);
    return parents.map((p: any) => ({
      ...p,
      children: categories.filter((c: any) => c.parent_id === p.id),
    }));
  }, [categories]);

  const categoryHref = (c: any) =>
    c?.slug === 'custom-products' || c?.name === 'Custom Products' ? '/customize' : `/category/${c.slug}`;

  const navItems = useMemo(() => {
    const categoryDropdowns = categoryTree.map((p: any) => ({
      label: p.name,
      href: categoryHref(p),
      submenu: p.children.length > 0
        ? p.children.map((c: any) => ({ label: c.name, href: categoryHref(c) }))
        : null,
    }));
    return [
      { label: 'Shop', href: '/shop', submenu: null },
      ...categoryDropdowns,
    ] as Array<{ label: string; href: string | null; submenu: Array<{ label: string; href: string }> | null }>;
  }, [categoryTree]);

  useEffect(() => {
    let frameId: number | null = null;
    let lastY = window.scrollY;
    let downStartY = lastY;
    let upStartY = lastY;
    let hidden = lastY > 140;
    let lastToggleAt = 0;

    setIsScrolled(hidden);

    const handleScroll = () => {
      if (frameId !== null) return;

      frameId = window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const delta = scrollY - lastY;
        const now = Date.now();

        if (Math.abs(delta) < 8) {
          lastY = scrollY;
          frameId = null;
          return;
        }

        const scrollingDown = delta > 0;

        if (scrollingDown) {
          upStartY = scrollY;
        } else {
          downStartY = scrollY;
        }

        if (scrollY < 24) {
          if (hidden) {
            hidden = false;
            setIsScrolled(false);
          }
          downStartY = scrollY;
          upStartY = scrollY;
          lastToggleAt = now;
          lastY = scrollY;
          frameId = null;
          return;
        }

        if (!hidden && scrollingDown && scrollY > 120 && scrollY - downStartY > 90 && now - lastToggleAt > 450) {
          hidden = true;
          lastToggleAt = now;
          upStartY = scrollY;
          setIsScrolled(true);
        }

        if (hidden && !scrollingDown && upStartY - scrollY > 180 && now - lastToggleAt > 450) {
          hidden = false;
          lastToggleAt = now;
          downStartY = scrollY;
          setIsScrolled(false);
        }

        lastY = scrollY;
        frameId = null;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const searchTerm = searchQuery.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
    setSearchResults(filtered.slice(0, 5));
    setShowSearchResults(true);
  }, [searchQuery]);

  // Lock body scroll when mobile menu or mobile search is open
  useEffect(() => {
    if (isMobileMenuOpen || isMobileSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen, isMobileSearchOpen]);

  // Handle focus for mobile search input
  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 100);
    }
  }, [isMobileSearchOpen]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
  }, []);

  const addToRecentSearches = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const popularProducts = useMemo(() => {
    return products.slice(0, 4);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleMobileSubmenu = (label: string) => {
    setExpandedMobileMenu(expandedMobileMenu === label ? null : label);
  };

  const handleProductClick = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product && isCustomProduct(product)) {
      navigate('/customize');
    } else {
      navigate(`/product/${productId}`);
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleSearchSubmit = (e?: React.FormEvent, forcedQuery?: string) => {
    e?.preventDefault();
    const queryToUse = forcedQuery || searchQuery;
    if (queryToUse.trim()) {
      addToRecentSearches(queryToUse.trim());
      navigate(`/shop?search=${encodeURIComponent(queryToUse.trim())}`);
      setSearchQuery('');
      setShowSearchResults(false);
      setIsMobileSearchOpen(false);
    }
  };

  const handleMobileProductClick = (productId: string) => {
    handleProductClick(productId);
    setIsMobileSearchOpen(false);
  };

  const displayLogo = logoUrl || (isLocalPerfumeCatalogEnabled() ? '/helpful-perfumes/helpful-perfumes-logo-transparent.png' : null);
  const logoReady = !settingsLoading;
  const LogoImg = ({ className }: { className: string }) =>
    displayLogo ? (
      <img src={displayLogo} alt={siteName} className={className} loading="eager" decoding="async" />
    ) : (
      <span className="font-display text-lg md:text-xl font-bold tracking-wide text-foreground whitespace-nowrap">
        {siteName}
      </span>
    );

  const { settings: design } = useDesignSettings();
  const headerMode = design?.mobileNav?.headerMode || 'both';
  if (headerMode === 'bottom-only' || headerMode === 'none') return null;

  return (
    <header className="sticky top-0 z-40 bg-background">
      {/* ===== Announcement Bar ===== */}
      {announcementEnabled && announcementText && (
        <div className="bg-black text-white text-xs sm:text-sm py-2 px-4 text-center">
          {announcementLink ? (
            <a href={announcementLink} className="hover:underline font-medium">
              {announcementText}
            </a>
          ) : (
            <span className="font-medium">{announcementText}</span>
          )}
        </div>
      )}
      <div
        className="transition-all duration-300 bg-background"
      >
        {/* ===== ROW 1: Search | Logo | Phone + Icons ===== */}
        <div>
          <div className="container mx-auto px-4">
            {/* Mobile Row 1 */}
            {(() => {
              const mn = design?.mobileNav;
              const bottomNavActive = !!mn?.enabled && mn.headerMode !== 'header' && mn.headerMode !== 'none';
              return (
            <div className="flex lg:hidden items-center justify-between h-12 relative px-2 sm:px-4">
              <div className="flex items-center gap-1">
                <button
                  aria-label="Menu"
                  className="p-2 hover:bg-secondary rounded-md transition-colors text-foreground"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <Menu size={20} />
                </button>
                {!bottomNavActive && (
                  <button
                    aria-label="Search"
                    onClick={() => setIsMobileSearchOpen(true)}
                    className="p-2 hover:bg-secondary rounded-md transition-colors text-foreground/80"
                  >
                    <Search size={20} />
                  </button>
                )}
              </div>

              <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex h-10 w-28 items-center justify-center overflow-visible">
                {logoReady ? (
                  <LogoImg className="max-h-9 max-w-full object-contain" />
                ) : (
                  <div className="h-8 w-20" />
                )}
              </Link>

              <div className="flex items-center gap-1">
                {!bottomNavActive && (
                  <button
                    aria-label="Cart"
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-2 text-foreground/80"
                  >
                    <ShoppingCart size={20} />
                    {totalItems > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground text-[10px] min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center font-bold ring-2 ring-background">
                        {totalItems}
                      </span>
                    )}
                  </button>
                )}
                <Link
                  to={user ? "/profile" : "/auth"}
                  aria-label="Account"
                  className="p-2 text-foreground/80"
                >
                  <User size={20} />
                </Link>
              </div>
            </div>
              );
            })()}



            {/* Desktop Row 1 */}
            <div className="hidden lg:flex items-center justify-between h-16">
              {/* Left: Search */}
              <div ref={searchRef} className="relative w-80">
                <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-background rounded-full pl-4 pr-1 py-0.5 border border-border focus-within:border-foreground/40 transition-colors">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-foreground/50 outline-none py-1"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1 bg-foreground text-background text-xs font-medium rounded-full px-3 py-1 hover:bg-foreground/90 transition-colors"
                  >
                    <Search className="h-3 w-3" />
                    Search
                  </button>
                </form>




                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {showSearchResults && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                    >
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => handleProductClick(product.id)}
                          className="flex items-center gap-3 p-3 hover:bg-secondary cursor-pointer transition-colors"
                        >
                          <OptimizedImage src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-lg" width={40} />
                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                            <p className="text-primary font-semibold text-xs">৳ {product.price}</p>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Center: Logo */}
              <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex h-14 w-40 items-center justify-center overflow-visible">
                {logoReady ? (
                  <LogoImg className="max-h-12 max-w-full object-contain" />
                ) : (
                  <div className="h-12 w-32" />
                )}
              </Link>

              {/* Right: Price + Circular Icons */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground/80 mr-1">৳ {totalPrice.toFixed(2)}</span>

                {/* Cart */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  aria-label="Cart"
                  className="relative w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-foreground transition-colors"
                >
                  <ShoppingCart size={18} />
                  <span className="absolute -top-0.5 -right-0.5 bg-emerald-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                </button>


                {/* User */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Account"
                      className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-foreground transition-colors"
                    >
                      <User size={18} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border border-border shadow-lg z-50">
                    {user ? (
                      <>
                        <div className="px-3 py-2">
                          <p className="text-sm font-medium">Your Account</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/profile" className="cursor-pointer">
                            <UserCircle size={16} className="mr-2" />
                            My Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/notifications" className="cursor-pointer">
                            <Bell size={16} className="mr-2" />
                            Notifications
                          </Link>
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <a href={adminUrl} className="cursor-pointer text-accent">
                                <Shield size={16} className="mr-2" />
                                Admin Panel
                              </a>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                          <LogOut size={16} className="mr-2" />
                          Sign Out
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link to="/auth" className="cursor-pointer">
                          <User size={16} className="mr-2" />
                          Login / Register
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

          </div>
        </div>

        {/* ===== ROW 2: Promo | Nav Links | Offers ===== */}
        <div
          className={`hidden lg:block border-t border-border/60 transition-all duration-300 ease-out ${
            isScrolled ? 'max-h-0 opacity-0 border-transparent overflow-hidden' : 'max-h-20 opacity-100 overflow-visible'
          }`}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center h-12">
              {/* Center: Nav links */}
              <nav className="flex items-center gap-5 flex-nowrap">
                {navItems.map((item) => {
                  const isActive = item.href
                    ? (item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href))
                    : false;
                  return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => item.submenu && setActiveDropdown(item.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    {item.href ? (
                      <Link
                        to={item.href}
                        className="group/nav relative text-xs font-medium text-foreground/75 hover:text-emerald-600 transition-colors py-3 flex items-center gap-1 whitespace-nowrap"
                      >
                        {item.label}
                        <span className="pointer-events-none absolute left-0 right-0 bottom-2 h-[3px] bg-emerald-500 rounded-full origin-center transition-transform duration-300 ease-out scale-x-0 group-hover/nav:scale-x-100" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                        className="group/nav relative text-xs font-medium text-foreground/75 hover:text-emerald-600 transition-colors py-3 flex items-center gap-1 whitespace-nowrap"
                      >
                        {item.label}
                        <ChevronDown size={13} className={`transition-transform ${activeDropdown === item.label ? 'rotate-180' : ''}`} />
                        <span
                          className={`pointer-events-none absolute left-0 right-0 bottom-2 h-[3px] bg-emerald-500 rounded-full origin-center transition-transform duration-300 ease-out ${activeDropdown === item.label ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100'}`}
                        />
                      </button>
                    )}


                    {/* Dropdown */}
                    <AnimatePresence>
                      {item.submenu && activeDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="pt-3 z-50 absolute top-full left-1/2 -translate-x-1/2 w-max min-w-[14rem]"
                        >
                          <div className="relative bg-card border border-border/50 shadow-2xl">
                            <div className="flex flex-col">
                              {item.submenu.map((subItem, sIdx) => (
                                <Link
                                  key={subItem.href}
                                  to={subItem.href}
                                  onClick={() => setActiveDropdown(null)}
                                  className={`block px-5 py-3 text-[12px] uppercase tracking-[0.15em] font-bold text-foreground hover:text-emerald-600 hover:bg-muted/40 transition-colors whitespace-nowrap ${sIdx > 0 ? 'border-t border-border/40' : ''}`}
                                >
                                  {subItem.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

      </div>

      {/* ===== Mobile Menu Overlay ===== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-card z-50 lg:hidden shadow-2xl overflow-y-auto"
            >
              <div className="p-5">
                {/* Drawer header */}
                <div className="flex items-center justify-between mb-6">
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                    <LogoImg className="h-10 w-auto object-contain" />
                  </Link>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-secondary rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Mobile Search */}
                <form onSubmit={handleSearchSubmit} className="mb-5">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-9 pr-4 py-3 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </form>

                {/* Mobile Nav Links */}
                <nav className="space-y-1">
                  <Link
                    to="/"
                    className="block py-3 px-4 rounded-lg hover:bg-secondary transition-colors font-medium text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/shop"
                    className="block py-3 px-4 rounded-lg hover:bg-secondary transition-colors font-medium text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Shop
                  </Link>

                  {/* All Categories accordion */}
                  <div>
                    <button
                      onClick={() => setMobileShowCategories(!mobileShowCategories)}
                      className="flex items-center justify-between w-full py-3 px-4 rounded-lg hover:bg-secondary transition-colors font-medium text-sm"
                    >
                      All Categories
                      <motion.span animate={{ rotate: mobileShowCategories ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={16} />
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {mobileShowCategories && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden pl-2"
                        >
                          {categoryTree.map((parent: any) => {
                            const hasChildren = parent.children.length > 0;
                            const isExpanded = expandedMobileMenu === parent.name;
                            return (
                              <div key={parent.id} className="border-b border-border/40 last:border-0">
                                <div className="flex items-stretch">
                                  <Link
                                    to={categoryHref(parent)}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex-1 py-2.5 px-3 text-sm font-medium hover:text-primary transition-colors"
                                  >
                                    {parent.name}
                                  </Link>
                                  {hasChildren && (
                                    <button
                                      onClick={() => toggleMobileSubmenu(parent.name)}
                                      aria-label={`Toggle ${parent.name} sub-categories`}
                                      className="px-3 hover:bg-secondary rounded-md transition-colors"
                                    >
                                      <motion.span animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }} className="inline-block">
                                        <ChevronRight size={16} />
                                      </motion.span>
                                    </button>
                                  )}
                                </div>
                                <AnimatePresence>
                                  {hasChildren && isExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                      className="overflow-hidden bg-secondary/30 rounded-md mb-2"
                                    >
                                      {parent.children.map((child: any) => (
                                        <Link
                                          key={child.id}
                                          to={categoryHref(child)}
                                          onClick={() => setIsMobileMenuOpen(false)}
                                          className="block py-2 px-5 text-sm text-muted-foreground hover:text-primary transition-colors"
                                        >
                                          {child.name}
                                        </Link>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </nav>

                {/* Quick actions */}
                <div className="mt-6 pt-6 border-t border-border space-y-2">
                  {user ? (
                    <>
                      <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-secondary text-sm">
                        <UserCircle size={18} className="text-muted-foreground" />
                        My Profile
                      </Link>
                      {isAdmin && (
                        <a href={adminUrl} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-secondary text-sm text-accent">
                          <Shield size={18} />
                          Admin Panel
                        </a>
                      )}
                      <button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-secondary text-sm text-destructive w-full">
                        <LogOut size={18} />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium justify-center">
                      <User size={18} />
                      Login / Register
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* ===== Mobile Search Overlay ===== */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[60] bg-background flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button 
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors"
              >
                <ChevronRight className="rotate-180" size={24} />
              </button>
              
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <form onSubmit={handleSearchSubmit}>
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products..."
                    className="w-full bg-secondary/50 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </form>
              </div>

              <button 
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-background">
              {/* Recent Searches */}
              {!searchQuery && recentSearches.length > 0 && (
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <History size={14} />
                      Recent Searches
                    </h3>
                    <button 
                      onClick={clearRecentSearches}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSearchQuery(term);
                          handleSearchSubmit(undefined, term);
                        }}
                        className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-full text-xs font-medium transition-colors border border-border/40"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Products (when empty) */}
              {!searchQuery && (
                <div className="p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-4">
                    <TrendingUp size={14} />
                    Popular Searches
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {popularProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleMobileProductClick(product.id)}
                        className="flex items-center gap-3 p-2 hover:bg-secondary rounded-xl cursor-pointer transition-colors border border-transparent hover:border-border/40"
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          <OptimizedImage src={product.image} alt={product.name} className="w-full h-full object-cover" width={56} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                          <p className="text-primary font-bold text-xs mt-0.5">৳ {product.price}</p>
                        </div>
                        <ArrowRight size={14} className="text-muted-foreground opacity-50 mr-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real-time Search Results */}
              {searchQuery && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {searchResults.length > 0 ? `Results for "${searchQuery}"` : 'No results found'}
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleMobileProductClick(product.id)}
                        className="flex items-center gap-3 p-2 hover:bg-secondary rounded-xl cursor-pointer transition-colors border border-transparent hover:border-border/40"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          <OptimizedImage src={product.image} alt={product.name} className="w-full h-full object-cover" width={64} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-primary font-bold text-sm">৳ {product.price}</span>
                            <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">{product.category}</span>
                          </div>
                        </div>
                        <div className="bg-primary/10 text-primary p-2 rounded-full">
                          <ShoppingCart size={16} />
                        </div>
                      </div>
                    ))}
                    
                    {searchResults.length > 0 && (
                      <button
                        onClick={() => handleSearchSubmit()}
                        className="w-full mt-4 py-3 bg-secondary hover:bg-secondary/80 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        See all {searchResults.length}+ results
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
