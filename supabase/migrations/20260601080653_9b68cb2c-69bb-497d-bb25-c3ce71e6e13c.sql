CREATE POLICY "Admins can insert AI logs"
ON public.ai_generation_logs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid());