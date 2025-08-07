import React, { useState } from 'react';
import { ModernMessagingApp } from '../MessagingV2/ModernMessagingApp';
import { Card } from '@/components/ui/card';

/**
 * 🎯 CONVERSATION PANEL - Clean messaging interface
 * Wraps the existing ModernMessagingApp with improved UX
 */

export const ConversationPanel: React.FC = () => {
  return (
    <Card className="h-[600px] overflow-hidden">
      <ModernMessagingApp className="h-full" />
    </Card>
  );
};