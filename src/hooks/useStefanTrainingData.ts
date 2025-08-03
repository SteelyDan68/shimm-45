import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/components/ui/use-toast';

export interface TrainingDataEntry {
  id: string;
  content: string;
  content_type: 'manual' | 'text_file' | 'pdf';
  subject?: string;
  date_created?: string;
  tone?: string;
  client_name?: string;
  file_url?: string;
  original_filename?: string;
  file_size_bytes?: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface TrainingDataFormData {
  content: string;
  content_type: 'manual' | 'text_file' | 'pdf';
  subject?: string;
  date_created?: string;
  tone?: string;
  client_name?: string;
  file?: File;
}

export const useStefanTrainingData = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState<TrainingDataEntry[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTrainingData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: trainingData, error } = await supabase
        .from('training_data_stefan')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setData((trainingData || []) as TrainingDataEntry[]);
    } catch (error: any) {
      console.error('Error fetching training data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta träningsdata",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // For now, return a placeholder - in a real implementation you'd use a PDF parser
    return `[PDF-innehåll från ${file.name} - ${Math.round(file.size / 1024)}KB]`;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('stefan-training-data')
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('stefan-training-data')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const addTrainingData = async (formData: TrainingDataFormData) => {
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad",
        variant: "destructive",
      });
      return false;
    }

    setUploading(true);
    try {
      let content = formData.content;
      let fileUrl: string | null = null;
      let originalFilename: string | undefined;
      let fileSizeBytes: number | undefined;

      // Handle file upload
      if (formData.file) {
        originalFilename = formData.file.name;
        fileSizeBytes = formData.file.size;

        // Upload file to storage
        fileUrl = await uploadFile(formData.file);

        // Extract content based on file type
        if (formData.content_type === 'pdf') {
          content = await extractTextFromPDF(formData.file);
        } else if (formData.content_type === 'text_file') {
          content = await formData.file.text();
        }
      }

      // Save to database
      const { error } = await supabase
        .from('training_data_stefan')
        .insert({
          user_id: user.id,
          content,
          content_type: formData.content_type,
          subject: formData.subject,
          date_created: formData.date_created,
          tone: formData.tone,
          client_name: formData.client_name,
          file_url: fileUrl,
          original_filename: originalFilename,
          file_size_bytes: fileSizeBytes,
        });

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Träningsdata har sparats",
      });

      // Refresh data
      await fetchTrainingData();
      return true;

    } catch (error: any) {
      console.error('Error adding training data:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte spara träningsdata",
        variant: "destructive",
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  const deleteTrainingData = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('training_data_stefan')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Borttaget",
        description: "Träningsdata har tagits bort",
      });

      await fetchTrainingData();
      return true;

    } catch (error: any) {
      console.error('Error deleting training data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort träningsdata",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    data,
    loading,
    uploading,
    fetchTrainingData,
    addTrainingData,
    deleteTrainingData,
  };
};