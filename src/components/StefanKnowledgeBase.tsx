import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Plus, FileText, Target } from 'lucide-react';
import { useStefanKnowledgeBase } from '@/hooks/useStefanKnowledgeBase';

const StefanKnowledgeBase: React.FC = () => {
  const { analyzedData, loading, fetchAnalyzedData, addManualAnalysis, getKnowledgeBaseSummary } = useStefanKnowledgeBase();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    filename: '',
    tone: '',
    style: '',
    themes: '',
    used_phrases: '',
    recommended_use: '',
    content: ''
  });

  useEffect(() => {
    fetchAnalyzedData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const analysisData = {
      filename: formData.filename,
      tone: formData.tone,
      style: formData.style,
      themes: formData.themes.split(',').map(t => t.trim()).filter(Boolean),
      used_phrases: formData.used_phrases.split(',').map(p => p.trim()).filter(Boolean),
      recommended_use: formData.recommended_use,
      content: formData.content
    };

    const success = await addManualAnalysis(analysisData);
    if (success) {
      setFormData({
        filename: '',
        tone: '',
        style: '',
        themes: '',
        used_phrases: '',
        recommended_use: '',
        content: ''
      });
      setShowAddForm(false);
      // Refresh analyzed data list immediately
      await fetchAnalyzedData();
    }
  };

  const summary = getKnowledgeBaseSummary();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Stefan Kunskapsbas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Sammandrag */}
            {summary && (
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">Kunskapsbasöversikt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Analyserade texter: {summary.totalAnalyzedTexts}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Vanliga teman:</p>
                    <div className="flex flex-wrap gap-1">
                      {summary.commonThemes.map((theme, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Signaturfraser:</p>
                    <div className="flex flex-wrap gap-1">
                      {summary.signaturePhrases.slice(0, 5).map((phrase, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          "{phrase}"
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Tonmönster:</p>
                    <div className="flex flex-wrap gap-1">
                      {summary.tonePatterns.map((tone, index) => (
                        <Badge key={index} variant="default" className="text-xs">
                          {tone}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lägg till ny analys */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Manuell stilanalys</h3>
                <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till analys
                </Button>
              </div>

              {showAddForm && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lägg till Stefan-analys</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="filename">Filnamn/Referens</Label>
                          <Input
                            id="filename"
                            value={formData.filename}
                            onChange={(e) => setFormData({...formData, filename: e.target.value})}
                            placeholder="veckobrev_jan_2025.pdf"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="tone">Tonläge</Label>
                          <Input
                            id="tone"
                            value={formData.tone}
                            onChange={(e) => setFormData({...formData, tone: e.target.value})}
                            placeholder="rak, varm, lätt ironisk, hoppfull"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="style">Stil och struktur</Label>
                        <Input
                          id="style"
                          value={formData.style}
                          onChange={(e) => setFormData({...formData, style: e.target.value})}
                          placeholder="kortfattade stycken, mycket du-form, alltid med en avslutande nudge"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="themes">Teman (kommaseparerade)</Label>
                        <Input
                          id="themes"
                          value={formData.themes}
                          onChange={(e) => setFormData({...formData, themes: e.target.value})}
                          placeholder="självutveckling, hållbar framgång, realism + hopp"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="used_phrases">Använda fraser (kommaseparerade)</Label>
                        <Textarea
                          id="used_phrases"
                          value={formData.used_phrases}
                          onChange={(e) => setFormData({...formData, used_phrases: e.target.value})}
                          placeholder="du bygger ett arbete du inte vill ta semester från, du är din egen tillgång"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="recommended_use">Rekommenderad användning</Label>
                        <Input
                          id="recommended_use"
                          value={formData.recommended_use}
                          onChange={(e) => setFormData({...formData, recommended_use: e.target.value})}
                          placeholder="använd denna fil som referens för floating chat i creator-vyn"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="content">Innehåll (valfritt)</Label>
                        <Textarea
                          id="content"
                          value={formData.content}
                          onChange={(e) => setFormData({...formData, content: e.target.value})}
                          placeholder="Originaltext eller sammanfattning..."
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit">Spara analys</Button>
                        <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                          Avbryt
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Lista över befintliga analyser */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Befintliga analyser</h3>
              <ScrollArea className="h-64">
                {loading ? (
                  <p className="text-center py-4">Läser in data...</p>
                ) : analyzedData.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Inga analyser tillgängliga än.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analyzedData.map((analysis) => (
                      <Card key={analysis.id} className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">{analysis.filename || 'Okänd fil'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              <span className="text-xs text-muted-foreground">
                                {analysis.recommended_use}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {analysis.tone}
                            </Badge>
                            {analysis.themes.slice(0, 3).map((theme, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {theme}
                              </Badge>
                            ))}
                          </div>

                          <p className="text-sm text-muted-foreground">
                            Stil: {analysis.style}
                          </p>

                          {analysis.used_phrases.length > 0 && (
                            <div className="text-xs">
                              <span className="font-medium">Signaturfraser: </span>
                              {analysis.used_phrases.slice(0, 2).map((phrase, index) => (
                                <span key={index} className="italic">
                                  "{phrase}"{index < Math.min(analysis.used_phrases.length - 1, 1) ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StefanKnowledgeBase;