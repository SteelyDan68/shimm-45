import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface ImportConfig {
  file: File;
  type: string;
  mode: 'create' | 'update' | 'upsert';
  columnMapping: Record<string, string>;
  validationSettings: {
    skipEmptyRows: boolean;
    validateEmails: boolean;
    validateDates: boolean;
    maxErrors: number;
  };
}

export interface ImportHistoryItem {
  id: string;
  fileName: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  errors: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface ValidationError {
  row: number;
  column: string;
  error: string;
  value: any;
}

export interface ImportPreview {
  headers: string[];
  rows: any[][];
  totalRows: number;
  validRows: number;
  errors: ValidationError[];
}

export const useDataImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Load import history (mock implementation)
  const loadImportHistory = useCallback(async () => {
    if (!user) return;

    try {
      // Mock data for demonstration
      const mockHistory: ImportHistoryItem[] = [
        {
          id: '1',
          fileName: 'users_import_2024-01-15.csv',
          type: 'users',
          status: 'completed',
          totalRows: 150,
          processedRows: 150,
          errors: 0,
          created_at: new Date().toISOString()
        }
      ];

      setImportHistory(mockHistory);
    } catch (error) {
      console.error('Error loading import history:', error);
    }
  }, [user]);

  // Validate file and preview data
  const previewImport = useCallback(async (file: File, type: string): Promise<ImportPreview> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          // Simple CSV parsing (for demo purposes)
          const lines = content.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const rows = lines.slice(1, 11).map(line => 
            line.split(',').map(cell => cell.trim().replace(/"/g, ''))
          );

          // Basic validation
          const errors: ValidationError[] = [];
          let validRows = 0;

          rows.forEach((row, index) => {
            let isValid = true;
            
            row.forEach((cell, cellIndex) => {
              const header = headers[cellIndex];
              
              // Email validation
              if (header.toLowerCase().includes('email') && cell) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(cell)) {
                  errors.push({
                    row: index + 2, // +2 because we start from line 2 and arrays are 0-indexed
                    column: header,
                    error: 'Ogiltig e-postadress',
                    value: cell
                  });
                  isValid = false;
                }
              }

              // Required field validation
              if (['email', 'name', 'title'].some(req => header.toLowerCase().includes(req)) && !cell) {
                errors.push({
                  row: index + 2,
                  column: header,
                  error: 'Obligatoriskt fält saknas',
                  value: cell
                });
                isValid = false;
              }
            });

            if (isValid) validRows++;
          });

          resolve({
            headers,
            rows,
            totalRows: lines.length - 1,
            validRows,
            errors
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsText(file);
    });
  }, []);

  // Import data
  const importData = useCallback(async (config: ImportConfig) => {
    if (!user) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Convert file to base64 for transfer
      const fileBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:type;base64, prefix
        };
        reader.readAsDataURL(config.file);
      });

      // Start the import process
      const { data, error } = await supabase.functions.invoke('import-data', {
        body: {
          file_data: fileBase64,
          file_name: config.file.name,
          file_type: config.file.type,
          import_type: config.type,
          import_mode: config.mode,
          column_mapping: config.columnMapping,
          validation_settings: config.validationSettings,
          user_id: user.id
        }
      });

      if (error) throw error;

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 800);

      // Simulate completion for demo
      const checkStatus = async (importId: string) => {
        // Simulate processing time
        setTimeout(() => {
          clearInterval(progressInterval);
          setImportProgress(100);
          
          setTimeout(() => {
            setIsImporting(false);
            setImportProgress(0);
          }, 1000);

          toast({
            title: "Import slutförd",
            description: `Data från ${config.file.name} har importerats framgångsrikt.`
          });

          // Add to mock history
          const newHistoryItem: ImportHistoryItem = {
            id: Date.now().toString(),
            fileName: config.file.name,
            type: config.type,
            status: 'completed',
            totalRows: 100, // Mock value
            processedRows: 100, // Mock value
            errors: 0,
            created_at: new Date().toISOString()
          };

          setImportHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);
        }, 3000);
      };

      if (data?.import_id) {
        setTimeout(() => checkStatus(data.import_id), 2000);
      }

    } catch (error) {
      console.error('Import error:', error);
      setIsImporting(false);
      setImportProgress(0);
      
      toast({
        title: "Import misslyckades",
        description: "Ett fel inträffade vid import av data",
        variant: "destructive"
      });
    }
  }, [user, toast, loadImportHistory]);

  // Download template
  const downloadTemplate = useCallback(async (type: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('download-template', {
        body: { type }
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([data.content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_template.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Mall nedladdad",
        description: `Mallen för ${type} har laddats ner.`
      });
    } catch (error) {
      console.error('Template download error:', error);
      toast({
        title: "Nedladdning misslyckades",
        description: "Kunde inte ladda ner mallen",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Get import status (mock implementation)
  const getImportStatus = useCallback(async (importId: string) => {
    try {
      const item = importHistory.find(h => h.id === importId);
      return item || null;
    } catch (error) {
      console.error('Error getting import status:', error);
      return null;
    }
  }, [importHistory]);

  // Validate file format
  const validateFile = useCallback((file: File): boolean => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    return validTypes.includes(file.type) || file.name.endsWith('.csv');
  }, []);

  // Initialize
  React.useEffect(() => {
    if (user) {
      loadImportHistory();
    }
  }, [user, loadImportHistory]);

  return {
    isImporting,
    importProgress,
    importHistory,
    importData,
    previewImport,
    downloadTemplate,
    getImportStatus,
    validateFile,
    loadImportHistory
  };
};