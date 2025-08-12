-- Ensure invitation token validation function exists and is correct
-- This function is called from the frontend via supabase.rpc('validate_invitation_token', { invitation_token })
-- It must not rely on table permissions (SECURITY DEFINER) and should only expose minimal fields

create or replace function public.validate_invitation_token(invitation_token text)
returns table(
  invitation_id uuid,
  email text,
  invited_role text,
  expires_at timestamp with time zone,
  is_valid boolean
)
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  return query
    select 
      i.id as invitation_id,
      i.email,
      i.invited_role::text as invited_role,
      i.expires_at,
      (i.status = 'pending' and (i.expires_at is null or i.expires_at > now())) as is_valid
    from public.invitations i
    where i.token = invitation_token
    order by i.created_at desc
    limit 1;
end;
$$;

comment on function public.validate_invitation_token(text) is 'Validates an invitation token and returns minimal, safe fields; uses SECURITY DEFINER to bypass RLS for read-only lookup.';