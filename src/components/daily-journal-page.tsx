import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { DailyEntry, InsertDailyEntry, Task } from "@shared/schema";
import SixtySixDayMilestone from "@/components/sixty-six-day-milestone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Save, Camera, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { format, addDays, subDays } from "date-fns";

// Utility function to generate 10-minute activities based on task titles
const generateTenMinuteActivity = (taskTitle: string): string => {
  const activities = [
    {
      keywords: ['write', 'writing', 'blog', 'article', 'story', 'book', 'chapter', 'journal', 'draft', 'manuscript'],
      templates: [
        'Set up your writing space and write the opening paragraph of "{title}"',
        'Outline the main points for "{title}" - spend 10 minutes brainstorming key ideas',
        'Write for 10 minutes on "{title}" - focus on getting thoughts down, not perfection',
        'Review and edit the first draft of "{title}" for clarity and flow',
        'Create a quick outline or structure for "{title}" in 10 minutes'
      ]
    },
    {
      keywords: ['learn', 'study', 'practice', 'skill', 'course', 'tutorial', 'train', 'master', 'understand'],
      templates: [
        'Spend 10 minutes learning the basics of "{title}"',
        'Practice one fundamental aspect of "{title}" for 10 minutes',
        'Watch a short tutorial or read an article about "{title}"',
        'Take notes on the key concepts of "{title}" for 10 minutes',
        'Review and practice the most challenging part of "{title}" for 10 minutes'
      ]
    },
    {
      keywords: ['organize', 'clean', 'declutter', 'tidy', 'sort', 'arrange', 'file', 'categorize'],
      templates: [
        'Spend 10 minutes organizing one area related to "{title}"',
        'Sort through items for "{title}" - decide what to keep, donate, or discard',
        'Create a system for organizing materials needed for "{title}"',
        'Tidy up the space where you\'ll work on "{title}"',
        'Categorize and arrange everything you need for "{title}" in 10 minutes'
      ]
    },
    {
      keywords: ['exercise', 'workout', 'fitness', 'run', 'walk', 'yoga', 'stretch', 'movement', 'train'],
      templates: [
        'Do 10 minutes of "{title}" - start with gentle movements',
        'Prepare for "{title}" by setting out gear and planning your routine',
        'Practice basic movements or stretches for "{title}"',
        'Take a 10-minute walk while thinking about your "{title}" goals',
        'Warm up and do the first 10 minutes of "{title}" routine'
      ]
    },
    {
      keywords: ['plan', 'schedule', 'prepare', 'research', 'design', 'strategy', 'outline'],
      templates: [
        'Research "{title}" for 10 minutes - gather initial information',
        'Create a simple plan or timeline for "{title}"',
        'List the first 3 steps you need to take for "{title}"',
        'Spend 10 minutes preparing materials or resources for "{title}"',
        'Design a basic strategy or approach for "{title}" in 10 minutes'
      ]
    },
    {
      keywords: ['call', 'contact', 'email', 'reach', 'connect', 'communicate', 'message'],
      templates: [
        'Draft the key points for your "{title}" conversation in 10 minutes',
        'Prepare what you want to say for "{title}" - write down main points',
        'Research the person or organization for "{title}" for 10 minutes',
        'Set up your space and mindset for "{title}" call or meeting',
        'Practice or rehearse what you\'ll say for "{title}" in 10 minutes'
      ]
    },
    {
      keywords: ['create', 'make', 'build', 'develop', 'design', 'craft', 'produce'],
      templates: [
        'Spend 10 minutes sketching or brainstorming ideas for "{title}"',
        'Gather materials and set up your workspace for "{title}"',
        'Create the first element or component of "{title}" in 10 minutes',
        'Design a rough prototype or mockup for "{title}"',
        'Make one small piece of "{title}" - focus on starting, not finishing'
      ]
    },
    {
      keywords: ['read', 'review', 'analyze', 'study', 'examine', 'explore'],
      templates: [
        'Read for 10 minutes about "{title}" - focus on understanding basics',
        'Review and take notes on key information about "{title}"',
        'Analyze one aspect of "{title}" that you find most interesting',
        'Explore different perspectives or approaches to "{title}" for 10 minutes',
        'Study the most important element of "{title}" in depth'
      ]
    }
  ];

  const defaultTemplates = [
    'Take the first small step toward "{title}" - just 10 minutes of focused action',
    'Prepare or gather what you need to begin "{title}"',
    'Spend 10 minutes thinking about and planning your approach to "{title}"',
    'Start "{title}" with one simple, manageable action for 10 minutes',
    'Break "{title}" into smaller pieces and work on the first one for 10 minutes',
    'Set up your environment and mindset for success with "{title}"'
  ];

  // Find matching activity category with more comprehensive matching
  const taskLower = taskTitle.toLowerCase();
  const matchedCategory = activities.find(category => 
    category.keywords.some(keyword => taskLower.includes(keyword))
  );

  // Get templates from matched category or use defaults
  const templates = matchedCategory ? matchedCategory.templates : defaultTemplates;
  
  // Select a random template
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  
  // Replace {title} placeholder with actual task title
  return randomTemplate.replace(/\{title\}/g, taskTitle);
};

export default function DailyJournalPage() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isListening, setIsListening] = useState<string | null>(null);
  // Initialize activity type based on task availability - default to 'energy' if no tasks
  const [activityType, setActivityType] = useState<'task' | 'energy'>('energy');
  const [showMilestone, setShowMilestone] = useState(false);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const dateString = format(currentDate, 'yyyy-MM-dd');
  
  const { startListening, stopListening, transcript, resetTranscript } = useSpeechRecognition();

  const { data: dailyEntry, isLoading: dailyLoading, error: dailyError } = useQuery<DailyEntry | null>({
    queryKey: ['/api/daily', dateString],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    retry: 3,
    retryDelay: 1000,
  });

  // Get all daily entries to calculate consecutive days
  const { data: allEntries, isLoading: entriesLoading, error: entriesError } = useQuery<DailyEntry[]>({
    queryKey: ['/api/daily-all'],
    retry: 2,
    retryDelay: 1000,
  });

  const [formData, setFormData] = useState<Partial<InsertDailyEntry>>({
    date: dateString,
    morningIntention: '',
    energyLevel: 7,
    eveningReflection: '',
    promiseKept: '',
    followUpResponse: '',
    photos: [],
    voiceNotes: [],
  });

  // Update form data when daily entry loads or date changes
  useEffect(() => {
    if (dailyEntry) {
      setFormData(dailyEntry);
    } else {
      setFormData({
        date: dateString,
        morningIntention: '',
        energyLevel: 7,
        eveningReflection: '',
        promiseKept: '',
        followUpResponse: '',
        photos: [],
        voiceNotes: [],
      });
    }
  }, [dailyEntry, dateString]);

  // Calculate consecutive days helper
  const calculateConsecutiveDays = (entries: DailyEntry[]): number => {
    if (!entries || entries.length === 0) return 0;
    
    const sortedEntries = entries
      .filter(entry => entry.promiseKept === 'yes')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (sortedEntries.length === 0) return 0;
    
    let consecutive = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].date);
      const expectedDate = new Date(currentDate);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      // Check if this entry is from the expected consecutive day
      if (entryDate.toDateString() === expectedDate.toDateString()) {
        consecutive++;
      } else {
        break;
      }
    }
    
    return consecutive;
  };

  const createOrUpdateMutation = useMutation({
    mutationFn: async (data: InsertDailyEntry) => {
      try {
        if (dailyEntry) {
          return await apiRequest('PUT', `/api/daily/${dailyEntry.id}`, data);
        } else {
          return await apiRequest('POST', '/api/daily', data);
        }
      } catch (error) {
        console.error('Failed to save journal entry:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily', dateString] });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-all'] });
      
      // Check for 66-day milestone
      if (allEntries && formData.promiseKept === 'yes') {
        const updatedEntries = [...allEntries, { 
          ...formData, 
          date: dateString,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          followUpResponse: formData.followUpResponse || null,
          morningIntention: formData.morningIntention || null,
          energyLevel: formData.energyLevel || null,
          suggestedTaskId: formData.suggestedTaskId || null,
          tenMinuteActivity: formData.tenMinuteActivity || null,
          eveningReflection: formData.eveningReflection || null,
          promiseKept: formData.promiseKept || null,
          photos: formData.photos || null,
          voiceNotes: formData.voiceNotes || null,
          activityCompleted: null
        }];
        const consecutiveCount = calculateConsecutiveDays(updatedEntries);
        setConsecutiveDays(consecutiveCount);
        
        // Show milestone celebration if they hit 66 days and haven't seen it
        const hasSeenMilestone = localStorage.getItem('tenMinuteTransformation_66DayMilestone');
        if (consecutiveCount >= 66 && !hasSeenMilestone) {
          setShowMilestone(true);
        }
      }
      
      toast({
        title: "Journal saved ✨",
        description: "Your daily reflections have been preserved.",
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Save failed",
        description: "There was an issue saving your journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get suggested activity from tasks
  const incompleteTasks = tasks?.filter(task => !task.isCompleted) || [];
  const suggestedTask = incompleteTasks[Math.floor(Math.random() * incompleteTasks.length)];
  
  const generateActivity = (task?: Task, energyLevel?: number) => {
    const dayOfWeek = currentDate.getDay();
    const timeOfDay = new Date().getHours();
    const energy = energyLevel || 5; // Default to medium energy if not set
    
    // Energy-aware self-care activities when no tasks
    const lowEnergyActivities = [
      "Take 10 minutes for gentle breathing and grounding yourself in the present moment",
      "Spend 10 minutes in quiet gratitude reflection, noticing small joys around you",
      "Use 10 minutes for gentle stretching or simply sitting with awareness of your body",
      "Take 10 minutes to tidy one small area while moving slowly and mindfully",
      "Dedicate 10 minutes to meditation or simply watching your breath",
      "Spend 10 minutes sitting by a window or outside, observing nature quietly",
      "Use 10 minutes for gentle self-compassion and soothing inner dialogue",
      "Take 10 minutes to rest and visualize a peaceful, safe space",
      "Spend 10 minutes doing something very gentle and creative - doodling, humming",
      "Use 10 minutes for a quiet, gentle connection with yourself through journaling"
    ];
    
    const highEnergyActivities = [
      "Take 10 minutes for energizing breathwork and setting powerful intentions",
      "Spend 10 minutes writing down ambitious goals and excitement for the day",
      "Use 10 minutes for dynamic movement - stretching, dancing, or walking briskly",
      "Take 10 minutes to organize and optimize your space for peak productivity",
      "Dedicate 10 minutes to focused visualization of achieving your biggest dreams",
      "Spend 10 minutes on an energizing walk or outdoor movement",
      "Use 10 minutes for confident affirmations and self-empowerment practices",
      "Take 10 minutes to brainstorm creative solutions or new possibilities",
      "Spend 10 minutes on an energizing creative activity - sketching, writing, planning",
      "Use 10 minutes to reach out and inspire or connect meaningfully with someone"
    ];
    
    const mediumEnergyActivities = [
      "Take 10 minutes for mindful breathing and gentle intention setting",
      "Spend 10 minutes journaling about what you're grateful for today",
      "Use 10 minutes to stretch your body and check in with how you feel",
      "Take 10 minutes to organize your space mindfully and with purpose",
      "Dedicate 10 minutes to sitting quietly and observing your thoughts",
      "Spend 10 minutes walking mindfully, either indoors or outside",
      "Use 10 minutes to practice self-compassion and kind inner dialogue",
      "Take 10 minutes to visualize your ideal self and how that feels",
      "Spend 10 minutes doing something creative just for the joy of it",
      "Use 10 minutes to connect with someone you care about"
    ];

    if (!task) {
      let activities = mediumEnergyActivities;
      if (energy <= 3) {
        activities = lowEnergyActivities;
      } else if (energy >= 8) {
        activities = highEnergyActivities;
      }
      return activities[Math.floor(Math.random() * activities.length)];
    }
    
    // Use the improved automatic activity generation for tasks
    return generateTenMinuteActivity(task.title);
  };
  
  // Generate both types of activities
  const taskActivity = suggestedTask ? generateTenMinuteActivity(suggestedTask.title) : null;
  
  // Auto-switch to task tab when tasks become available, but only if user hasn't manually selected energy
  const [userSelectedEnergy, setUserSelectedEnergy] = useState(false);
  const energyActivity = (() => {
    const energy = formData.energyLevel || 5;
    const lowEnergyActivities = [
      "Take 10 minutes for gentle breathing and grounding yourself in the present moment",
      "Spend 10 minutes in quiet gratitude reflection, noticing small joys around you",
      "Use 10 minutes for gentle stretching or simply sitting with awareness of your body",
      "Take 10 minutes to tidy one small area while moving slowly and mindfully",
      "Dedicate 10 minutes to meditation or simply watching your breath",
      "Spend 10 minutes sitting by a window or outside, observing nature quietly",
      "Use 10 minutes for gentle self-compassion and soothing inner dialogue",
      "Take 10 minutes to rest and visualize a peaceful, safe space",
      "Spend 10 minutes doing something very gentle and creative - doodling, humming",
      "Use 10 minutes for a quiet, gentle connection with yourself through journaling"
    ];
    
    const highEnergyActivities = [
      "Take 10 minutes for energizing breathwork and setting powerful intentions",
      "Spend 10 minutes writing down ambitious goals and excitement for the day",
      "Use 10 minutes for dynamic movement - stretching, dancing, or walking briskly",
      "Take 10 minutes to organize and optimize your space for peak productivity",
      "Dedicate 10 minutes to focused visualization of achieving your biggest dreams",
      "Spend 10 minutes on an energizing walk or outdoor movement",
      "Use 10 minutes for confident affirmations and self-empowerment practices",
      "Take 10 minutes to brainstorm creative solutions or new possibilities",
      "Spend 10 minutes on an energizing creative activity - sketching, writing, planning",
      "Use 10 minutes to reach out and inspire or connect meaningfully with someone"
    ];
    
    const mediumEnergyActivities = [
      "Take 10 minutes for mindful breathing and gentle intention setting",
      "Spend 10 minutes journaling about what you're grateful for today",
      "Use 10 minutes to stretch your body and check in with how you feel",
      "Take 10 minutes to organize your space mindfully and with purpose",
      "Dedicate 10 minutes to sitting quietly and observing your thoughts",
      "Spend 10 minutes walking mindfully, either indoors or outside",
      "Use 10 minutes to practice self-compassion and kind inner dialogue",
      "Take 10 minutes to visualize your ideal self and how that feels",
      "Spend 10 minutes doing something creative just for the joy of it",
      "Use 10 minutes to connect with someone you care about"
    ];

    let activities = mediumEnergyActivities;
    if (energy <= 3) {
      activities = lowEnergyActivities;
    } else if (energy >= 8) {
      activities = highEnergyActivities;
    }
    return activities[Math.floor(Math.random() * activities.length)];
  })();
  
  // Get the activity to display based on current selection
  // Auto-switch to task tab when tasks become available (unless user explicitly chose energy)
  useEffect(() => {
    if (taskActivity && !userSelectedEnergy) {
      setActivityType('task');
    }
  }, [taskActivity, userSelectedEnergy]);

  const currentActivity = activityType === 'task' && taskActivity ? taskActivity : energyActivity;

  const handleSave = () => {
    // Validate required fields before saving
    if (!formData.morningIntention?.trim() && !formData.eveningReflection?.trim() && !formData.energyLevel) {
      toast({
        title: "Nothing to save yet",
        description: "Add your morning intention, energy level, or evening reflection to create your journal entry.",
        variant: "destructive",
      });
      return;
    }

    createOrUpdateMutation.mutate({
      ...formData,
      date: dateString,
      suggestedTaskId: suggestedTask?.id,
      tenMinuteActivity: currentActivity,
    } as InsertDailyEntry);
  };

  const handleVoiceInput = (field: string) => {
    if (isListening === field) {
      stopListening();
      if (field === 'notes') {
        // Add voice note to the voiceNotes array
        const newVoiceNote = transcript.trim();
        if (newVoiceNote) {
          setFormData({
            ...formData,
            voiceNotes: [...(formData.voiceNotes || []), newVoiceNote]
          });
        }
      } else {
        // Add to specific text field
        setFormData({
          ...formData,
          [field]: (formData[field as keyof typeof formData] || '') + ' ' + transcript
        });
      }
      resetTranscript();
      setIsListening(null);
    } else {
      setIsListening(field);
      startListening();
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = e.target?.result as string;
        setFormData({
          ...formData,
          photos: [...(formData.photos || []), photoData]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = [...(formData.photos || [])];
    updatedPhotos.splice(index, 1);
    setFormData({ ...formData, photos: updatedPhotos });
  };

  const removeVoiceNote = (index: number) => {
    const updatedVoiceNotes = [...(formData.voiceNotes || [])];
    updatedVoiceNotes.splice(index, 1);
    setFormData({ ...formData, voiceNotes: updatedVoiceNotes });
  };

  const getPromiseResponse = () => {
    switch (formData.promiseKept) {
      case 'yes':
        return "That's a powerful act of respect for yourself. How does it feel to notice that?";
      case 'partial':
        return "Progress is still growth. What supported you in moving forward today?";
      case 'no':
        return "That happens. What got in the way, and how could you support yourself better tomorrow?";
      default:
        return null;
    }
  };

  // Handle loading and error states
  if (dailyLoading || tasksLoading || entriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest mx-auto mb-4"></div>
          <p className="text-sage">Loading your journal...</p>
        </div>
      </div>
    );
  }

  if (dailyError || tasksError || entriesError) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Unable to load journal</h3>
        <p className="text-charcoal mb-4">
          There was an issue connecting to your journal data. Please refresh the page or try again.
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          className="bg-forest text-warmwhite hover:bg-emerald"
        >
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl sm:text-4xl font-crimson font-semibold text-forest mb-2 break-words tracking-tight" data-testid="daily-title">
              Daily Journal
            </h2>
            <p className="text-sage font-crimson italic text-sm sm:text-base" data-testid="text-current-date">
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex space-x-3 flex-shrink-0 self-start sm:self-center">
            <button
              onClick={() => setCurrentDate(subDays(currentDate, 1))}
              data-testid="button-previous-day"
              className="p-3 bg-softwhite text-sage hover:text-forest hover:bg-pearl rounded-xl transition-all duration-200 shadow-soft hover:shadow-medium touch-target"
              style={{ border: '1px solid hsl(45, 20%, 85%)', minHeight: '48px', minWidth: '48px' }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(addDays(currentDate, 1))}
              data-testid="button-next-day"
              className="p-3 bg-softwhite text-sage hover:text-forest hover:bg-pearl rounded-xl transition-all duration-200 shadow-soft hover:shadow-medium touch-target"
              style={{ border: '1px solid hsl(45, 20%, 85%)', minHeight: '48px', minWidth: '48px' }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Morning Section */}
        <div className="card-elevated bg-gradient-to-br from-cream/50 to-softwhite p-6 sm:p-8 hover:shadow-deep transition-all duration-300">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-forest font-crimson mb-2">Morning Intention</h3>
            <div className="w-12 h-1 bg-mint rounded-full mb-4"></div>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="morning-intention" className="block text-sm font-medium text-forest mb-2">
                What's your intention for aligning with your higher self today?
                <span className="text-xs text-sage font-normal italic block mt-1">
                  Set a gentle intention that honors who you're becoming
                </span>
              </Label>
              <div className="relative">
                <Textarea
                  id="morning-intention"
                  placeholder="Today I choose to... I want to feel... I'm committed to..."
                  value={formData.morningIntention || ''}
                  onChange={(e) => setFormData({ ...formData, morningIntention: e.target.value })}
                  data-testid="textarea-morning-intention"
                  className="input-elevated min-h-[120px] font-crimson pr-12 text-base leading-relaxed"
                  aria-describedby="morning-intention-description"
                />
                <div id="morning-intention-description" className="sr-only">
                  Enter your daily intention for personal growth and alignment
                </div>
                <button
                  onClick={() => handleVoiceInput('morningIntention')}
                  data-testid="button-voice-morning"
                  className={`absolute top-3 right-3 p-2.5 rounded-lg transition-all shadow-soft ${
                    isListening === 'morningIntention' 
                      ? 'bg-forest text-warmwhite animate-pulse shadow-medium' 
                      : 'bg-softwhite text-sage hover:text-forest hover:shadow-medium'
                  }`}
                  title={isListening === 'morningIntention' ? 'Stop recording' : 'Start voice input'}
                >
                  <Mic className="w-4 h-4" />
                </button>
                {/* Live Transcription Display */}
                {isListening === 'morningIntention' && transcript && (
                  <div className="absolute bottom-2 left-2 right-14 bg-forest/90 text-warmwhite text-sm p-2 rounded-lg shadow-lg border border-emerald/30" data-testid="live-transcript-morning">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald rounded-full animate-pulse"></div>
                      <span className="text-xs text-emerald">Speaking...</span>
                    </div>
                    <p className="font-crimson italic mt-1 leading-relaxed">{transcript}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="block text-sm font-medium text-forest">
                  Today's 10-Minute Step
                  <span className="text-xs text-sage font-normal italic block mt-1">
                    Choose between task-focused work or energy-based self-care
                  </span>
                </Label>
              </div>
              
              {/* Activity Type Selector */}
              <div className="flex bg-pearl rounded-xl p-1.5 mb-6 shadow-soft">
                <button
                  onClick={() => {
                    setActivityType('task');
                    setUserSelectedEnergy(false);
                  }}
                  data-testid="button-activity-type-task"
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-inter font-medium transition-all duration-200 ${
                    activityType === 'task' 
                      ? 'bg-forest text-warmwhite shadow-medium transform scale-105' 
                      : 'text-charcoal hover:text-forest hover:bg-warmwhite hover:shadow-soft'
                  }`}
                  disabled={!taskActivity}
                >
                  <div className="flex flex-col items-center">
                    <span>Task Focus</span>
                    {!taskActivity && <span className="text-xs opacity-70">(No tasks)</span>}
                  </div>
                </button>
                <button
                  onClick={() => {
                    setActivityType('energy');
                    setUserSelectedEnergy(true);
                  }}
                  data-testid="button-activity-type-energy"
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activityType === 'energy' 
                      ? 'bg-forest text-warmwhite shadow-sm' 
                      : 'text-charcoal hover:text-forest'
                  }`}
                >
                  Energy Care
                </button>
              </div>

              <div className="bg-forest/5 rounded-2xl p-4 border border-forest/10 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-forest rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm text-forest font-medium leading-relaxed" data-testid="text-today-activity">
                      {currentActivity}
                    </p>
                    
                    {activityType === 'task' && suggestedTask && (
                      <div className="mt-2 p-2 bg-emerald/10 rounded-lg">
                        <span className="text-xs text-sage">Working toward: </span>
                        <span className="text-xs font-medium text-emerald">{suggestedTask.title}</span>
                        {suggestedTask.description && (
                          <p className="text-xs text-charcoal mt-1 italic">{suggestedTask.description}</p>
                        )}
                      </div>
                    )}
                    
                    {activityType === 'energy' && (
                      <div className="mt-2">
                        <span className="text-xs text-sage italic">
                          Energy-based activity • Level {formData.energyLevel || 5}
                        </span>
                      </div>
                    )}
                    
                    {activityType === 'task' && !taskActivity && (
                      <div className="mt-2">
                        <span className="text-xs text-sage italic">
                          No tasks available today • Switch to Energy Care for personalized activities
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="energy-level" className="block text-sm font-medium text-forest mb-2">
                Energy Level
                <span className="text-xs text-sage font-normal italic block mt-1">
                  How are you feeling right now? This helps personalize your activity
                </span>
              </Label>
              <Slider
                id="energy-level"
                value={[formData.energyLevel || 7]}
                onValueChange={(value) => setFormData({ ...formData, energyLevel: value[0] })}
                max={10}
                min={1}
                step={1}
                data-testid="slider-energy-level"
                className="w-full"
                aria-label="Energy level from 1 to 10"
                aria-describedby="energy-level-description"
              />
              <div id="energy-level-description" className="sr-only">
                Rate your current energy level from 1 (low) to 10 (high) to get personalized activity suggestions
              </div>
              <div className="flex justify-between text-xs text-sage mt-1">
                <span>Low</span>
                <span className="font-semibold">Level: {formData.energyLevel}</span>
                <span>High</span>
              </div>
            </div>
          </div>
        </div>

        {/* Evening Section */}
        <div className="bg-gradient-to-b from-emerald/10 to-emerald/20 rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-forest font-crimson">Evening Reflection</h3>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="evening-reflection" className="block text-sm font-medium text-forest mb-2">
                How did today's actions serve your journey to true alignment?
                <span className="text-xs text-sage font-normal italic block mt-1">
                  Reflect with compassion on your day's experiences
                </span>
              </Label>
              <div className="relative">
                <Textarea
                  id="evening-reflection"
                  placeholder="What went well today? What challenged me? How did I grow? What am I grateful for?"
                  value={formData.eveningReflection || ''}
                  onChange={(e) => setFormData({ ...formData, eveningReflection: e.target.value })}
                  data-testid="textarea-evening-reflection"
                  className="bg-warmwhite border-sage/30 focus:border-forest min-h-[120px] font-crimson pr-12"
                  aria-describedby="evening-reflection-description"
                />
                <div id="evening-reflection-description" className="sr-only">
                  Reflect on your daily experiences, growth, and gratitude
                </div>
                <button
                  onClick={() => handleVoiceInput('eveningReflection')}
                  data-testid="button-voice-evening"
                  className={`absolute top-2 right-2 p-2 rounded ${
                    isListening === 'eveningReflection' ? 'bg-forest text-warmwhite' : 'text-sage hover:text-forest'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-forest mb-3">
                Promise Kept?
                <span className="text-xs text-sage font-normal italic block mt-1">
                  Did you honor a commitment to yourself today? Be gentle and honest
                </span>
              </Label>
              <RadioGroup
                value={formData.promiseKept || ''}
                onValueChange={(value) => setFormData({ ...formData, promiseKept: value })}
                data-testid="radio-promise-kept"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="text-charcoal cursor-pointer">
                    Yes - I honored my commitment to myself
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="partial" id="partial" />
                  <Label htmlFor="partial" className="text-charcoal cursor-pointer">
                    Partially - I made progress
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="text-charcoal cursor-pointer">
                    No - Life got in the way
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {getPromiseResponse() && (
              <div className="bg-cream/50 rounded-lg p-4 border border-sage/20">
                <p className="text-sm text-forest font-medium mb-2">
                  <i className="fas fa-heart text-rose-400 mr-2"></i>
                  {getPromiseResponse()}
                </p>
                <div className="relative">
                  <Textarea
                    placeholder="Share what this means to you... What feels important about this moment?"
                    value={formData.followUpResponse || ''}
                    onChange={(e) => setFormData({ ...formData, followUpResponse: e.target.value })}
                    data-testid="textarea-follow-up"
                    className="bg-warmwhite border-sage/30 focus:border-forest text-sm font-crimson pr-12"
                  />
                  <button
                    onClick={() => handleVoiceInput('followUpResponse')}
                    data-testid="button-voice-followup"
                    className={`absolute top-2 right-2 p-2 rounded ${
                      isListening === 'followUpResponse' ? 'bg-forest text-warmwhite' : 'text-sage hover:text-forest'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-4">
              <label
                data-testid="button-add-photo"
                className="flex items-center space-x-2 text-sage hover:text-forest transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span className="text-sm">Add Moment</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => handleVoiceInput('notes')}
                data-testid="button-voice-note"
                className={`flex items-center space-x-2 transition-colors ${
                  isListening === 'notes' ? 'text-forest bg-forest/10 px-2 py-1 rounded' : 'text-sage hover:text-forest'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span className="text-sm">Voice Note</span>
              </button>
            </div>

            {/* Display Photos */}
            {formData.photos && formData.photos.length > 0 && (
              <div className="mt-4">
                <Label className="block text-sm font-medium text-forest mb-2">Your Moments</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`Moment ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-sage/30"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Display Voice Notes */}
            {formData.voiceNotes && formData.voiceNotes.length > 0 && (
              <div className="mt-4">
                <Label className="block text-sm font-medium text-forest mb-2">Your Voice Notes</Label>
                <div className="space-y-2">
                  {formData.voiceNotes.map((note, index) => (
                    <div key={index} className="flex items-center justify-between bg-sage/10 rounded-lg p-3">
                      <p className="text-sm text-charcoal flex-grow">{note}</p>
                      <button
                        onClick={() => removeVoiceNote(index)}
                        className="ml-2 text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Button
          onClick={handleSave}
          disabled={createOrUpdateMutation.isPending}
          data-testid="button-save-day"
          className="btn-primary px-12 py-4 text-lg font-crimson font-medium shadow-medium hover:shadow-deep transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {createOrUpdateMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-warmwhite mr-2"></div>
              Preserving your journey...
            </>
          ) : (
            <>
              Save Today's Journey <Save className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* 66-Day Milestone Modal */}
      <SixtySixDayMilestone
        isOpen={showMilestone}
        onClose={() => setShowMilestone(false)}
        consecutiveDays={consecutiveDays}
      />
      </div>
    </div>
  );
}
