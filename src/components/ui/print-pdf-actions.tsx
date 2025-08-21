/**
 * 🖨️ UNIVERSELLA PRINT & PDF ACTIONS
 * 
 * Aktiverade live-funktioner för print och PDF-export
 * som begärts för analyser, självskattningar och program
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PrintPDFActionsProps {
  title?: string;
  content?: string;
  filename?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export const PrintPDFActions: React.FC<PrintPDFActionsProps> = ({
  title = "Dokument",
  content,
  filename,
  className = "",
  variant = "outline",
  size = "sm"
}) => {
  const { toast } = useToast();

  const handlePrint = () => {
    try {
      // Om inget innehåll tillhandahålls, skriv ut hela sidan
      if (!content) {
        window.print();
        return;
      }

      // Skapa nytt fönster för utskrift med formatterat innehåll
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Kunde inte öppna utskriftsfönster');
      }

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            @media print {
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                line-height: 1.6;
                color: #000;
                background: #fff;
                margin: 0;
                padding: 20px;
              }
              .no-print { display: none !important; }
              .print-only { display: block !important; }
              h1, h2, h3 { color: #2d3748; margin-top: 1.5em; }
              .card { border: 1px solid #e2e8f0; padding: 1rem; margin: 1rem 0; }
              .badge { 
                display: inline-block; 
                padding: 0.25rem 0.5rem; 
                background: #f7fafc; 
                border: 1px solid #e2e8f0; 
                border-radius: 0.25rem; 
                font-size: 0.875rem;
              }
            }
            @page { margin: 2cm; }
          </style>
        </head>
        <body>
          <header class="print-only">
            <h1>${title}</h1>
            <p>Genererat: ${new Date().toLocaleDateString('sv-SE')} ${new Date().toLocaleTimeString('sv-SE')}</p>
            <hr>
          </header>
          <main>
            ${content}
          </main>
          <footer class="print-only" style="margin-top: 2em; padding-top: 1em; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 0.875rem; color: #718096;">
              Dokument från NCCS utvecklingsplattform
            </p>
          </footer>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };

      toast({
        title: "🖨️ Utskrift startad",
        description: "Dokumentet skickas till skrivaren eller PDF-skaparen.",
      });
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "❌ Utskriftsfel",
        description: "Kunde inte starta utskriften. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Använd browserns inbyggda "Spara som PDF" funktion
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Kunde inte öppna fönster för PDF-export');
      }

      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.6;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 20px;
              max-width: 800px;
            }
            h1, h2, h3 { color: #2d3748; margin-top: 1.5em; }
            .card { 
              border: 1px solid #e2e8f0; 
              padding: 1rem; 
              margin: 1rem 0; 
              border-radius: 0.5rem;
              background: #f8fafc;
            }
            .badge { 
              display: inline-block; 
              padding: 0.25rem 0.5rem; 
              background: #f7fafc; 
              border: 1px solid #e2e8f0; 
              border-radius: 0.25rem; 
              font-size: 0.875rem;
              margin: 0.25rem;
            }
            .header { 
              text-align: center; 
              margin-bottom: 2rem; 
              padding-bottom: 1rem; 
              border-bottom: 2px solid #e2e8f0; 
            }
            .footer { 
              margin-top: 2rem; 
              padding-top: 1rem; 
              border-top: 1px solid #e2e8f0; 
              text-align: center; 
              font-size: 0.875rem; 
              color: #718096; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>Genererat: ${new Date().toLocaleDateString('sv-SE')} ${new Date().toLocaleTimeString('sv-SE')}</p>
          </div>
          <main>
            ${content || '<p>Innehåll från aktuell sida kommer att exporteras som PDF.</p>'}
          </main>
          <div class="footer">
            <p>Dokument från NCCS utvecklingsplattform</p>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(pdfContent);
      printWindow.document.close();

      toast({
        title: "📄 PDF-export startad",
        description: 'Välj "Spara som PDF" i utskriftsdialogen för att ladda ner dokumentet.',
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "❌ PDF-exportfel",
        description: "Kunde inte starta PDF-exporten. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share && content) {
        await navigator.share({
          title: title,
          text: content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
          url: window.location.href,
        });
        
        toast({
          title: "📤 Delning startad",
          description: "Innehållet delas via din enhets delningsfunktion.",
        });
      } else {
        // Fallback: kopiera URL till clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "🔗 Länk kopierad",
          description: "Sidans URL har kopierats till urklipp.",
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: "❌ Delningsfel",
        description: "Kunde inte dela innehållet. Försök igen.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant={variant}
        size={size}
        onClick={handlePrint}
        className="flex items-center gap-2"
      >
        <Printer className="h-4 w-4" />
        <span className="hidden sm:inline">Skriv ut</span>
      </Button>
      
      <Button
        variant={variant}
        size={size}
        onClick={handleDownloadPDF}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Ladda ner PDF</span>
      </Button>
      
      <Button
        variant={variant}
        size={size}
        onClick={handleShare}
        className="flex items-center gap-2"
      >
        <Share className="h-4 w-4" />
        <span className="hidden sm:inline">Dela</span>
      </Button>
    </div>
  );
};

export default PrintPDFActions;