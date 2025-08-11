import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AssessmentFormDefinition, AssessmentQuestion } from '@/types/assessmentEngine';

export const FormBuilder = () => {
  const { toast } = useToast();
  const [forms, setForms] = useState<AssessmentFormDefinition[]>([]);
  const [selectedForm, setSelectedForm] = useState<AssessmentFormDefinition | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    if (selectedForm) {
      loadQuestions(selectedForm.id);
    }
  }, [selectedForm]);

  const loadForms = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_form_definitions')
        .select('*')
        .order('name');

      if (error) throw error;
      setForms((data || []) as AssessmentFormDefinition[]);
    } catch (error) {
      console.error('Error loading forms:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda formulär.",
        variant: "destructive",
      });
    }
  };

  const loadQuestions = async (formId: string) => {
    try {
      const { data, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('form_definition_id', formId)
        .order('sort_order');

      if (error) throw error;
      setQuestions((data || []) as AssessmentQuestion[]);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const saveForm = async (formData: Partial<AssessmentFormDefinition>) => {
    setLoading(true);
    try {
      if (selectedForm) {
        // Update existing form
        const { error } = await supabase
          .from('assessment_form_definitions')
          .update(formData)
          .eq('id', selectedForm.id);

        if (error) throw error;
      } else {
        // Create new form
        const user = await supabase.auth.getUser();
        const { error } = await supabase
          .from('assessment_form_definitions')
          .insert({ 
            ...formData as any, 
            created_by: user.data.user?.id || ''
          });

        if (error) throw error;
      }

      await loadForms();
      setEditMode(false);
      toast({
        title: "Sparat",
        description: "Formuläret har sparats.",
      });
    } catch (error) {
      console.error('Error saving form:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara formulär.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!selectedForm) return;

    const newQuestion = {
      form_definition_id: selectedForm.id,
      question_text: 'Ny fråga',
      question_type: 'scale' as const,
      question_key: `question_${questions.length + 1}`,
      min_value: 1,
      max_value: 5,
      is_required: true,
      weight: 1.0,
      sort_order: questions.length
    };

    try {
      const { error } = await supabase
        .from('assessment_questions')
        .insert(newQuestion);

      if (error) throw error;
      await loadQuestions(selectedForm.id);
      
      toast({
        title: "Fråga tillagd",
        description: "En ny fråga har lagts till.",
      });
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till fråga.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Formulärbyggare</h1>
        <Button 
          onClick={() => {
            setSelectedForm(null);
            setEditMode(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nytt formulär
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Forms List */}
        <Card>
          <CardHeader>
            <CardTitle>Självskattningsformulär</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {forms.map((form) => (
              <div
                key={form.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedForm?.id === form.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedForm(form)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{form.name}</h3>
                    <p className="text-sm text-muted-foreground">{form.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={form.is_active ? 'default' : 'secondary'}>
                      {form.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    <Badge variant="outline">{form.assessment_type}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Form Editor */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedForm ? 'Redigera formulär' : 'Skapa nytt formulär'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editMode || !selectedForm ? (
              <FormEditor
                form={selectedForm}
                onSave={saveForm}
                onCancel={() => setEditMode(false)}
                loading={loading}
              />
            ) : selectedForm ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{selectedForm.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedForm.description}</p>
                  <Badge className="mt-2">{selectedForm.assessment_type}</Badge>
                </div>
                
                <div>
                  <Label>AI Prompt Template</Label>
                  <div className="p-3 bg-muted rounded text-sm">
                    {selectedForm.ai_prompt_template}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setEditMode(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Redigera
                  </Button>
                  <Button onClick={addQuestion} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till fråga
                  </Button>
                </div>

                {/* Questions List */}
                <div className="space-y-2">
                  <Label>Frågor ({questions.length})</Label>
                  {questions.map((question, index) => (
                    <div key={question.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{question.question_text}</p>
                          <p className="text-sm text-muted-foreground">
                            Typ: {question.question_type} | Nyckel: {question.question_key}
                          </p>
                        </div>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Välj ett formulär från listan för att redigera det
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface FormEditorProps {
  form?: AssessmentFormDefinition | null;
  onSave: (form: Partial<AssessmentFormDefinition>) => void;
  onCancel: () => void;
  loading: boolean;
}

const FormEditor = ({ form, onSave, onCancel, loading }: FormEditorProps) => {
  const [formData, setFormData] = useState({
    name: form?.name || '',
    description: form?.description || '',
    assessment_type: form?.assessment_type || 'general',
    ai_prompt_template: form?.ai_prompt_template || 'Analysera svaren och ge feedback.',
    is_active: form?.is_active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Formulärnamn</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Beskrivning</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="assessment_type">Självskattningstyp</Label>
        <Select 
          value={formData.assessment_type} 
          onValueChange={(value) => setFormData({ ...formData, assessment_type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="self_care">Self Care</SelectItem>
            <SelectItem value="skills">Skills</SelectItem>
            <SelectItem value="talent">Talent</SelectItem>
            <SelectItem value="brand">Brand</SelectItem>
            <SelectItem value="economy">Economy</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="ai_prompt_template">AI Prompt Template</Label>
        <Textarea
          id="ai_prompt_template"
          value={formData.ai_prompt_template}
          onChange={(e) => setFormData({ ...formData, ai_prompt_template: e.target.value })}
          rows={3}
          placeholder="Använd {answers} för att infoga svar i prompten"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Sparar...' : 'Spara'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
      </div>
    </form>
  );
};