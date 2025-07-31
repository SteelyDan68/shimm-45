export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  settings?: {
    industry?: string;
    size?: string;
    founded?: string;
    [key: string]: any;
  };
  status: 'active' | 'inactive' | 'prospect';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  permissions?: any;
  invited_by?: string;
  joined_at: string;
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