export interface OnboardingData {
  // Sektion 1 - Allmän information
  generalInfo: {
    name: string;
    age: string;
    gender: string;
    height: string;
    weight: string;
    physicalLimitations: string;
    neurodiversity: string;
  };
  
  // Sektion 2 - Offentlig roll
  publicRole: {
    primaryRole: string;
    secondaryRole: string;
    niche: string;
    creativeStrengths: string;
    platforms: string[];
    challenges: string;
    // Social media handles
    instagramHandle: string;
    youtubeHandle: string;
    tiktokHandle: string;
    snapchatHandle: string;
    facebookHandle: string;
    twitterHandle: string;
  };
  
  // Sektion 3 - Livskarta
  lifeMap: {
    location: string;
    livingWith: string;
    hasChildren: string;
    ongoingChanges: string;
    pastCrises: string;
  };
}

export interface OnboardingFormData extends OnboardingData {
  clientId: string;
}