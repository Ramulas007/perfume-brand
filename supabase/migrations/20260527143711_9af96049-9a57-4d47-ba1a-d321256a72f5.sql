
-- Expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  voucher_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage expenses" ON public.expenses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Investments table
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  investment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investments TO authenticated;
GRANT ALL ON public.investments TO service_role;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage investments" ON public.investments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Finance settings (key/value)
CREATE TABLE public.finance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_settings TO authenticated;
GRANT ALL ON public.finance_settings TO service_role;
ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage finance settings" ON public.finance_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_finance_settings_updated_at BEFORE UPDATE ON public.finance_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for vouchers (private, admin-only)
INSERT INTO storage.buckets (id, name, public) VALUES ('finance-vouchers', 'finance-vouchers', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins read finance vouchers" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'finance-vouchers' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins upload finance vouchers" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'finance-vouchers' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update finance vouchers" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'finance-vouchers' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete finance vouchers" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'finance-vouchers' AND has_role(auth.uid(), 'admin'));
