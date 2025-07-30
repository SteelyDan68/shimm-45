export interface ExtendedProfileData {
  // 1. Grundinformation
  basicInfo: {
    fullName: string;
    username?: string;
    gender?: string;
    dateOfBirth?: string;
    profilePicture?: string;
    bio?: string;
  };
  
  // 2. Kontaktuppgifter
  contactInfo: {
    email: string;
    phone?: string;
    address?: {
      street?: string;
      postalCode?: string;
      city?: string;
      country?: string;
    };
  };
  
  // 3. Digital närvaro
  digitalPresence: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  
  // 4. Arbetsprofil & AI-kontext
  workProfile: {
    primaryRole?: string;
    secondaryRole?: string;
    niche?: string;
    creativeStrengths?: string;
    challenges?: string;
    activePlatforms: string[];
  };
  
  // 5. Hälsa och särskilda behov
  healthInfo?: {
    diagnoses?: string;
    physicalVariations?: string;
    generalHealth?: string;
  };
  
  // 6. Systeminställningar
  systemSettings: {
    notificationPreferences: {
      email: boolean;
      sms: boolean;
      inApp: boolean;
    };
    allowAiAnalysis: boolean;
    userRole?: string; // endast synlig för admin
  };
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