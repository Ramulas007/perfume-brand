import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export const Preloader = () => {
  const { logoUrl } = useSiteSettings();
  const displayLogo = logoUrl || logo;
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 20);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
        >
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-background to-accent/3" />

          <div className="relative flex flex-col items-center gap-6">
            {/* Logo with gentle pulse */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <motion.img
                src={displayLogo}
                alt="Logo"
                className="w-24 h-24 md:w-32 md:h-32 object-contain"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Minimal progress bar */}
            <div className="w-40 md:w-48">
              <div className="relative h-[3px] bg-border/50 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
