import React, { useState } from 'react';
import { useDataExport } from '@/hooks/useDataExport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar as CalendarIcon,
  Filter,
  Settings,
  Save,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const DATA_TYPES = [
  { value: 'users', label: 'Användare', description: 'Profiler och användardata' },
  { value: 'tasks', label: 'Uppgifter', description: 'Alla uppgifter och status' },
  { value: 'messages', label: 'Meddelanden', description: 'Konversationer och meddelanden' },
  { value: 'assessments', label: 'Bedömningar', description: 'Bedömningsrundor och resultat' },
  { value: 'calendar', label: 'Kalender', description: 'Kalenderhändelser och möten' },
  { value: 'analytics', label: 'Analytics', description: 'Användaranalytik och metrics' },
  { value: 'organizations', label: 'Organisationer', description: 'Organisationsdata' },
  { value: 'coaching', label: 'Coaching', description: 'Coaching-sessioner och planer' }
];

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', icon: FileText, description: 'Kommaseparerade värden' },
  { value: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Microsoft Excel format' },
  { value: 'json', label: 'JSON', icon: FileText, description: 'JavaScript Object Notation' }
];

interface ExportFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  userIds?: string[];
  status?: string;
  categories?: string[];
}

interface DataExportProps {
  className?: string;
}

export const DataExport: React.FC<DataExportProps> = ({ className = "" }) => {
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<string>('csv');
  const [exportName, setExportName] = useState<string>('');
  const [includeMetadata, setIncludeMetadata] = useState<boolean>(true);
  const [filters, setFilters] = useState<ExportFilters>({});
  const [templateName, setTemplateName] = useState<string>('');
  const [templateDescription, setTemplateDescription] = useState<string>('');
  
  const {
    isExporting,
    exportProgress,
    exportData,
    saveTemplate,
    templates,
    exportHistory,
    downloadExport
  } = useDataExport();

  const handleDataTypeToggle = (dataType: string) => {
    setSelectedDataTypes(prev => 
      prev.includes(dataType)
        ? prev.filter(t => t !== dataType)
        : [...prev, dataType]
    );
  };

  const handleExport = async () => {
    if (selectedDataTypes.length === 0) return;

    const exportConfig = {
      dataTypes: selectedDataTypes,
      format: exportFormat,
      name: exportName || `export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}`,
      includeMetadata,
      filters
    };

    await exportData(exportConfig);
  };

  const handleSaveTemplate = async () => {
    if (!templateName || selectedDataTypes.length === 0) return;

    const template = {
      name: templateName,
      description: templateDescription,
      dataTypes: selectedDataTypes,
      format: exportFormat,
      includeMetadata,
      filters
    };

    await saveTemplate(template);
    setTemplateName('');
    setTemplateDescription('');
  };

  const setDateRange = (field: 'start' | 'end', date: Date | undefined) => {
    if (!date) return;
    
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        start: field === 'start' ? date : prev.dateRange?.start || new Date(),
        end: field === 'end' ? date : prev.dateRange?.end || new Date()
      }
    }));
  };

  const selectedFormatConfig = EXPORT_FORMATS.find(f => f.value === exportFormat);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Export Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-mobile-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            Dataexport
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Data Types Selection */}
          <div>
            <Label className="text-mobile-sm font-medium mb-3 block">
              Välj datatyper att exportera
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DATA_TYPES.map(dataType => (
                <div
                  key={dataType.value}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-colors
                    ${selectedDataTypes.includes(dataType.value) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                    }
                  `}
                  onClick={() => handleDataTypeToggle(dataType.value)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedDataTypes.includes(dataType.value)}
                      onChange={() => {}} // Handled by parent onClick
                    />
                    <div className="flex-1">
                      <h4 className="text-mobile-sm font-medium">{dataType.label}</h4>
                      <p className="text-mobile-xs text-muted-foreground">
                        {dataType.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Format */}
          <div>
            <Label className="text-mobile-sm font-medium mb-2 block">
              Exportformat
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {EXPORT_FORMATS.map(format => {
                const IconComponent = format.icon;
                return (
                  <div
                    key={format.value}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-colors text-center
                      ${exportFormat === format.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                      }
                    `}
                    onClick={() => setExportFormat(format.value)}
                  >
                    <IconComponent className="h-6 w-6 mx-auto mb-2" />
                    <h4 className="text-mobile-sm font-medium">{format.label}</h4>
                    <p className="text-mobile-xs text-muted-foreground">
                      {format.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Name */}
          <div>
            <Label htmlFor="export-name" className="text-mobile-sm font-medium">
              Exportnamn (valfritt)
            </Label>
            <Input
              id="export-name"
              placeholder={`export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}`}
              value={exportName}
              onChange={(e) => setExportName(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Filters */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-mobile-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter och inställningar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range */}
              <div>
                <Label className="text-mobile-sm font-medium mb-2 block">
                  Datumintervall
                </Label>
                <div className="flex gap-2 items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {filters.dateRange?.start 
                          ? format(filters.dateRange.start, 'dd MMM', { locale: sv })
                          : 'Från datum'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange?.start}
                        onSelect={(date) => setDateRange('start', date)}
                        locale={sv}
                      />
                    </PopoverContent>
                  </Popover>

                  <span className="text-mobile-xs text-muted-foreground">till</span>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {filters.dateRange?.end 
                          ? format(filters.dateRange.end, 'dd MMM', { locale: sv })
                          : 'Till datum'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange?.end}
                        onSelect={(date) => setDateRange('end', date)}
                        locale={sv}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Include Metadata */}
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={includeMetadata}
                  onCheckedChange={setIncludeMetadata}
                />
                <div>
                  <Label className="text-mobile-sm font-medium">Inkludera metadata</Label>
                  <p className="text-mobile-xs text-muted-foreground">
                    Lägg till extra information som skapningsdatum, uppdateringar etc.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Progress */}
          {isExporting && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-mobile-sm font-medium">Exporterar data...</span>
                    <span className="text-mobile-xs text-muted-foreground">
                      {exportProgress}%
                    </span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleExport}
              disabled={selectedDataTypes.length === 0 || isExporting}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporterar...' : 'Starta export'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSaveTemplate}
              disabled={!templateName || selectedDataTypes.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Spara mall
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-mobile-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Spara som mall
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="template-name">Mallnamn</Label>
            <Input
              id="template-name"
              placeholder="t.ex. Månadsrapport användare"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="template-description">Beskrivning</Label>
            <Textarea
              id="template-description"
              placeholder="Beskriv vad denna mall exporterar..."
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      {exportHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-mobile-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Senaste exporter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exportHistory.slice(0, 5).map((export_item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <h4 className="text-mobile-sm font-medium">{export_item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {export_item.format.toUpperCase()}
                      </Badge>
                      <span className="text-mobile-xs text-muted-foreground">
                        {export_item.dataTypes.length} datatyper
                      </span>
                      <span className="text-mobile-xs text-muted-foreground">
                        {format(new Date(export_item.created_at), 'dd MMM yyyy HH:mm', { locale: sv })}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadExport(export_item.id)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Ladda ner
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};