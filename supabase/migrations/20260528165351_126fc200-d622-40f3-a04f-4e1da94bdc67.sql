CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  phone text,
  full_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  provider text,
  role text,
  role_granted_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin only' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    au.id,
    au.email::text,
    au.phone::text,
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name')::text AS full_name,
    au.created_at,
    au.last_sign_in_at,
    COALESCE(au.raw_app_meta_data->>'provider', 'email')::text AS provider,
    ur.role::text AS role,
    ur.created_at AS role_granted_at
  FROM auth.users au
  LEFT JOIN public.user_roles ur
    ON ur.user_id = au.id
   AND ur.role = 'admin'::public.app_role
  ORDER BY au.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_add_role_by_email(_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin only' USING ERRCODE = '42501';
  END IF;

  SELECT au.id
  INTO target_id
  FROM auth.users au
  WHERE lower(au.email) = lower(trim(_email))
  LIMIT 1;

  IF target_id IS NULL THEN
    RAISE EXCEPTION 'User with this email not found. Ask them to sign up first.' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN target_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_remove_role(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin only' USING ERRCODE = '42501';
  END IF;

  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot remove yourself' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = _user_id
    AND role = 'admin'::public.app_role;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_role_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_remove_role(uuid) TO authenticated;