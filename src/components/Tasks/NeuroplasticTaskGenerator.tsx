import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Brain, 
  Target, 
  Zap, 
  Clock, 
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Plus,
  Flame
} from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';

interface NeuroplasticTask {
  id: string;
  title: string;
  description: string;
  neuroplastic_principle: 'repetition' | 'progressive_complexity' | 'habit_stacking' | 'spaced_repetition' | 'chunking';
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  estimated_minutes: number;
  frequency: 'daily' | 'weekly' | 'bi_weekly';
  duration_days: number;
  habit_cue?: string;
  habit_reward?: string;
  micro_steps: string[];
  category: 'self_care' | 'skills' | 'talent' | 'brand' | 'economy' | 'open_track';
  neuroplastic_milestone: 7 | 21 | 66; // Days for neuroplastic change
}

interface NeuroplasticTaskGeneratorProps {
  userId: string;
  assessmentInsights?: any[];
  onTasksCreated?: (tasks: NeuroplasticTask[]) => void;
  className?: string;
}

/**
 * SCRUM Expert-Team Neuroplastisk Task Generator:
 * - Behavioral Scientist: Vetenskapligt baserade neuroplastiska principer
 * - Product Manager: Genomförbara micro-tasks för maximal completion rate
 * - Educator: Scaffolded progression från enkelt till komplext
 * - UI/UX Expert: Motiverande progress visualization
 * - Data Scientist: Evidence-based habit formation tracking
 */
export const NeuroplasticTaskGenerator = ({ 
  userId, 
  assessmentInsights = [], 
  onTasksCreated,
  className 
}: NeuroplasticTaskGeneratorProps) => {
  const { createTask, loading } = useTasks();
  const { toast } = useToast();
  
  const [generatedTasks, setGeneratedTasks] = useState<NeuroplasticTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'selection' | 'customization' | 'confirmation'>('selection');

  // Neuroplastiska principer för task-skapande
  const neuroplasticPrinciples = {
    repetition: {
      name: 'Repetition & Förstärkning',
      description: 'Daglig repetition stärker neuronala banor',
      icon: <RefreshCw className="h-4 w-4" />,
      color: 'bg-blue-50 text-blue-700'
    },
    progressive_complexity: {
      name: 'Progressiv Komplexitet',
      description: 'Gradvis ökning av svårighetsgrad',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'bg-green-50 text-green-700'
    },
    habit_stacking: {
      name: 'Habit Stacking',
      description: 'Koppla nya vanor till etablerade rutiner',
      icon: <Plus className="h-4 w-4" />,
      color: 'bg-purple-50 text-purple-700'
    },
    spaced_repetition: {
      name: 'Spaced Repetition',
      description: 'Optimal timing för långtidsminne',
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-yellow-50 text-yellow-700'
    },
    chunking: {
      name: 'Chunking',
      description: 'Dela upp komplexa uppgifter i små delar',
      icon: <Target className="h-4 w-4" />,
      color: 'bg-red-50 text-red-700'
    }
  };

  // Generera neuroplastiska uppgifter baserat på insights
  const generateNeuroplasticTasks = async () => {
    setIsGenerating(true);
    
    try {
      // Skapa exempel-tasks baserat på neuroplastiska principer
      const sampleTasks: NeuroplasticTask[] = [
        {
          id: 'nt-1',
          title: 'Morgon-mindfulness (2 minuter)',
          description: 'En mikromeditation för att starta dagen med klarhet och fokus',
          neuroplastic_principle: 'repetition',
          difficulty_level: 1,
          estimated_minutes: 2,
          frequency: 'daily',
          duration_days: 21,
          habit_cue: 'Efter att jag vaknar och sätter mig upp i sängen',
          habit_reward: 'Jag känner mig lugn och fokuserad för dagen',
          micro_steps: [
            'Sätt dig bekvämt',
            'Ta 3 djupa andetag',
            'Sätt en positiv intention för dagen',
            'Notera 1 sak du är tacksam för'
          ],
          category: 'self_care',
          neuroplastic_milestone: 21
        },
        {
          id: 'nt-2',
          title: 'Lär dig 5 nya ord om dagen',
          description: 'Bygg din vokabulär systematiskt för bättre kommunikation',
          neuroplastic_principle: 'spaced_repetition',
          difficulty_level: 2,
          estimated_minutes: 10,
          frequency: 'daily',
          duration_days: 66,
          habit_cue: 'Efter lunch',
          habit_reward: 'Jag blir en bättre kommunikatör',
          micro_steps: [
            'Välj 5 nya ord från din bransch',
            'Skriv ner definitionerna',
            'Använd ordet i en mening',
            'Repetera gårdagens ord',
            'Använd minst 1 ord i en konversation'
          ],
          category: 'skills',
          neuroplastic_milestone: 66
        },
        {
          id: 'nt-3',
          title: 'Daglig kreativ paus (5 min)',
          description: 'Aktivera din kreativitet med kort daglig brainstorming',
          neuroplastic_principle: 'habit_stacking',
          difficulty_level: 1,
          estimated_minutes: 5,
          frequency: 'daily',
          duration_days: 21,
          habit_cue: 'Efter min kaffe-paus',
          habit_reward: 'Jag känner mig kreativ och inspirerad',
          micro_steps: [
            'Sätt timer på 5 minuter',
            'Välj ett vardagsproblem',
            'Skriva ner 10 galna lösningar',
            'Välj den mest intressanta',
            'Fundera på hur den skulle kunna fungera'
          ],
          category: 'talent',
          neuroplastic_milestone: 21
        },
        {
          id: 'nt-4',
          title: 'Bygg ditt professionella nätverk',
          description: 'En daglig mikrointeraktion för att stärka ditt varumärke',
          neuroplastic_principle: 'progressive_complexity',
          difficulty_level: 3,
          estimated_minutes: 15,
          frequency: 'daily',
          duration_days: 66,
          habit_cue: 'Innan jag slutar jobba',
          habit_reward: 'Jag bygger värdefulla relationer',
          micro_steps: [
            'Identifiera 1 person att kontakta',
            'Skriv ett personligt meddelande',
            'Dela värdefull information eller insight',
            'Fråga en öppen fråga',
            'Skicka meddelandet'
          ],
          category: 'brand',
          neuroplastic_milestone: 66
        },
        {
          id: 'nt-5',
          title: 'Spara smart - automatisera din ekonomi',
          description: 'Progressiv ekonomisk planering för framtida trygghet',
          neuroplastic_principle: 'chunking',
          difficulty_level: 4,
          estimated_minutes: 20,
          frequency: 'weekly',
          duration_days: 21,
          habit_cue: 'Varje söndag kväll',
          habit_reward: 'Jag känner kontroll över min ekonomi',
          micro_steps: [
            'Granska veckans utgifter',
            'Identifiera en onödig kostnad',
            'Sätt undan det beloppet i sparande',
            'Planera nästa veckas budget',
            'Automatisera en ny sparrutin'
          ],
          category: 'economy',
          neuroplastic_milestone: 21
        }
      ];

      setGeneratedTasks(sampleTasks);
      setCurrentPhase('selection');
      
      toast({
        title: "Neuroplastiska uppgifter genererade!",
        description: "Välj de uppgifter som känns mest motiverande för dig just nu.",
      });
      
    } catch (error) {
      toast({
        title: "Fel vid generering",
        description: "Kunde inte skapa uppgifter. Försök igen.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const createSelectedTasks = async () => {
    const tasksToCreate = generatedTasks.filter(task => selectedTasks.includes(task.id));
    
    try {
      for (const task of tasksToCreate) {
        await createTask({
          user_id: userId,
          title: task.title,
          description: `${task.description}\n\nNeuroplastisk princip: ${neuroplasticPrinciples[task.neuroplastic_principle].name}\n\nMikro-steg:\n${task.micro_steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nHabit cue: ${task.habit_cue}\nBelöning: ${task.habit_reward}`,
          priority: task.difficulty_level <= 2 ? 'low' : task.difficulty_level <= 3 ? 'medium' : 'high',
          deadline: new Date(Date.now() + task.duration_days * 24 * 60 * 60 * 1000).toISOString(),
          ai_generated: true
        });
      }
      
      toast({
        title: "Uppgifter skapade!",
        description: `${tasksToCreate.length} neuroplastiska utvecklingsuppgifter har lagts till i ditt system.`,
      });
      
      if (onTasksCreated) {
        onTasksCreated(tasksToCreate);
      }
      
    } catch (error) {
      toast({
        title: "Fel vid skapande",
        description: "Kunde inte skapa alla uppgifter. Försök igen.",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 2) return 'bg-green-100 text-green-800';
    if (level <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getMilestoneColor = (days: number) => {
    if (days === 7) return 'bg-blue-100 text-blue-800';
    if (days === 21) return 'bg-purple-100 text-purple-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Neuroplastisk Uppgiftsgenerator
          </CardTitle>
          <p className="text-muted-foreground">
            AI skapar vetenskapligt baserade uppgifter för att maximera din hjärnas förmåga att förändras
          </p>
        </CardHeader>
      </Card>

      {/* Neuroplastiska principer översikt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Neuroplastiska principer vi använder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(neuroplasticPrinciples).map(([key, principle]) => (
              <div key={key} className={`p-4 rounded-lg border ${principle.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  {principle.icon}
                  <span className="font-medium text-sm">{principle.name}</span>
                </div>
                <p className="text-xs">{principle.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generering och uppgiftsval */}
      {generatedTasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Target className="h-8 w-8 text-blue-600" />
              <h3 className="text-xl font-semibold">Redo att börja din neuroplastiska resa?</h3>
            </div>
            <p className="text-muted-foreground max-w-md mx-auto">
              Baserat på dina bedömningar skapar AI personliga uppgifter som bygger nya neuronala banor 
              och skapar varaktiga positiva förändringar.
            </p>
            <Button 
              onClick={generateNeuroplasticTasks}
              disabled={isGenerating || loading}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Genererar uppgifter...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Skapa mina neuroplastiska uppgifter
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Uppgiftsval */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Välj dina utvecklingsuppgifter
                </CardTitle>
                <Badge variant="outline">
                  {selectedTasks.length} av {generatedTasks.length} valda
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Börja med 2-3 uppgifter för bäst resultat. Du kan alltid lägga till fler senare.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedTasks.map((task) => (
                <div 
                  key={task.id}
                  className={`p-4 border rounded-lg transition-all cursor-pointer ${
                    selectedTasks.includes(task.id) 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleTaskSelection(task.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{task.title}</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline" className={getDifficultyColor(task.difficulty_level)}>
                            Nivå {task.difficulty_level}
                          </Badge>
                          <Badge variant="outline" className={getMilestoneColor(task.neuroplastic_milestone)}>
                            {task.neuroplastic_milestone} dagar
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-medium">Neuroplastisk princip:</span>
                          <div className={`inline-flex items-center gap-1 ml-2 px-2 py-1 rounded ${neuroplasticPrinciples[task.neuroplastic_principle].color}`}>
                            {neuroplasticPrinciples[task.neuroplastic_principle].icon}
                            {neuroplasticPrinciples[task.neuroplastic_principle].name}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div><span className="font-medium">Frekvens:</span> {task.frequency === 'daily' ? 'Dagligen' : 'Veckovis'}</div>
                          <div><span className="font-medium">Tid:</span> {task.estimated_minutes} minuter</div>
                        </div>
                      </div>

                      {task.habit_cue && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <Flame className="h-3 w-3 text-orange-500" />
                            <span className="font-medium">Habit trigger:</span>
                          </div>
                          <p>{task.habit_cue} → {task.title} → {task.habit_reward}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Skapa valda uppgifter */}
          {selectedTasks.length > 0 && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="pt-6 text-center space-y-4">
                <h3 className="text-lg font-semibold">
                  Perfekt! Du har valt {selectedTasks.length} neuroplastiska uppgifter
                </h3>
                <p className="text-muted-foreground">
                  Dessa uppgifter kommer att hjälpa din hjärna att skapa nya, positiva mönster under de kommande veckorna.
                </p>
                <Button 
                  onClick={createSelectedTasks}
                  disabled={loading}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Lägg till i mina uppgifter
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};