import React from 'react';
import { useStefanWorkTriggers } from '@/hooks/useStefanWorkTriggers';

/**
 * Separate component that handles Stefan work triggers
 * Must be rendered INSIDE StefanContextProvider
 */
export const StefanWorkTriggersManager = () => {
  // This hook will now work because it's inside the provider
  useStefanWorkTriggers();
  
  // This component doesn't render anything visible
  return null;
};