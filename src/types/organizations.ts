export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  logo_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: any;
  settings?: any;
  status?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface OrganizationMember {
  id: string;
  organization_id?: string | null;
  user_id?: string | null;
  role?: 'superadmin' | 'admin' | 'client' | 'user' | 'manager' | 'editor' | 'organization' | null;
  permissions?: any;
  invited_by?: string | null;
  joined_at?: string | null;
}

export interface OrganizationFilters {
  search: string;
  status: 'all' | 'active' | 'inactive' | 'prospect';
  industry: string;
}

export interface OrganizationStats {
  total: number;
  active: number;
  inactive: number;
  prospects: number;
  byIndustry: Record<string, number>;
}