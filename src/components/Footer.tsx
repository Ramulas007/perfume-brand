import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MapPin, 
  ArrowRight, 
  MessageCircle
} from 'lucide-react';

const FacebookIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const InstagramIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

import paymentMethodsImage from '@/assets/payment-methods.png';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useFooterSettings } from '@/hooks/useFooterSettings';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { usePageContent } from '@/hooks/usePageContent';
import { useActiveAPK } from '@/hooks/useActiveAPK';
import { OptimizedImage } from './OptimizedImage';
import { Smartphone, Download as DownloadIcon, Loader2 } from 'lucide-react';
import { isLocalPerfumeCatalogEnabled } from '@/data/perfumeCatalog';

const legalLinks = [
  { label: 'Return & Exchange Policy', href: '/return-policy' },
  { label: 'Terms & Conditions', href: '/terms-conditions' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'FAQ', href: '/faq' },
];

export const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { footerContent, socialLinks, paymentMethods } = useFooterSettings();
  const { siteName, logoUrl, loading: settingsLoading } = useSiteSettings();
  const { contactContent } = usePageContent();
  const { activeAPK, loading: apkLoading } = useActiveAPK();
  const [downloading, setDownloading] = useState(false);
  const displayLogo = logoUrl || (isLocalPerfumeCatalogEnabled() ? '/helpful-perfumes/helpful-perfumes-logo-transparent.png' : null);

  const localPerfumeMode = isLocalPerfumeCatalogEnabled();
  const contactPhone = localPerfumeMode ? footerContent.phone : (contactContent?.phones?.[0] || footerContent.phone);
  const contactEmail = localPerfumeMode ? footerContent.email : (contactContent?.emails?.[0] || footerContent.email);
  const contactAddress = localPerfumeMode ? footerContent.address : (contactContent?.address?.join(', ') || footerContent.address);
  const waNumber = (localPerfumeMode ? contactPhone : (contactContent?.whatsappNumber || contactPhone || '')).replace(/\D/g, '');

  const handleDownloadAPK = () => {
    if (!activeAPK) return;
    setDownloading(true);
    const link = document.createElement('a');
    link.href = activeAPK.apk_url;
    link.download = `HelpfulPerfumes-v${activeAPK.version}.apk`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 2000);
    toast.success('Starting APK download...');
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    
    setIsSubscribing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Successfully subscribed to newsletter!');
    setEmail('');
    setIsSubscribing(false);
  };

  // Build payment methods array based on enabled settings
  const activePaymentMethods = [
    ...(paymentMethods.bkash ? [{ name: 'bKash', color: 'from-pink-500 to-pink-600' }] : []),
    ...(paymentMethods.nagad ? [{ name: 'Nagad', color: 'from-orange-500 to-orange-600' }] : []),
    ...(paymentMethods.roket ? [{ name: 'Rocket', color: 'from-purple-500 to-purple-600' }] : []),
    ...(paymentMethods.cod ? [{ name: 'COD', color: 'from-emerald-500 to-emerald-600' }] : []),
  ];

  // Build social links array based on configured links
  const displaySocialLinks = [
    ...(socialLinks.facebook ? [{ icon: FacebookIcon, href: socialLinks.facebook, label: 'Facebook' }] : []),
    ...(socialLinks.instagram ? [{ icon: InstagramIcon, href: socialLinks.instagram, label: 'Instagram' }] : []),
  ];

  return (
    <footer className="relative overflow-hidden lg:mb-0">
      {/* Decorative Background */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, hsl(0 0% 8%) 0%, hsl(0 0% 4%) 50%, hsl(0 0% 0%) 100%)' }} />


      {/* Main Footer Content */}
      <div className="relative container mx-auto px-3 md:px-4 pt-5 md:pt-10 pb-3 md:pb-5">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-4 md:gap-4">
          {/* Brand section */}
          <div className="col-span-2 md:col-span-5 text-center md:text-left">
            <Link to="/" className="inline-block mb-2 md:mb-4">
              {settingsLoading ? (
                <div className="h-10 md:h-14 w-28 md:w-40" />
              ) : displayLogo ? (
                <OptimizedImage
                  src={displayLogo}
                  alt={siteName}
                  className="h-10 md:h-14 w-auto object-contain"
                  containerClassName="bg-transparent"
                  priority={false}
                />
              ) : (
                <span className="font-display text-xl md:text-3xl font-bold text-primary-foreground">
                  {siteName}
                </span>
              )}
            </Link>
            <p className="text-primary-foreground/80 text-[8px] md:text-sm leading-relaxed mb-2 md:mb-6 line-clamp-3 md:line-clamp-none">
              {footerContent.tagline}
            </p>

            {/* APK Download Button */}
            {activeAPK && (
              <div className="mb-4 md:mb-6">
                <Button 
                  onClick={handleDownloadAPK}
                  disabled={downloading}
                  className="relative overflow-hidden group bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] text-white border border-white/10 rounded-xl px-4 md:px-6 py-4 md:py-6 h-auto transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-colors">
                      {downloading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Smartphone className="w-5 h-5 text-accent" />
                      )}
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-[10px] md:text-xs text-primary-foreground/60 uppercase tracking-wider font-bold">Download Our App</span>
                      <span className="text-xs md:text-sm font-bold flex items-center gap-2">
                        Android APK v{activeAPK.version}
                        {activeAPK.file_size && (
                          <span className="text-[10px] font-normal opacity-60">
                            ({(activeAPK.file_size / (1024 * 1024)).toFixed(1)}MB)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  {/* Glass Shine Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]" />
                </Button>
              </div>
            )}


            <p className="font-semibold mb-1.5 md:mb-3 text-[8px] md:text-sm text-primary-foreground">We Accept:</p>
            <div className="max-w-[280px] md:max-w-[340px] mx-auto md:mx-0">
              <img
                src={paymentMethodsImage}
                alt="Accepted payment methods"
                className="w-full h-auto object-contain"
                loading="lazy"
              />
            </div>
          </div>

          <div className="col-span-1 md:col-span-4">
            <h4 className="font-bold text-[9px] md:text-base mb-1.5 md:mb-5 text-primary-foreground flex items-center gap-1 md:gap-2">
              <span className="w-3 md:w-8 h-0.5 bg-accent rounded-full" />
              Legal
            </h4>
            <ul className="space-y-1 md:space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-[8px] md:text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-1 md:col-span-3">
            <h4 className="font-bold text-[9px] md:text-base mb-1.5 md:mb-5 text-primary-foreground flex items-center gap-1 md:gap-2">
              <span className="w-3 md:w-8 h-0.5 bg-accent rounded-full" />
              Contact
            </h4>
            
            <ul className="space-y-1.5 md:space-y-4">
              <li className="flex items-center gap-1.5 md:gap-3">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded md:rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
                  <Phone className="w-3 h-3 md:w-4 md:h-4 text-accent" strokeWidth={2} />
                </div>
                <span className="text-primary-foreground text-[7px] md:text-sm">{contactPhone}</span>
              </li>
              <li className="flex items-center gap-1.5 md:gap-3">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded md:rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
                  <Mail className="w-3 h-3 md:w-4 md:h-4 text-accent" strokeWidth={2} />
                </div>
                <span className="text-primary-foreground text-[6px] md:text-xs truncate">{contactEmail}</span>
              </li>
              <li className="flex items-center gap-1.5 md:gap-3">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded md:rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
                  <MapPin className="w-3 h-3 md:w-4 md:h-4 text-accent" strokeWidth={2} />
                </div>
                <span className="text-primary-foreground text-[7px] md:text-sm">{contactAddress}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright + Socials — single compact row */}
      <div className="relative border-t border-primary-foreground/10">
        <div className="container mx-auto px-3 md:px-6 py-2.5 md:py-3.5">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            <p className="text-[9px] md:text-sm text-primary-foreground/70 truncate">
              © {new Date().getFullYear()} <span className="text-primary-foreground font-medium">{footerContent.copyright}</span>
              <span className="mx-1.5 md:mx-2 text-primary-foreground/30">|</span>
              <span className="text-primary-foreground/60 hidden sm:inline">All rights reserved</span>
            </p>

            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              {contactContent?.whatsappEnabled !== false && (
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="flex items-center gap-1 md:gap-1.5 bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-full px-2 md:px-3 py-1 md:py-1.5 transition-all"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 md:w-4 md:h-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span className="text-[9px] md:text-xs font-semibold">WhatsApp</span>
                </a>
              )}

              {displaySocialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-primary-foreground/30 text-primary-foreground/90 flex items-center justify-center hover:bg-primary-foreground hover:text-background transition-all"
                >
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
