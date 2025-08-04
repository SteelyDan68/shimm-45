import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Paperclip, Upload, X, File, Image } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadProps {
  onFileUploaded: (fileUrl: string, fileName: string, fileType: string) => void;
  disabled?: boolean;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  disabled = false,
  maxSizeMB = 10,
  acceptedTypes = ['image/*', 'application/pdf', 'text/*', '.doc', '.docx']
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Filen är för stor. Max storlek: ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `chat-files/${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file);
      
      // Simulate progress for UX
      setUploadProgress(100);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      onFileUploaded(publicUrl, file.name, file.type);
      toast.success('Fil uppladdad!');

    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Kunde inte ladda upp filen');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
        disabled={disabled || uploading}
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="h-10 w-10 shrink-0"
      >
        <Paperclip className="h-5 w-5" />
      </Button>

      {uploading && (
        <Card className="absolute bottom-12 left-0 w-64 z-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="h-4 w-4" />
              <span className="text-sm">Laddar upp...</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-auto"
                onClick={() => setUploading(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(uploadProgress)}% färdig
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};