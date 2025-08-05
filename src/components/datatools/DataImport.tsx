import React, { useState, useCallback } from 'react';
import { useDataImport } from '@/hooks/useDataImport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  X,
  Download,
  Eye,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const IMPORT_TYPES = [
  { value: 'users', label: 'Användare', description: 'Importera användardata och profiler' },
  { value: 'tasks', label: 'Uppgifter', description: 'Massimport av uppgifter' },
  { value: 'calendar', label: 'Kalender', description: 'Kalenderhändelser och möten' },
  { value: 'organizations', label: 'Organisationer', description: 'Organisationsdata' }
];

interface ValidationError {
  row: number;
  column: string;
  error: string;
  value: any;
}

interface ImportPreview {
  headers: string[];
  rows: any[][];
  totalRows: number;
  validRows: number;
  errors: ValidationError[];
}

interface DataImportProps {
  className?: string;
}

export const DataImport: React.FC<DataImportProps> = ({ className = "" }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<string>('');
  const [importMode, setImportMode] = useState<'create' | 'update' | 'upsert'>('create');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<ImportPreview | null>(null);
  const [validationSettings, setValidationSettings] = useState({
    skipEmptyRows: true,
    validateEmails: true,
    validateDates: true,
    maxErrors: 100
  });

  const {
    isImporting,
    importProgress,
    importData,
    validateFile,
    previewImport,
    importHistory,
    downloadTemplate,
    getImportStatus
  } = useDataImport();

  const { toast } = useToast();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
        toast({
          title: "Felaktigt filformat",
          description: "Endast CSV och Excel-filer stöds",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      setPreviewData(null);
    }
  }, [toast]);

  const handlePreview = async () => {
    if (!selectedFile || !importType) return;

    try {
      const preview = await previewImport(selectedFile, importType);
      setPreviewData(preview);
    } catch (error) {
      toast({
        title: "Förhandsgranskning misslyckades",
        description: "Kunde inte läsa filen. Kontrollera formatet.",
        variant: "destructive"
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !importType || !previewData) return;

    const importConfig = {
      file: selectedFile,
      type: importType,
      mode: importMode,
      columnMapping,
      validationSettings
    };

    try {
      await importData(importConfig);
      toast({
        title: "Import startad",
        description: "Datan importeras. Du kan följa framstegen nedan."
      });
      
      // Reset form
      setSelectedFile(null);
      setPreviewData(null);
      setColumnMapping({});
    } catch (error) {
      toast({
        title: "Import misslyckades",
        description: "Ett fel inträffade vid import av data",
        variant: "destructive"
      });
    }
  };

  const handleColumnMapping = (csvColumn: string, dbColumn: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [csvColumn]: dbColumn
    }));
  };

  const availableColumns = importType ? {
    users: ['email', 'first_name', 'last_name', 'organization', 'job_title', 'phone'],
    tasks: ['title', 'description', 'status', 'priority', 'deadline', 'assigned_to'],
    calendar: ['title', 'description', 'event_date', 'category', 'duration'],
    organizations: ['name', 'description', 'contact_email', 'website', 'address']
  }[importType] || [] : [];

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">Importera data</TabsTrigger>
          <TabsTrigger value="templates">Mallar</TabsTrigger>
          <TabsTrigger value="history">Historik</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          {/* File Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-lg flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Dataimport
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Import Type */}
              <div>
                <Label className="text-mobile-sm font-medium mb-2 block">
                  Typ av data att importera
                </Label>
                <Select value={importType} onValueChange={setImportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj datatyp" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPORT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div>
                <Label className="text-mobile-sm font-medium mb-2 block">
                  Välj fil att importera
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      {selectedFile ? (
                        <>
                          <FileSpreadsheet className="h-8 w-8 text-green-500" />
                          <div>
                            <p className="text-mobile-sm font-medium">{selectedFile.name}</p>
                            <p className="text-mobile-xs text-muted-foreground">
                              {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="text-mobile-sm font-medium">Klicka för att välja fil</p>
                            <p className="text-mobile-xs text-muted-foreground">
                              CSV eller Excel-filer (.csv, .xlsx, .xls)
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Import Mode */}
              <div>
                <Label className="text-mobile-sm font-medium mb-2 block">
                  Importläge
                </Label>
                <Select value={importMode} onValueChange={(value: any) => setImportMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create">Skapa nya poster</SelectItem>
                    <SelectItem value="update">Uppdatera befintliga</SelectItem>
                    <SelectItem value="upsert">Skapa eller uppdatera</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview Button */}
              <Button
                onClick={handlePreview}
                disabled={!selectedFile || !importType}
                variant="outline"
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Förhandsgranska
              </Button>
            </CardContent>
          </Card>

          {/* Preview and Mapping */}
          {previewData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-mobile-base">Förhandsgranskning och mappning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-mobile-lg font-bold">{previewData.totalRows}</div>
                    <div className="text-mobile-xs text-muted-foreground">Totalt rader</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-mobile-lg font-bold text-green-600">{previewData.validRows}</div>
                    <div className="text-mobile-xs text-muted-foreground">Giltiga rader</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-mobile-lg font-bold text-red-600">{previewData.errors.length}</div>
                    <div className="text-mobile-xs text-muted-foreground">Fel</div>
                  </div>
                </div>

                {/* Column Mapping */}
                <div>
                  <Label className="text-mobile-sm font-medium mb-3 block">
                    Kolumnmappning
                  </Label>
                  <div className="space-y-2">
                    {previewData.headers.map((header, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-32 text-mobile-sm font-medium">{header}</div>
                        <div className="flex-1">
                          <Select
                            value={columnMapping[header] || ''}
                            onValueChange={(value) => handleColumnMapping(header, value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Välj kolumn" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Hoppa över</SelectItem>
                              {availableColumns.map(col => (
                                <SelectItem key={col} value={col}>{col}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validation Errors */}
                {previewData.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-2">
                        {previewData.errors.length} valideringsfel hittades:
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {previewData.errors.slice(0, 10).map((error, index) => (
                          <div key={index} className="text-xs">
                            <strong>Rad {error.row}:</strong> {error.error} (kolumn: {error.column})
                          </div>
                        ))}
                        {previewData.errors.length > 10 && (
                          <div className="text-xs">
                            ...och {previewData.errors.length - 10} fler fel
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Import Button */}
                <Button
                  onClick={handleImport}
                  disabled={previewData.errors.length > 0 || isImporting}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isImporting ? 'Importerar...' : `Importera ${previewData.validRows} rader`}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Import Progress */}
          {isImporting && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-mobile-sm font-medium">Importerar data...</span>
                    <span className="text-mobile-xs text-muted-foreground">
                      {importProgress}%
                    </span>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-base">Importmallar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {IMPORT_TYPES.map(type => (
                  <div key={type.value} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="text-mobile-sm font-medium">{type.label}</h4>
                      <p className="text-mobile-xs text-muted-foreground">{type.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadTemplate(type.value)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Ladda ner mall
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-base">Importhistorik</CardTitle>
            </CardHeader>
            <CardContent>
              {importHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Inga importer gjorda ännu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {importHistory.map((import_item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-mobile-sm font-medium">{import_item.fileName}</h4>
                          <Badge
                            variant={import_item.status === 'completed' ? 'default' : 
                                   import_item.status === 'failed' ? 'destructive' : 'secondary'}
                          >
                            {import_item.status}
                          </Badge>
                        </div>
                        <div className="text-mobile-xs text-muted-foreground">
                          {import_item.type} • {import_item.processedRows}/{import_item.totalRows} rader
                          {import_item.errors > 0 && ` • ${import_item.errors} fel`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => getImportStatus(import_item.id)}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};