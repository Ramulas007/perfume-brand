REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_add_role_by_email(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_remove_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_add_role_by_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_remove_role(uuid) FROM anon;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_role_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_remove_role(uuid) TO authenticated;