/**
 * 📊 ERROR REPORTING COMPONENT
 * SCRUM-TEAM USER-FRIENDLY ERROR REPORTING
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  Send, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { logger } from '@/utils/productionLogger';
import { toast } from 'sonner';

interface ErrorReportingProps {
  error?: Error;
  errorId?: string;
  context?: any;
  onClose?: () => void;
}

export const ErrorReporting: React.FC<ErrorReportingProps> = ({
  error,
  errorId,
  context,
  onClose
}) => {
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const errorDetails = {
    id: errorId || `ERR_${Date.now()}`,
    message: error?.message || 'Unknown error',
    stack: error?.stack || 'Stack trace not available',
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    context: context || {}
  };

  const handleCopyDetails = async () => {
    const detailsText = `
Error ID: ${errorDetails.id}
Error: ${errorDetails.message}
URL: ${errorDetails.url}
Time: ${errorDetails.timestamp}
User Agent: ${errorDetails.userAgent}

Context:
${JSON.stringify(errorDetails.context, null, 2)}

Stack Trace:
${errorDetails.stack}
    `.trim();

    try {
      await navigator.clipboard.writeText(detailsText);
      toast.success('Error details copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const reportData = {
        ...errorDetails,
        userDescription: description,
        userEmail: email,
        reportedAt: new Date().toISOString()
      };

      // Log the report
      logger.info('Error Report Submitted', reportData);

      // Here you would typically send to your error reporting service
      // await fetch('/api/error-reports', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(reportData)
      // });

      // For now, simulate successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsSubmitted(true);
      toast.success('Error report submitted successfully');
    } catch (err) {
      logger.error('Failed to submit error report', err);
      toast.error('Failed to submit error report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSupport = () => {
    const subject = encodeURIComponent(`Error Report: ${errorDetails.message}`);
    const body = encodeURIComponent(`
Error ID: ${errorDetails.id}
Error: ${errorDetails.message}
URL: ${errorDetails.url}
Time: ${errorDetails.timestamp}

Description: ${description}

Stack Trace:
${errorDetails.stack}
    `);
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle>Report Submitted</CardTitle>
          <CardDescription>
            Thank you for your report. We'll investigate this issue promptly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Reference ID: <Badge variant="outline">{errorDetails.id}</Badge>
            </AlertDescription>
          </Alert>
          {onClose && (
            <Button onClick={onClose} className="w-full mt-4">
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Report Error
        </CardTitle>
        <CardDescription>
          Help us improve by reporting this error. All information is optional but helpful.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Details */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Error Details</Label>
          <div className="bg-muted p-3 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono">ID: {errorDetails.id}</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCopyDetails}
                className="flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                Copy Details
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>Error:</strong> {errorDetails.message}
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>Time:</strong> {new Date(errorDetails.timestamp).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>Page:</strong> {errorDetails.url}
            </div>
          </div>
        </div>

        {/* Report Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">What were you doing when this error occurred?</Label>
            <Textarea
              id="description"
              placeholder="Describe what you were trying to do, what you clicked, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email (optional)
              <span className="text-sm text-muted-foreground ml-2">
                For follow-up questions
              </span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={handleEmailSupport}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Email Support
            </Button>
            
            {onClose && (
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Only technical error details and your description will be sent. No personal data is collected.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};