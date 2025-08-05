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

  // Load templates and history (mock implementation for now)
  const loadTemplatesAndHistory = useCallback(async () => {
    if (!user) return;

    try {
      // Mock data for demonstration
      const mockTemplates: ExportTemplate[] = [
        {
          id: '1',
          name: 'Monthly User Report',
          description: 'Export all user data from the last month',
          dataTypes: ['users', 'tasks'],
          format: 'csv',
          includeMetadata: true,
          created_at: new Date().toISOString()
        }
      ];

      const mockHistory: ExportHistoryItem[] = [
        {
          id: '1',
          name: 'user_export_2024-01-15',
          format: 'csv',
          dataTypes: ['users'],
          status: 'completed',
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          file_url: '#'
        }
      ];

      setTemplates(mockTemplates);
      setExportHistory(mockHistory);
    } catch (error) {
      console.error('Error loading templates and history:', error);
    }
  }, [user]);

  // Export data
  const exportData = useCallback(async (config: ExportConfig) => {
    if (!user) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Start the export process
      const { data, error } = await supabase.functions.invoke('export-data', {
        body: {
          ...config,
          user_id: user.id
        }
      });

      if (error) throw error;

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

      // Simulate completion for demo
      const checkStatus = async (exportId: string) => {
        // Simulate processing time
        setTimeout(() => {
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

          // Add to mock history
          const newHistoryItem: ExportHistoryItem = {
            id: Date.now().toString(),
            name: config.name,
            format: config.format,
            dataTypes: config.dataTypes,
            status: 'completed',
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            file_url: '#'
          };

          setExportHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);
        }, 3000);
      };

      if (data?.export_id) {
        setTimeout(() => checkStatus(data.export_id), 2000);
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

  // Save export template (mock implementation)
  const saveTemplate = useCallback(async (template: Omit<ExportTemplate, 'id' | 'created_at'>) => {
    if (!user) return;

    try {
      const newTemplate: ExportTemplate = {
        ...template,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      };

      setTemplates(prev => [newTemplate, ...prev]);

      toast({
        title: "Mall sparad",
        description: `Exportmallen "${template.name}" har sparats.`
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara mallen",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // Download export (mock implementation)
  const downloadExport = useCallback(async (exportId: string) => {
    try {
      const exportItem = exportHistory.find(item => item.id === exportId);
      
      if (exportItem && exportItem.file_url && exportItem.status === 'completed') {
        // Simulate download
        toast({
          title: "Nedladdning startad",
          description: `Filen "${exportItem.name}" laddas ner...`
        });
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
  }, [toast, exportHistory]);

  // Load template (mock implementation)
  const loadTemplate = useCallback(async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      return template || null;
    } catch (error) {
      console.error('Error loading template:', error);
      return null;
    }
  }, [templates]);

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