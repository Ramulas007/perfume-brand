import { MessageCircle } from 'lucide-react';
import { usePageContent } from '@/hooks/usePageContent';

export const WhatsAppFab = () => {
  const { contactContent } = usePageContent();
  if (contactContent?.whatsappEnabled === false) return null;
  const number = contactContent?.whatsappNumber || '8801712345678';
  const message = encodeURIComponent('Hello! I have a question about your products.');
  const href = `https://wa.me/${number}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fab-whatsapp fab-safe fixed right-3 md:right-4 bottom-6 z-40 group transition-[bottom] duration-300"
    >
      <span className="absolute inset-0 rounded-[22px_22px_22px_4px] md:rounded-[28px_28px_28px_6px] bg-[#25D366] animate-ping opacity-40" />
      <span
        className="relative flex items-center justify-center h-11 w-11 md:h-14 md:w-14 rounded-[22px_22px_22px_4px] md:rounded-[28px_28px_28px_6px] bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.7)] hover:scale-110 active:scale-95 transition-transform duration-300"
      >
        <MessageCircle size={20} strokeWidth={2.2} fill="currentColor" className="text-white/95 md:hidden" />
        <MessageCircle size={26} strokeWidth={2.2} fill="currentColor" className="text-white/95 hidden md:block" />
      </span>
    </a>
  );
};

export default WhatsAppFab;
