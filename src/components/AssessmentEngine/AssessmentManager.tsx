import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, CheckCircle, Circle, Send } from 'lucide-react';
import { useRealAssessments } from '@/hooks/useRealAssessments';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface AssessmentManagerProps {
  clientId: string;
  clientName: string;
}

export const AssessmentManager = ({ clientId, clientName }: AssessmentManagerProps) => {
  const { 
    assessmentData,
    isLoading: loading
  } = useRealAssessments();
  
  const formDefinitions = assessmentData?.formDefinitions || [];
  const assignments = assessmentData?.assignedForms || [];
  
  const getAssignedForms = () => assignments.map(a => a.form_definition_id);
  
  const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>();
  const [showDueDateFor, setShowDueDateFor] = useState<string | null>(null);

  const assignedFormIds = getAssignedForms();

  const handleAssignForm = async (formDefinitionId: string) => {
    // TODO: Implement form assignment with real API
    console.log('Assigning form:', formDefinitionId, 'with due date:', selectedDueDate);
    setSelectedDueDate(undefined);
    setShowDueDateFor(null);
  };

  const handleToggleAssignment = async (formDefinitionId: string, isAssigned: boolean) => {
    if (isAssigned) {
      // TODO: Implement form removal with real API  
      console.log('Removing assignment for form:', formDefinitionId);
    } else {
      setShowDueDateFor(formDefinitionId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Management - {clientName}</CardTitle>
        <p className="text-muted-foreground">
          Hantera vilka formulär som ska vara aktiva för denna klient
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {formDefinitions.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Inga formulär tillgängliga. Konfigurera formulär i adminpanelen först.
          </p>
        ) : (
          formDefinitions.map((form) => {
            const isAssigned = assignedFormIds.includes(form.id);
            const assignment = assignments.find(a => a.form_definition_id === form.id);
            
            return (
              <div
                key={form.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleAssignment(form.id, isAssigned)}
                    disabled={loading}
                  >
                    {isAssigned ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                  <div>
                    <h4 className="font-medium">{form.name}</h4>
                    <p className="text-sm text-muted-foreground">{form.description}</p>
                    {assignment?.due_date && (
                      <p className="text-xs text-orange-600">
                        Förfaller: {format(new Date(assignment.due_date), 'PPP', { locale: sv })}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isAssigned && (
                    <Badge variant="secondary">Tilldelad</Badge>
                  )}
                  <Badge variant="outline">{form.assessment_type}</Badge>
                </div>
              </div>
            );
          })
        )}

        {/* Due Date Picker Modal */}
        {showDueDateFor && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-lg">Sätt deadline (valfritt)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-due-date"
                  checked={!!selectedDueDate}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      setSelectedDueDate(undefined);
                    } else {
                      setSelectedDueDate(new Date());
                    }
                  }}
                />
                <Label htmlFor="use-due-date">Sätt deadline för assessmenten</Label>
              </div>

              {selectedDueDate && (
                <div className="space-y-2">
                  <Label>Förfallodatum</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(selectedDueDate, 'PPP', { locale: sv })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDueDate}
                        onSelect={setSelectedDueDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleAssignForm(showDueDateFor)}
                  disabled={loading}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Skicka assessment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDueDateFor(null);
                    setSelectedDueDate(undefined);
                  }}
                  className="flex-1"
                >
                  Avbryt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};