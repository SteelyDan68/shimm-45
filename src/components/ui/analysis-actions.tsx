import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalysisActionsProps {
  title: string;
  content: string;
  clientName?: string;
  assessmentType?: string;
  className?: string;
}

export const AnalysisActions = ({ 
  title, 
  content, 
  clientName,
  assessmentType,
  className = "" 
}: AnalysisActionsProps) => {
  const { toast } = useToast();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Fel",
        description: "Kunde inte öppna utskriftsfönster. Kontrollera popup-inställningar.",
        variant: "destructive"
      });
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              color: #333;
            }
            h1 {
              color: #2563eb;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .metadata {
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              border: 1px solid #e5e7eb;
            }
            .content {
              white-space: pre-wrap;
              background-color: #fefefe;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            @media print {
              body {
                margin: 0;
                padding: 15px;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${clientName ? `
            <div class="metadata">
              <strong>Klient:</strong> ${clientName}<br>
              ${assessmentType ? `<strong>Typ:</strong> ${assessmentType}<br>` : ''}
              <strong>Utskrivet:</strong> ${new Date().toLocaleDateString('sv-SE')} ${new Date().toLocaleTimeString('sv-SE')}
            </div>
          ` : ''}
          <div class="content">${content.replace(/\n/g, '<br>')}</div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Vänta på att innehållet laddas innan utskrift
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };

    toast({
      title: "Utskrift förberedd",
      description: "Utskriftsdialog öppnas i nytt fönster",
    });
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(title);
    const emailContent = `${title}\n\n${clientName ? `Klient: ${clientName}\n` : ''}${assessmentType ? `Typ: ${assessmentType}\n` : ''}Datum: ${new Date().toLocaleDateString('sv-SE')}\n\n${content}`;
    const body = encodeURIComponent(emailContent);
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    
    window.open(mailtoLink, '_self');
    
    toast({
      title: "E-postklient öppnas",
      description: "E-postprogram öppnas med förberedd text",
    });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleEmail}
        className="flex items-center gap-1"
      >
        <Mail className="h-4 w-4" />
        <span className="hidden sm:inline">Skicka</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="flex items-center gap-1"
      >
        <Printer className="h-4 w-4" />
        <span className="hidden sm:inline">Skriv ut</span>
      </Button>
    </div>
  );
};