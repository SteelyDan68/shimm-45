import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MobileContainer } from '@/components/ui/mobile-responsive';
import { DataExport } from '@/components/datatools/DataExport';
import { DataImport } from '@/components/datatools/DataImport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Shield, 
  Clock, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const FEATURES = [
  {
    icon: Download,
    title: 'Dataexport',
    description: 'Exportera data i CSV, Excel eller JSON format',
    capabilities: ['Anpassningsbara filter', 'Exportmallar', 'Schemalagd export', 'Bulk export']
  },
  {
    icon: Upload,
    title: 'Dataimport',
    description: 'Importera data från CSV och Excel-filer',
    capabilities: ['Validering', 'Kolumnmappning', 'Felhantering', 'Preview före import']
  },
  {
    icon: Shield,
    title: 'Säkerhet',
    description: 'Säker hantering av data med full spårbarhet',
    capabilities: ['Rollbaserad åtkomst', 'Auditlogg', 'Kryptering', 'GDPR-kompatibel']
  },
  {
    icon: Clock,
    title: 'Historik',
    description: 'Full historik över alla import/export-operationer',
    capabilities: ['Status tracking', 'Felrapporter', 'Re-download', 'Performance metrics']
  }
];

export const DataToolsPage: React.FC = () => {
  return (
    <MobileContainer className="py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-mobile-3xl font-bold mb-2">Data Export/Import</h1>
          <p className="text-mobile-base text-muted-foreground">
            Hantera dataflöden med kraftfulla verktyg för export och import
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {FEATURES.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-mobile-sm">{feature.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-mobile-xs text-muted-foreground mb-3">
                    {feature.description}
                  </p>
                  <div className="space-y-1">
                    {feature.capabilities.map((capability, capIndex) => (
                      <div key={capIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="text-mobile-xs">{capability}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Interface */}
        <Tabs defaultValue="export" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export">
            <DataExport />
          </TabsContent>

          <TabsContent value="import">
            <DataImport />
          </TabsContent>
        </Tabs>

        {/* Best Practices */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-mobile-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Bästa praxis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-mobile-sm font-semibold mb-2">Export</h4>
                <ul className="space-y-1 text-mobile-xs text-muted-foreground">
                  <li>• Använd filter för att begränsa datastorlek</li>
                  <li>• Spara ofta använda konfigurationer som mallar</li>
                  <li>• Kontrollera dataformat innan export</li>
                  <li>• Använd schemalagd export för regelbundna rapporter</li>
                </ul>
              </div>
              <div>
                <h4 className="text-mobile-sm font-semibold mb-2">Import</h4>
                <ul className="space-y-1 text-mobile-xs text-muted-foreground">
                  <li>• Använd alltid förhandsgranskning före import</li>
                  <li>• Kontrollera kolumnmappning noga</li>
                  <li>• Gör backup före stora importer</li>
                  <li>• Validera data i mindre batchar först</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supported Formats */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-mobile-base flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Stödda format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">CSV</Badge>
              <Badge variant="outline">Excel (.xlsx, .xls)</Badge>
              <Badge variant="outline">JSON</Badge>
              <Badge variant="outline">TSV</Badge>
              <Badge variant="secondary">Fler format kommer snart</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileContainer>
  );
};