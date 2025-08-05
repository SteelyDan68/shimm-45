import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUserAttributes } from '@/hooks/useUserAttributes';
import { PillarKey } from '@/types/sixPillarsModular';

export interface UserPillarActivation {
  id: string;
  user_id: string;
  pillar_key: PillarKey;
  is_active: boolean;
  activated_by: string;
  activated_at: string;
  updated_at: string;
}

export interface UserPillarAssessment {
  id: string;
  user_id: string;
  pillar_key: PillarKey;
  assessment_data: any;
  calculated_score: number | null;
  ai_analysis: string | null;
  insights: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useUserPillars = (userId: string) => {
  const [activations, setActivations] = useState<UserPillarActivation[]>([]);
  const [assessments, setAssessments] = useState<UserPillarAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const { 
    getAttribute, 
    setAttribute, 
    hasAttribute,
    loading: attributesLoading 
  } = useUserAttributes(userId);

  const fetchActivations = async () => {
    if (!userId) return;
    
    try {
      // Get pillar activations from user attributes
      const activationsData = await getAttribute(userId, 'pillar_activations');
      const activationsArray = Array.isArray(activationsData) ? activationsData : [];
      
      // Convert attribute data to expected format
      const formattedActivations: UserPillarActivation[] = activationsArray.map((activation: any) => ({
        id: activation.id || `activation_${activation.pillar_key}_${Date.now()}`,
        user_id: userId,
        pillar_key: activation.pillar_key,
        is_active: activation.is_active !== false, // Default to true
        activated_by: activation.activated_by || userId,
        activated_at: activation.activated_at || new Date().toISOString(),
        updated_at: activation.updated_at || new Date().toISOString()
      }));
      
      setActivations(formattedActivations);
    } catch (error) {
      console.error('Error fetching pillar activations from attributes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pillar activations",
        variant: "destructive",
      });
    }
  };

  const fetchAssessments = async () => {
    if (!userId) return;
    
    try {
      // Get pillar assessments from user attributes
      const assessmentsData = await getAttribute(userId, 'pillar_assessments');
      const assessmentsArray = Array.isArray(assessmentsData) ? assessmentsData : [];
      
      // Convert attribute data to expected format
      const formattedAssessments: UserPillarAssessment[] = assessmentsArray.map((assessment: any) => ({
        id: assessment.id || `assessment_${assessment.pillar_key}_${Date.now()}`,
        user_id: userId,
        pillar_key: assessment.pillar_key,
        assessment_data: assessment.assessment_data || {},
        calculated_score: assessment.calculated_score || null,
        ai_analysis: assessment.ai_analysis || null,
        insights: assessment.insights || {},
        created_by: assessment.created_by || userId,
        created_at: assessment.created_at || new Date().toISOString(),
        updated_at: assessment.updated_at || new Date().toISOString()
      }));
      
      setAssessments(formattedAssessments);
    } catch (error) {
      console.error('Error fetching pillar assessments from attributes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pillar assessments",
        variant: "destructive",
      });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchActivations(), fetchAssessments()]);
    setLoading(false);
  };

  useEffect(() => {
    if (userId && !attributesLoading) {
      fetchData();
    } else if (!userId) {
      setActivations([]);
      setAssessments([]);
      setLoading(false);
    }
  }, [userId, attributesLoading]);

  const activatePillar = async (pillarKey: PillarKey) => {
    if (!userId) return;

    try {
      // Get current activations
      const currentActivationsData = await getAttribute(userId, 'pillar_activations');
      const currentActivations = Array.isArray(currentActivationsData) ? currentActivationsData : [];
      
      // Find existing activation or create new one
      const existingIndex = currentActivations.findIndex((a: any) => a.pillar_key === pillarKey);
      const newActivation = {
        id: `activation_${pillarKey}_${Date.now()}`,
        pillar_key: pillarKey,
        is_active: true,
        activated_by: userId,
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let updatedActivations;
      if (existingIndex >= 0) {
        // Update existing activation
        updatedActivations = [...currentActivations];
        updatedActivations[existingIndex] = {
          ...updatedActivations[existingIndex],
          is_active: true,
          updated_at: new Date().toISOString()
        };
      } else {
        // Add new activation
        updatedActivations = [...currentActivations, newActivation];
      }

      // Save to attributes
      await setAttribute(userId, {
        attribute_key: 'pillar_activations',
        attribute_value: updatedActivations,
        attribute_type: 'metadata'
      });
      
      await fetchActivations();
      toast({
        title: "Success",
        description: "Pillar activated successfully",
      });
    } catch (error) {
      console.error('Error activating pillar:', error);
      toast({
        title: "Error",
        description: "Failed to activate pillar",
        variant: "destructive",
      });
    }
  };

  const deactivatePillar = async (pillarKey: PillarKey) => {
    if (!userId) return;

    try {
      // Get current activations
      const currentActivationsData = await getAttribute(userId, 'pillar_activations');
      const currentActivations = Array.isArray(currentActivationsData) ? currentActivationsData : [];
      
      // Update activation status
      const updatedActivations = currentActivations.map((activation: any) =>
        activation.pillar_key === pillarKey 
          ? { 
              ...activation, 
              is_active: false, 
              deactivated_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : activation
      );

      // Save to attributes
      await setAttribute(userId, {
        attribute_key: 'pillar_activations',
        attribute_value: updatedActivations,
        attribute_type: 'metadata'
      });
      
      await fetchActivations();
      toast({
        title: "Success",
        description: "Pillar deactivated successfully",
      });
    } catch (error) {
      console.error('Error deactivating pillar:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate pillar",
        variant: "destructive",
      });
    }
  };

  const getActivatedPillars = () => {
    return activations
      .filter(activation => activation.is_active)
      .map(activation => activation.pillar_key);
  };

  const getCompletedPillars = () => {
    return assessments
      .filter(assessment => assessment.calculated_score !== null)
      .map(assessment => assessment.pillar_key)
      .filter((pillarKey, index, arr) => arr.indexOf(pillarKey) === index); // Remove duplicates
  };

  const getLatestAssessment = (pillarKey: PillarKey) => {
    return assessments.find(assessment => assessment.pillar_key === pillarKey);
  };

  const isPillarActive = (pillarKey: PillarKey) => {
    return activations.some(activation => 
      activation.pillar_key === pillarKey && activation.is_active
    );
  };

  const savePillarAssessment = async (pillarKey: PillarKey, assessmentData: any, calculatedScore?: number, aiAnalysis?: string) => {
    if (!userId) return;

    try {
      // Get current assessments
      const currentAssessmentsData = await getAttribute(userId, 'pillar_assessments');
      const currentAssessments = Array.isArray(currentAssessmentsData) ? currentAssessmentsData : [];
      
      // Create new assessment
      const newAssessment = {
        id: `assessment_${pillarKey}_${Date.now()}`,
        pillar_key: pillarKey,
        assessment_data: assessmentData,
        calculated_score: calculatedScore || null,
        ai_analysis: aiAnalysis || null,
        insights: {},
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Remove any existing assessment for this pillar and add the new one
      const filteredAssessments = currentAssessments.filter((a: any) => a.pillar_key !== pillarKey);
      const updatedAssessments = [...filteredAssessments, newAssessment];

      // Save to attributes
      await setAttribute(userId, {
        attribute_key: 'pillar_assessments',
        attribute_value: updatedAssessments,
        attribute_type: 'metadata'
      });
      
      await fetchAssessments();
      toast({
        title: "Success",
        description: "Pillar assessment saved successfully",
      });
    } catch (error) {
      console.error('Error saving pillar assessment:', error);
      toast({
        title: "Error",
        description: "Failed to save pillar assessment",
        variant: "destructive",
      });
    }
  };

  return {
    activations,
    assessments,
    loading: loading || attributesLoading,
    activatePillar,
    deactivatePillar,
    getActivatedPillars,
    getLatestAssessment,
    isPillarActive,
    refetch: fetchData,
    getCompletedPillars,
    savePillarAssessment, // New method for saving assessments
  };
};