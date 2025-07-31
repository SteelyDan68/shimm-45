// Extended profile data that maps directly to the unified profiles table
export interface ExtendedProfileData {
  // Basic Information (auto-populated from auth/onboarding)
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  date_of_birth?: string;
  gender?: string;
  
  // Address Information
  address?: {
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
  location?: string;
  
  // Professional Information
  organization?: string;
  department?: string;
  job_title?: string;
  primary_role?: string;
  secondary_role?: string;
  niche?: string;
  creative_strengths?: string;
  challenges?: string;
  
  // Social Media Handles (direct database fields)
  instagram_handle?: string;
  youtube_handle?: string;
  tiktok_handle?: string;
  facebook_handle?: string;
  twitter_handle?: string;
  snapchat_handle?: string;
  
  // Contact Management
  manager_name?: string;
  manager_email?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  
  // Health and Accessibility
  physical_limitations?: string;
  neurodiversity?: string;
  
  // Business Information
  client_category?: string;
  client_status?: string;
  tags?: string[];
  
  // System Data (JSONB fields)
  platforms?: string[];
  preferences?: {
    notifications?: {
      email: boolean;
      sms: boolean;
      inApp: boolean;
    };
    allowAiAnalysis?: boolean;
  };
  custom_fields?: Record<string, any>;
  profile_metadata?: Record<string, any>;
}

export const PRIMARY_ROLES = [
  'Influencer',
  'Content Creator',
  'Youtuber',
  'Podcaster',
  'Blogger',
  'Musiker',
  'Skådespelare',
  'Entreprenör',
  'Coach/Rådgivare',
  'Expert/Specialist',
  'Författare',
  'Konstnär',
  'Annat'
];

export const PLATFORMS = [
  'YouTube',
  'Instagram',
  'TikTok',
  'LinkedIn',
  'Twitter/X',
  'Facebook',
  'Podcast',
  'Blog',
  'Twitch',
  'Discord',
  'Clubhouse',
  'Spotify'
];

export const COUNTRIES = [
  'Sverige',
  'Norge',
  'Danmark',
  'Finland',
  'Tyskland',
  'Storbritannien',
  'USA',
  'Kanada',
  'Australien',
  'Annat'
];