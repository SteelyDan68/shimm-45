import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, File, Trash2, Plus, Brain } from 'lucide-react';
import { useStefanTrainingData, TrainingDataFormData } from '@/hooks/useStefanTrainingData';
import { useForm } from 'react-hook-form';
import StefanTextAnalyzer from './StefanTextAnalyzer';

const StefanTrainingData: React.FC = () => {
  const { data, loading, uploading, fetchTrainingData, addTrainingData, deleteTrainingData } = useStefanTrainingData();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { register, handleSubmit, reset, setValue, watch } = useForm<TrainingDataFormData>({
    defaultValues: {
      content_type: 'manual',
      date_created: new Date().toISOString().split('T')[0],
    }
  });

  const contentType = watch('content_type');

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Determine content type based on file extension
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (fileExt === 'pdf') {
        setValue('content_type', 'pdf');
      } else if (['txt', 'md', 'doc', 'docx'].includes(fileExt || '')) {
        setValue('content_type', 'text_file');
      }
    }
  };

  const onSubmit = async (formData: TrainingDataFormData) => {
    const dataToSubmit = {
      ...formData,
      file: selectedFile || undefined,
    };
    
    const success = await addTrainingData(dataToSubmit);
    if (success) {
      reset();
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${Math.round(bytes / 1024)}KB` : `${mb.toFixed(1)}MB`;
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <File className="h-4 w-4" />;
      case 'text_file':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'manual':
        return 'Manuell text';
      case 'text_file':
        return 'Textfil';
      case 'pdf':
        return 'PDF';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Ladda upp Stefandata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="add" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="add">Lägg till data</TabsTrigger>
              <TabsTrigger value="manage">Hantera data</TabsTrigger>
              <TabsTrigger value="analyze">Analysera</TabsTrigger>
            </TabsList>
            
            <TabsContent value="add" className="space-y-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="content_type">Typ av innehåll</Label>
                    <Select onValueChange={(value: any) => setValue('content_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj typ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manuell text</SelectItem>
                        <SelectItem value="text_file">Textfil</SelectItem>
                        <SelectItem value="pdf">PDF-dokument</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Ämne</Label>
                    <Input 
                      {...register('subject')}
                      placeholder="T.ex. Kreativ rådgivning, Varumärkesstrategi"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_created">Datum</Label>
                    <Input 
                      type="date"
                      {...register('date_created')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone">Tonläge</Label>
                    <Select onValueChange={(value) => setValue('tone', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj tonläge" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stöttande">Stöttande</SelectItem>
                        <SelectItem value="utmanande">Utmanande</SelectItem>
                        <SelectItem value="ironisk">Ironisk</SelectItem>
                        <SelectItem value="direkt">Direkt</SelectItem>
                        <SelectItem value="varm">Varm</SelectItem>
                        <SelectItem value="professionell">Professionell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_name">Klientnamn (valfritt)</Label>
                    <Input 
                      {...register('client_name')}
                      placeholder="T.ex. Anna Andersson"
                    />
                  </div>
                </div>

                {contentType !== 'manual' && (
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Ladda upp fil</Label>
                    <Input 
                      id="file-upload"
                      type="file"
                      accept={contentType === 'pdf' ? '.pdf' : '.txt,.md,.doc,.docx'}
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                    />
                    {selectedFile && (
                      <div className="text-sm text-muted-foreground">
                        Vald fil: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </div>
                    )}
                  </div>
                )}

                {contentType === 'manual' && (
                  <div className="space-y-2">
                    <Label htmlFor="content">Innehåll</Label>
                    <Textarea 
                      {...register('content', { required: contentType === 'manual' })}
                      placeholder="Skriv eller klistra in textinnehåll här..."
                      rows={8}
                    />
                  </div>
                )}

                <Button type="submit" disabled={uploading} className="w-full">
                  {uploading ? 'Sparar...' : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Spara träningsdata
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="manage">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Sparad träningsdata</h3>
                  <Button variant="outline" onClick={fetchTrainingData} disabled={loading}>
                    Uppdatera
                  </Button>
                </div>

                <ScrollArea className="h-96">
                  {loading ? (
                    <div className="text-center py-4">Läser in data...</div>
                  ) : data.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Ingen träningsdata finns ännu. Lägg till data via fliken ovan.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.map((entry) => (
                        <Card key={entry.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                {getContentTypeIcon(entry.content_type)}
                                <Badge variant="secondary">
                                  {getContentTypeLabel(entry.content_type)}
                                </Badge>
                                {entry.subject && (
                                  <Badge variant="outline">{entry.subject}</Badge>
                                )}
                                {entry.tone && (
                                  <Badge variant="outline">{entry.tone}</Badge>
                                )}
                              </div>
                              
                              {entry.original_filename && (
                                <div className="text-sm text-muted-foreground">
                                  📎 {entry.original_filename} 
                                  {entry.file_size_bytes && ` (${formatFileSize(entry.file_size_bytes)})`}
                                </div>
                              )}
                              
                              <div className="text-sm">
                                {entry.content.length > 200 
                                  ? `${entry.content.substring(0, 200)}...`
                                  : entry.content
                                }
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                {entry.date_created && `Datum: ${entry.date_created} • `}
                                {entry.client_name && `Klient: ${entry.client_name} • `}
                                Skapad: {new Date(entry.created_at).toLocaleDateString('sv-SE')}
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTrainingData(entry.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="analyze">
              <StefanTextAnalyzer data={data} onAnalysisComplete={fetchTrainingData} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StefanTrainingData;