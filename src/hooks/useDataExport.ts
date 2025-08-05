import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface ExportConfig {
  dataTypes: string[];
  format: 'csv' | 'excel' | 'json';
  name: string;
  includeMetadata: boolean;
  filters?: {
    dateRange?: {
      start: Date;
      end: Date;
    };
    userIds?: string[];
    status?: string;
    categories?: string[];
  };
}

export interface ExportTemplate {
  id?: string;
  name: string;
  description: string;
  dataTypes: string[];
  format: string;
  includeMetadata: boolean;
  filters?: any;
  created_at?: string;
}

export interface ExportHistoryItem {
  id: string;
  name: string;
  format: string;
  dataTypes: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  file_url?: string;
  error_message?: string;
}

export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Load templates and history from database
  const loadTemplatesAndHistory = useCallback(async () => {
    if (!user) return;

    try {
      // Load export templates from database
      const { data: templatesData, error: templatesError } = await supabase
        .from('export_templates')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      // Load export history from database
      const { data: historyData, error: historyError } = await supabase
        .from('export_requests')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (historyError) throw historyError;

      // Map database data to interface format
      const mappedTemplates: ExportTemplate[] = (templatesData || []).map(t => ({
        id: t.id,
        name: t.name,
        description: t.description || '',
        dataTypes: t.data_types,
        format: t.format,
        includeMetadata: t.include_metadata,
        filters: t.filters,
        created_at: t.created_at
      }));

      const mappedHistory: ExportHistoryItem[] = (historyData || []).map(h => ({
        id: h.id,
        name: h.name,
        format: h.format,
        dataTypes: h.data_types,
        status: h.status as 'pending' | 'processing' | 'completed' | 'failed',
        created_at: h.created_at,
        completed_at: h.completed_at,
        file_url: h.file_url,
        error_message: h.error_message
      }));

      setTemplates(mappedTemplates);
      setExportHistory(mappedHistory);
    } catch (error) {
      console.error('Error loading templates and history:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda exportdata",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // Export data
  const exportData = useCallback(async (config: ExportConfig) => {
    if (!user) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Start the export process using edge function
      const { data: exportData, error: exportError } = await supabase.functions.invoke('export-data', {
        body: {
          ...config,
          user_id: user.id
        }
      });

      if (exportError) throw exportError;

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Check completion status from database
      const checkStatus = async (exportId: string) => {
        const { data: statusData, error: statusError } = await supabase
          .from('export_requests')
          .select('status, file_url, error_message')
          .eq('id', exportId)
          .single();

        if (statusError) throw statusError;

        if (statusData.status === 'completed') {
          clearInterval(progressInterval);
          setExportProgress(100);
          
          setTimeout(() => {
            setIsExporting(false);
            setExportProgress(0);
          }, 1000);

          toast({
            title: "Export slutförd",
            description: "Din data är klar för nedladdning."
          });

          loadTemplatesAndHistory();
          
          // Auto-download if file URL is available
          if (statusData.file_url) {
            window.open(statusData.file_url, '_blank');
          }
        } else if (statusData.status === 'failed') {
          clearInterval(progressInterval);
          setIsExporting(false);
          setExportProgress(0);
          
          toast({
            title: "Export misslyckades",
            description: statusData.error_message || "Ett okänt fel inträffade",
            variant: "destructive"
          });
        } else {
          // Still processing, check again
          setTimeout(() => checkStatus(exportId), 2000);
        }
      };

      if (exportData?.export_id) {
        setTimeout(() => checkStatus(exportData.export_id), 2000);
      }

    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
      setExportProgress(0);
      
      toast({
        title: "Export misslyckades",
        description: "Ett fel inträffade vid export av data",
        variant: "destructive"
      });
    }
  }, [user, toast, loadTemplatesAndHistory]);

  // Save export template to database
  const saveTemplate = useCallback(async (template: Omit<ExportTemplate, 'id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('export_templates')
        .insert({
          name: template.name,
          description: template.description,
          data_types: template.dataTypes,
          format: template.format,
          include_metadata: template.includeMetadata,
          filters: template.filters || {},
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Mall sparad",
        description: `Exportmallen "${template.name}" har sparats.`
      });

      loadTemplatesAndHistory();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara mallen",
        variant: "destructive"
      });
    }
  }, [user, toast, loadTemplatesAndHistory]);

  // Download export from database
  const downloadExport = useCallback(async (exportId: string) => {
    try {
      const { data, error } = await supabase
        .from('export_requests')
        .select('file_url, name, status')
        .eq('id', exportId)
        .single();

      if (error) throw error;

      if (data.status === 'completed' && data.file_url) {
        // Create download link
        const link = document.createElement('a');
        link.href = data.file_url;
        link.download = data.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast({
          title: "Fil inte tillgänglig",
          description: "Exporten är inte klar än eller filen har upphört att gälla",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Nedladdning misslyckades",
        description: "Kunde inte ladda ner filen",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Load template from database
  const loadTemplate = useCallback(async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from('export_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading template:', error);
      return null;
    }
  }, []);

  // Initialize
  React.useEffect(() => {
    if (user) {
      loadTemplatesAndHistory();
    }
  }, [user, loadTemplatesAndHistory]);

  return {
    isExporting,
    exportProgress,
    templates,
    exportHistory,
    exportData,
    saveTemplate,
    downloadExport,
    loadTemplate,
    loadTemplatesAndHistory
  };
};