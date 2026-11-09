import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface APKInfo {
  apk_url: string;
  version: string;
  file_size: number | null;
}

export const useActiveAPK = () => {
  const [activeAPK, setActiveAPK] = useState<APKInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveAPK = async () => {
      try {
        const { data, error } = await supabase
          .from('apk_management')
          .select('apk_url, version, file_size')
          .eq('is_active', true)
          .maybeSingle();

        if (error) throw error;
        setActiveAPK(data);
      } catch (error) {
        console.error('Error fetching active APK:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveAPK();
  }, []);

  return { activeAPK, loading };
};