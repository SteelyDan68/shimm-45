import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { XMLContainerBuilder } from '@/utils/xmlContainerUtils';

interface IntelligenceExportProps {
  userId: string;
  userData: any[];
  userProfile: any;
}

export const IntelligenceExport = ({ userId, userData, userProfile }: IntelligenceExportProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const generateXMLReport = () => {
    const builder = new XMLContainerBuilder('intelligence_report');
    
    const xml = builder
      .startContainer('IntelligenceReport')
      .addElement('user_id', userId)
      .addElement('user_name', `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim())
      .addElement('generated_at', new Date().toISOString())
      .addElement('data_points_count', userData.length)
      .addSection('summary', () => {
        builder
          .addElement('news_mentions', userData.filter(d => d.data_type === 'news').length)
          .addElement('social_metrics', userData.filter(d => d.data_type === 'social_metrics').length)
          .addElement('ai_analyses', userData.filter(d => d.data_type === 'ai_analysis').length);
      })
      .addSection('data_points', () => {
        userData.forEach((item, index) => {
          builder.addSection(`data_point_${index}`, () => {
            builder
              .addElement('id', item.id)
              .addElement('data_type', item.data_type)
              .addElement('source', item.source)
              .addElement('created_at', item.created_at)
              .addElement('data', JSON.stringify(item.data));
          });
        });
      })
      .endContainer('IntelligenceReport');
    
    return xml;
  };

  const generatePDFData = () => {
    return {
      title: `Intelligence Report - ${userProfile.first_name} ${userProfile.last_name}`,
      generated: new Date().toLocaleDateString('sv-SE'),
      summary: {
        totalDataPoints: userData.length,
        newsCount: userData.filter(d => d.data_type === 'news').length,
        socialCount: userData.filter(d => d.data_type === 'social_metrics').length,
        aiCount: userData.filter(d => d.data_type === 'ai_analysis').length,
      },
      data: userData.map(item => ({
        type: item.data_type,
        source: item.source,
        date: new Date(item.created_at).toLocaleDateString('sv-SE'),
        title: item.data?.title || `${item.data_type} data`,
        content: item.data?.snippet || item.data?.platform || 'Data innehåll'
      }))
    };
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportXML = async () => {
    setIsExporting(true);
    try {
      const xml = generateXMLReport();
      const filename = `intelligence_report_${userId}_${new Date().toISOString().split('T')[0]}.xml`;
      downloadFile(xml, filename, 'application/xml');
      
      toast({
        title: "XML-export klar",
        description: "Intelligence-rapporten har exporterats som XML",
      });
    } catch (error) {
      console.error('XML export error:', error);
      toast({
        title: "Exportfel",
        description: "Kunde inte skapa XML-export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const pdfData = generatePDFData();
      
      // Create a simple HTML structure for PDF conversion
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${pdfData.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
            .data-item { border-bottom: 1px solid #eee; padding: 10px 0; }
            .data-type { font-weight: bold; color: #666; }
            .date { color: #999; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${pdfData.title}</h1>
            <p>Genererad: ${pdfData.generated}</p>
          </div>
          
          <div class="summary">
            <h2>Sammanfattning</h2>
            <p>Totala datapunkter: ${pdfData.summary.totalDataPoints}</p>
            <p>Nyhetsartiklar: ${pdfData.summary.newsCount}</p>
            <p>Sociala metrics: ${pdfData.summary.socialCount}</p>
            <p>AI-analyser: ${pdfData.summary.aiCount}</p>
          </div>
          
          <div class="data">
            <h2>Datasamling</h2>
            ${pdfData.data.map(item => `
              <div class="data-item">
                <div class="data-type">${item.type.toUpperCase()}</div>
                <div class="date">${item.date} - ${item.source}</div>
                <h3>${item.title}</h3>
                <p>${item.content}</p>
              </div>
            `).join('')}
          </div>
        </body>
        </html>
      `;
      
      const filename = `intelligence_report_${userId}_${new Date().toISOString().split('T')[0]}.html`;
      downloadFile(htmlContent, filename, 'text/html');
      
      toast({
        title: "HTML-export klar",
        description: "Intelligence-rapporten har exporterats som HTML (kan konverteras till PDF)",
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Exportfel",
        description: "Kunde inte skapa PDF-export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={isExporting || userData.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporterar...' : 'Exportera'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportXML}>
          <FileText className="h-4 w-4 mr-2" />
          Exportera som XML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <File className="h-4 w-4 mr-2" />
          Exportera som HTML/PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};