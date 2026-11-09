import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  last_updated: string;
}

export const useLegalPage = (slug: string) => {
  const [page, setPage] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('legal_pages')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (error) throw error;
        setPage(data);
      } catch (err: any) {
        console.error(`Error fetching legal page ${slug}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  return { page, loading, error };
};
