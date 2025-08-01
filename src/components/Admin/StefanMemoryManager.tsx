import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, Plus, X, Brain, Database, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StefanMemory {
  id: string;
  content: string;
  tags: string[];
  category: string;
  version: string;
  source: string;
  created_at: string;
}

const StefanMemoryManager: React.FC = () => {
  const { toast } = useToast();
  const [memories, setMemories] = useState<StefanMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    tags: [] as string[],
    category: '',
    version: '1.0',
    source: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    errors?: string[];
  } | null>(null);

  const categories = [
    'Self Care',
    'Strategy', 
    'AI',
    'Coaching',
    'Mindfulness',
    'Productivity',
    'Communication',
    'Leadership',
    'General',
  ];

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      // Use the edge function to fetch memories since stefan_memory isn't in types yet
      const { data: memoriesData, error } = await supabase.functions.invoke('get-stefan-memories');
      
      if (error) throw error;
      
      // If no edge function exists yet, use mock data
      const mockMemories: StefanMemory[] = [];
      setMemories(mockMemories);
    } catch (error: any) {
      console.error('Error fetching memories:', error);
      // For now, just set empty array since table might not be in types yet
      setMemories([]);
      toast({
        title: "Information",
        description: "Minnesfragment kommer att visas när edge-funktionen är aktiv",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim() || !formData.category || !formData.source.trim()) {
      toast({
        title: "Ofullständiga uppgifter",
        description: "Innehåll, kategori och källa krävs",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('store-stefan-memory', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Minnesbank uppdaterad",
        description: "Nytt minnesfragment har lagts till",
      });

      // Reset form
      setFormData({
        content: '',
        tags: [],
        category: '',
        version: '1.0',
        source: '',
      });

      // Refresh memories list
      fetchMemories();
    } catch (error: any) {
      console.error('Error storing memory:', error);
      toast({
        title: "Fel vid lagring",
        description: error.message || "Kunde inte lagra minnesfragment",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      // Use edge function for deletion since table not in types yet
      const { error } = await supabase.functions.invoke('delete-stefan-memory', {
        body: { id }
      });

      if (error) throw error;

      setMemories(prev => prev.filter(memory => memory.id !== id));
      toast({
        title: "Borttaget",
        description: "Minnesfragment har tagits bort",
      });
    } catch (error: any) {
      console.error('Error deleting memory:', error);
      toast({
        title: "Fel vid borttagning",
        description: "Kommer att implementeras när edge-funktioner är aktiva",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.jsonl')) {
      toast({
        title: "Felaktigt filformat",
        description: "Endast JSONL-filer är tillåtna",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Filen är för stor",
        description: "Maximal filstorlek är 10MB",
        variant: "destructive",
      });
      return;
    }

    setBulkImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const content = await file.text();
      
      const { data, error } = await supabase.functions.invoke('bulk-import-stefan-memory', {
        body: { jsonlContent: content }
      });

      if (error) throw error;

      setImportResult(data);
      setImportProgress(100);

      toast({
        title: "Bulk-import slutförd",
        description: `${data.successCount} minnesfragment importerades, ${data.errorCount} misslyckades`,
        variant: data.errorCount > 0 ? "destructive" : "default",
      });

      // Refresh memories list
      fetchMemories();
    } catch (error: any) {
      console.error('Error during bulk import:', error);
      toast({
        title: "Fel vid bulk-import",
        description: error.message || "Kunde inte importera minnesfragment",
        variant: "destructive",
      });
    } finally {
      setBulkImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Stefan AI Minnesbank</h2>
      </div>

      {/* Add Memory Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Lägg till nytt minnesfragment
          </CardTitle>
          <CardDescription>
            Skapa embeddings och lagra minnesfragment för Stefan AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Källa</Label>
                <Input
                  id="source"
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  placeholder="t.ex. Coaching Manual, Training Data"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Innehåll</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Skriv minnesfragmentet här..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Taggar</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Lägg till tagg..."
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="1.0"
                />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Lagrar...' : 'Lägg till minnesfragment'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Bulk Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk-import från JSONL-fil
          </CardTitle>
          <CardDescription>
            Ladda upp en JSONL-fil med minnesfragment. Varje rad ska vara ett JSON-objekt med fälten: content, tags, category, version, source.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".jsonl"
                onChange={handleFileUpload}
                disabled={bulkImporting}
                className="flex-1"
              />
              <Button disabled={bulkImporting} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                {bulkImporting ? 'Importerar...' : 'Välj JSONL-fil'}
              </Button>
            </div>

            {bulkImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importerar minnesfragment...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="w-full" />
              </div>
            )}

            {importResult && (
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <h4 className="font-medium">Import-resultat:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Totalt bearbetade: {importResult.totalProcessed}</div>
                  <div className="text-green-600">Framgångsrika: {importResult.successCount}</div>
                  <div className="text-red-600">Misslyckade: {importResult.errorCount}</div>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <h5 className="font-medium text-sm mb-1">Fel (första 10):</h5>
                    <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-red-600">{error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <strong>JSONL-format exempel:</strong><br />
              {"{"}"content": "Coaching tip...", "tags": ["coaching"], "category": "Strategy", "version": "1.0", "source": "Manual Import"{"}"}<br />
              {"{"}"content": "Another tip...", "tags": ["mindfulness"], "category": "Self Care", "version": "1.0", "source": "Training Data"{"}"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memories List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Befintliga minnesfragment ({memories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {memories.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Inga minnesfragment har lagts till än
              </p>
            ) : (
              memories.map(memory => (
                <div key={memory.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{memory.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(memory.created_at).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteMemory(memory.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm mb-2 line-clamp-3">{memory.content}</p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Källa: {memory.source}</span>
                    <span>v{memory.version}</span>
                  </div>
                  
                  {memory.tags && memory.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {memory.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StefanMemoryManager;