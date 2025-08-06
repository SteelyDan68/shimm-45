/**
 * 🎯 UNIFIED PROFILE DATA STRUCTURE
 * 
 * Single Source of Truth för alla profildata i systemet
 * Ersätter alla fragmenterade interfaces och datastrukturer
 */

export interface UnifiedProfileData {
  // === GRUNDLÄGGANDE INFORMATION ===
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  
  // === DEMOGRAFISK DATA (OBLIGATORISK) ===
  date_of_birth: string; // YYYY-MM-DD format
  age?: number; // Beräknas automatiskt från födelsedatum
  gender: 'man' | 'kvinna' | 'annat' | 'vill_inte_ange';
  
  // === ADRESSINFORMATION ===
  address: {
    street?: string;
    postal_code?: string;
    city?: string;
    country?: string;
  };
  
  // === SOCIALA MEDIER (STANDARDISERADE FÄLT) ===
  social_media: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    facebook?: string;
    twitter?: string;
    snapchat?: string;
    website?: string;
  };
  
  // === PROFESSIONELL INFORMATION ===
  professional: {
    job_title?: string;
    organization?: string;
    department?: string;
    primary_role?: string;
    niche?: string;
    industry?: string;
  };
  
  // === PERSONLIGA ANTECKNINGAR ===
  notes?: string; // Fritt textfält för anteckningar
  
  // === SYSTEMDATA ===
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  onboarding_completed?: boolean;
  
  // === GDPR & SÄKERHET ===
  gdpr_consent?: boolean;
  data_processing_consent?: boolean;
  marketing_consent?: boolean;
  
  // === UTÖKAD INFORMATION (OPTIONAL) ===
  extended?: {
    personal_number?: string; // Personnummer för svenska användare
    emergency_contact?: {
      name?: string;
      phone?: string;
      relationship?: string;
    };
    preferences?: {
      language?: string;
      timezone?: string;
      notifications?: {
        email: boolean;
        sms: boolean;
        push: boolean;
      };
    };
    health_info?: {
      physical_limitations?: string;
      neurodiversity?: string;
      dietary_restrictions?: string;
    };
  };
}

// === VALIDATION RULES ===
export const PROFILE_VALIDATION = {
  required_fields: [
    'first_name',
    'last_name', 
    'email',
    'date_of_birth',
    'gender'
  ],
  social_media_minimum: 1, // Minst en social media måste fyllas i
  age_limits: {
    min: 13,
    max: 120
  }
} as const;

// === SOCIAL MEDIA PLATFORMS ===
export const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', placeholder: 'användarnamn', prefix: '@' },
  { key: 'youtube', label: 'YouTube', placeholder: 'kanalnamn', prefix: '@' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'användarnamn', prefix: '@' },
  { key: 'facebook', label: 'Facebook', placeholder: 'sidnamn', prefix: '' },
  { key: 'twitter', label: 'Twitter/X', placeholder: 'användarnamn', prefix: '@' },
  { key: 'snapchat', label: 'Snapchat', placeholder: 'användarnamn', prefix: '@' },
  { key: 'website', label: 'Webbsida', placeholder: 'https://...', prefix: '' }
] as const;

// === GENDER OPTIONS ===
export const GENDER_OPTIONS = [
  { value: 'man', label: 'Man' },
  { value: 'kvinna', label: 'Kvinna' },
  { value: 'annat', label: 'Annat' },
  { value: 'vill_inte_ange', label: 'Vill inte ange' }
] as const;

// === COUNTRIES ===
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
] as const;

// === UTILITY FUNCTIONS ===
export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const validateProfile = (profile: Partial<UnifiedProfileData>): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  // Check required fields
  PROFILE_VALIDATION.required_fields.forEach(field => {
    if (!profile[field as keyof UnifiedProfileData]) {
      errors.push(`${field} är obligatoriskt`);
    }
  });
  
  // Check age limits
  if (profile.date_of_birth) {
    const age = calculateAge(profile.date_of_birth);
    if (age < PROFILE_VALIDATION.age_limits.min) {
      errors.push(`Användaren måste vara minst ${PROFILE_VALIDATION.age_limits.min} år gammal`);
    }
    if (age > PROFILE_VALIDATION.age_limits.max) {
      errors.push(`Ålder kan inte vara över ${PROFILE_VALIDATION.age_limits.max} år`);
    }
  }
  
  // Check social media minimum
  const socialMediaCount = Object.values(profile.social_media || {}).filter(Boolean).length;
  if (socialMediaCount < PROFILE_VALIDATION.social_media_minimum) {
    errors.push('Minst en social media-plattform måste fyllas i');
  }
  
  // Validate email format
  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    errors.push('Ogiltig e-postadress');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const formatDisplayName = (profile: Partial<UnifiedProfileData>): string => {
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  return fullName || profile.email || 'Namnlös användare';
};

export const getInitials = (profile: Partial<UnifiedProfileData>): string => {
  return `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'U';
};

// === DATABASE MAPPING FUNCTIONS ===
export const mapToDatabase = (profile: UnifiedProfileData): any => {
  return {
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
    phone: profile.phone,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    date_of_birth: profile.date_of_birth,
    job_title: profile.professional?.job_title,
    organization: profile.professional?.organization,
    // Lagra strukturerad data som JSONB
    address: profile.address,
    social_links: profile.social_media,
    profile_extended: {
      gender: profile.gender,
      age: profile.age,
      notes: profile.notes,
      personal_number: profile.extended?.personal_number,
      emergency_contact: profile.extended?.emergency_contact,
      preferences: profile.extended?.preferences,
      health_info: profile.extended?.health_info,
      professional: profile.professional,
      gdpr_consent: profile.gdpr_consent,
      data_processing_consent: profile.data_processing_consent,
      marketing_consent: profile.marketing_consent
    }
  };
};

export const mapFromDatabase = (dbData: any): UnifiedProfileData => {
  const extended = dbData.profile_extended || {};
  
  return {
    first_name: dbData.first_name || '',
    last_name: dbData.last_name || '',
    email: dbData.email || '',
    phone: dbData.phone || '',
    bio: dbData.bio || '',
    avatar_url: dbData.avatar_url || '',
    date_of_birth: dbData.date_of_birth || '',
    age: extended.age || (dbData.date_of_birth ? calculateAge(dbData.date_of_birth) : undefined),
    gender: extended.gender || 'vill_inte_ange',
    address: dbData.address || {
      street: '',
      postal_code: '',
      city: '',
      country: 'Sverige'
    },
    social_media: dbData.social_links || {
      instagram: '',
      youtube: '',
      tiktok: '',
      facebook: '',
      twitter: '',
      snapchat: '',
      website: ''
    },
    professional: {
      job_title: dbData.job_title || extended.professional?.job_title || '',
      organization: dbData.organization || extended.professional?.organization || '',
      department: extended.professional?.department || '',
      primary_role: extended.professional?.primary_role || '',
      niche: extended.professional?.niche || '',
      industry: extended.professional?.industry || ''
    },
    notes: extended.notes || '',
    created_at: dbData.created_at,
    updated_at: dbData.updated_at,
    is_active: dbData.is_active,
    onboarding_completed: dbData.onboarding_completed,
    gdpr_consent: extended.gdpr_consent || false,
    data_processing_consent: extended.data_processing_consent || false,
    marketing_consent: extended.marketing_consent || false,
    extended: {
      personal_number: extended.personal_number || '',
      emergency_contact: extended.emergency_contact || {
        name: '',
        phone: '',
        relationship: ''
      },
      preferences: extended.preferences || {
        language: 'sv',
        timezone: 'Europe/Stockholm',
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      },
      health_info: extended.health_info || {
        physical_limitations: '',
        neurodiversity: '',
        dietary_restrictions: ''
      }
    }
  };
};