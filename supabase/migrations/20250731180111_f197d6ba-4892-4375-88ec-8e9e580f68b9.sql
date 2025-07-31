-- Fix infinite recursion in organization_members RLS policies

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Org members can view other members" ON public.organization_members;

-- Create a security definer function to check organization membership
CREATE OR REPLACE FUNCTION public.is_organization_member(_user_id uuid, _organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _organization_id
      AND (invited_by IS NOT NULL OR joined_at IS NOT NULL)
  )
$$;

-- Create a function to get user's organization memberships
CREATE OR REPLACE FUNCTION public.get_user_organization_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id
    AND (invited_by IS NOT NULL OR joined_at IS NOT NULL)
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Org members can view other members" 
ON public.organization_members 
FOR SELECT 
USING (
  organization_id IN (
    SELECT public.get_user_organization_ids(auth.uid())
  )
);

-- Also update the user deletion utility to handle organization memberships properly
-- by ensuring we delete them in the correct order