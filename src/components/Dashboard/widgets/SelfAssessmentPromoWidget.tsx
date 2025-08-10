/**
 * 🎯 SELF ASSESSMENT PROMO WIDGET - Fristående widget för självskattning
 * Flyttes från WelcomeWidget för att placeras separat enligt specifikation
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WelcomeAssessmentCard } from '@/components/Dashboard/WelcomeAssessmentCard';
import { useAuth } from '@/providers/UnifiedAuthProvider';

const SelfAssessmentPromoWidget: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user?.id) {
    return null;
  }

  return (
    <div className="space-y-4">
      <WelcomeAssessmentCard userId={user.id} />
    </div>
  );
};

export { SelfAssessmentPromoWidget };
export default SelfAssessmentPromoWidget;