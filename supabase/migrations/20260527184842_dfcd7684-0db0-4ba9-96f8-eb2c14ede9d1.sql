
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type text NOT NULL,
  recipient text NOT NULL,
  subject text,
  status text NOT NULL DEFAULT 'pending',
  provider_id text,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all email logs"
ON public.email_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);
