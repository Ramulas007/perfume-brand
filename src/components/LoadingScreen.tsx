import { useSiteSettings } from "@/hooks/useSiteSettings";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LoadingScreenProps {
  isVisible?: boolean;
}

export const LoadingScreen = ({ isVisible = true }: LoadingScreenProps) => {
  const { loaderLogoUrl, logoUrl } = useSiteSettings();
  const [extraSettings, setExtraSettings] = useState({
    rotationSpeed: 2,
    glowEnabled: true,
    pulseEnabled: true,
    backgroundColor: '#ffffff',
  });

  useEffect(() => {
    const fetchExtra = async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'loader_settings').single();
      if (data?.value) {
        const val = data.value as any;
        setExtraSettings({
          rotationSpeed: val.rotationSpeed ?? 2,
          glowEnabled: val.glowEnabled ?? true,
          pulseEnabled: val.pulseEnabled ?? true,
          backgroundColor: val.backgroundColor || '#ffffff',
        });
      }
    };
    fetchExtra();
  }, []);
  
  // Priority: 1. Loader Logo, 2. Site Logo, 3. Default Spinner
  const displayIcon = loaderLogoUrl || logoUrl;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: extraSettings.backgroundColor }}
        >
          <div className="relative">
            {displayIcon ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative flex flex-col items-center gap-6"
              >
                {/* Glow Effect */}
                {extraSettings.glowEnabled && (
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                )}
                
                {/* Loader Icon with smooth rotation */}
                <motion.img
                  src={displayIcon}
                  alt="Loading..."
                  className="w-24 h-24 md:w-32 md:h-32 object-contain relative z-10"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: extraSettings.rotationSpeed,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                {/* Pulse Text */}
                {extraSettings.pulseEnabled && (
                  <motion.p
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-muted-foreground font-medium tracking-widest text-sm uppercase"
                  >
                    Loading
                  </motion.p>
                )}
              </motion.div>
            ) : (
              // Default fallback spinner
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                <p className="text-muted-foreground font-medium text-sm">Helpful Perfumes</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
