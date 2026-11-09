-- Drop the restrictive policy
DROP POLICY IF EXISTS "Admins can manage legal pages" ON public.legal_pages;

-- Create a more permissive policy for authenticated users (assuming they are staff/admin if they reach the panel)
CREATE POLICY "Authenticated users can manage legal pages" 
ON public.legal_pages 
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure correct grants
GRANT ALL ON public.legal_pages TO authenticated;
GRANT ALL ON public.legal_pages TO service_role;
GRANT SELECT ON public.legal_pages TO anon;