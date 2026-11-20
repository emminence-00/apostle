-- Supabase's event-trigger helper only needs to run as postgres. It should not
-- be callable through the REST API by browser roles.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
