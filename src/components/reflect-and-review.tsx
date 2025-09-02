import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Reflection, InsertReflection, WeeklyReview as WeeklyReviewType, InsertWeeklyReview, DailyEntry, Task } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Heart, Save, ArrowRight, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek } from "date-fns";
import GrowthTree from "@/components/growth-tree";

interface ReflectionPrompt {
  id: string;
  question: string;
  icon: string;
  color: string;
  responses: {
    yes?: string;
    no?: string;
    followUp?: string;
  };
}

const reflectionPrompts: ReflectionPrompt[] = [];

export default function ReflectAndReview() {
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDate = new Date();
  const weekStart = format(startOfWeek(todayDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(todayDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  
  const [responses, setResponses] = useState<Record<string, { response: string; followUpResponse?: string; selectedButton?: string }>>({});
  const [reviewData, setReviewData] = useState<Partial<InsertWeeklyReview>>({
    weekStart,
    weekEnd,
    proudActions: '',
    selfRespectMoments: '',
    patterns: '',
    nextWeekCultivate: '',
    nextWeekSupport: '',
    growthLevel: 1,
    promisesKept: 0,
    totalPromises: 0,
  });

  const { data: existingReflections } = useQuery<Reflection[]>({
    queryKey: ['/api/reflections', today],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: existingReview } = useQuery<WeeklyReviewType | null>({
    queryKey: ['/api/weekly-review', weekStart],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: weekEntries } = useQuery<DailyEntry[]>({
    queryKey: ['/api/daily-week', weekStart, weekEnd],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks', weekStart],
    retry: 3,
    retryDelay: 1000,
  });

  // Get all entries to calculate months active
  const { data: allEntries } = useQuery<DailyEntry[]>({
    queryKey: ['/api/daily-all'],
  });

  // Calculate months active from first entry
  const calculateMonthsActive = () => {
    if (!allEntries || allEntries.length === 0) return 0;
    
    const firstEntry = allEntries.reduce((earliest, entry) => {
      return new Date(entry.date) < new Date(earliest.date) ? entry : earliest;
    });
    
    const firstDate = new Date(firstEntry.date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - firstDate.getTime());
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
    
    return diffMonths;
  };

  // Update form data when existing review loads or reset for new week
  React.useEffect(() => {
    if (existingReview) {
      setReviewData(existingReview);
    } else {
      // Reset form for new week if no existing review
      setReviewData({
        weekStart,
        weekEnd,
        proudActions: '',
        selfRespectMoments: '',
        patterns: '',
        nextWeekCultivate: '',
        nextWeekSupport: '',
        growthLevel: 1,
        promisesKept: 0,
        totalPromises: 0,
      });
    }
  }, [existingReview, weekStart, weekEnd]);

  const saveReflectionMutation = useMutation({
    mutationFn: async (reflection: InsertReflection) => {
      try {
        return await apiRequest('POST', '/api/reflections', reflection);
      } catch (error) {
        console.error('Failed to save reflection:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reflections', today] });
      toast({
        title: "Reflection saved ✨",
        description: "Your wisdom has been captured for your journey.",
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "There was an issue saving your reflection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveReviewMutation = useMutation({
    mutationFn: async (data: InsertWeeklyReview) => {
      try {
        if (existingReview) {
          return await apiRequest('PUT', `/api/weekly-review/${existingReview.id}`, data);
        } else {
          return await apiRequest('POST', '/api/weekly-review', data);
        }
      } catch (error) {
        console.error('Failed to save weekly review:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-review', weekStart] });
      toast({
        title: "Weekly review saved ✨",
        description: "Your growth has been honored and preserved.",
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "There was an issue saving your weekly review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleButtonResponse = (promptId: string, response: 'yes' | 'no') => {
    setResponses(prev => ({
      ...prev,
      [promptId]: {
        ...prev[promptId],
        selectedButton: response,
        response: prev[promptId]?.response || '',
      }
    }));
  };

  const handleTextResponse = (promptId: string, text: string) => {
    setResponses(prev => ({
      ...prev,
      [promptId]: {
        ...prev[promptId],
        response: text,
      }
    }));
  };

  const handleFollowUpResponse = (promptId: string, text: string) => {
    setResponses(prev => ({
      ...prev,
      [promptId]: {
        ...prev[promptId],
        followUpResponse: text,
      }
    }));
  };

  const saveAllReflections = async () => {
    const promises = Object.entries(responses).map(([promptId, data]) => {
      const prompt = reflectionPrompts.find(p => p.id === promptId);
      if (!prompt || !data.response) return null;

      return saveReflectionMutation.mutateAsync({
        promptId,
        promptText: prompt.question,
        response: data.response,
        followUpResponse: data.followUpResponse,
        date: today,
      });
    }).filter(Boolean);

    await Promise.all(promises);
  };

  const handleSaveReview = () => {
    const completedPromises = weekEntries?.filter(entry => 
      entry.promiseKept === 'yes' || entry.activityCompleted
    ).length || 0;
    
    const totalPromises = weekEntries?.length || 0;
    const growthLevel = Math.min(5, Math.max(1, Math.ceil((completedPromises / Math.max(totalPromises, 1)) * 5)));

    saveReviewMutation.mutate({
      ...reviewData,
      promisesKept: completedPromises,
      totalPromises,
      growthLevel,
    } as InsertWeeklyReview);
  };

  const getFollowUpText = (prompt: ReflectionPrompt, selectedButton?: string) => {
    if (selectedButton && prompt.responses[selectedButton as keyof typeof prompt.responses]) {
      return prompt.responses[selectedButton as keyof typeof prompt.responses];
    }
    return prompt.responses.followUp;
  };

  // Calculate completed promises from weekEntries - only count valid entries
  const completedPromises = weekEntries?.filter(entry => 
    entry && 
    entry.promiseKept === 'yes' && 
    (entry.morningIntention || entry.eveningReflection || entry.energyLevel)
  ).length || 0;
  
  const totalPromises = weekEntries?.filter(entry => 
    entry && 
    (entry.morningIntention || entry.eveningReflection || entry.energyLevel)
  ).length || 0;

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-crimson font-semibold text-forest mb-4" data-testid="garden-title">
          Your Growth Garden
        </h2>
        <p className="text-sage font-crimson italic">
          Watch your transformation bloom as you nurture your daily intentions
        </p>
      </div>

      {/* Centered Growth Tree */}
      <div className="w-full flex justify-center items-center mb-8">
        <GrowthTree 
          promisesKept={completedPromises}
          totalPromises={totalPromises}
          completedTasks={tasks?.filter(task => task && task.isCompleted && task.isActive !== false).length || 0}
          growthLevel={reviewData.growthLevel || 1}
          monthsActive={calculateMonthsActive()}
          size="large"
        />
      </div>

      {/* Garden Description */}
      <div className="text-center mb-8">
        <div className="bg-gradient-to-br from-sage/10 to-mint/15 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto">
          <h4 className="font-crimson font-semibold text-forest mb-4">Your Growth Garden</h4>
          <p className="text-sage font-serif text-sm leading-relaxed">
            Your garden grows naturally through small acts of self-respect. Each flower represents a moment you honored yourself.
          </p>
        </div>
      </div>

      {/* Weekly Review Section */}
      <div className="text-center mb-8">
        <h3 className="text-xl font-crimson font-semibold text-forest mb-2">
          Weekly Review
        </h3>
        <p className="text-sage italic">
          Honor this week's journey and plant seeds for the next.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Weekly Review Form */}
        <div className="lg:col-span-3 space-y-8">
          <div className="space-y-6">
              <div className="bg-gradient-to-br from-cream/30 to-warmwhite/50 rounded-2xl p-6 shadow-sm">
                <Label className="block text-sm font-medium text-forest mb-3">
                  What actions made you proud this week?
                </Label>
                <Textarea
                  placeholder="Celebrate your wins, big and small..."
                  value={reviewData.proudActions || ''}
                  onChange={(e) => setReviewData({ ...reviewData, proudActions: e.target.value })}
                  data-testid="textarea-proud-actions"
                  className="bg-warmwhite border-sage/30 focus:border-forest min-h-[100px] font-crimson"
                />
              </div>

              <div className="bg-gradient-to-br from-emerald/5 to-mint/10 rounded-2xl p-6 shadow-sm">
                <Label className="block text-sm font-medium text-forest mb-3">
                  When did you feel most aligned with your values?
                </Label>
                <Textarea
                  placeholder="Moments of authentic self-respect..."
                  value={reviewData.selfRespectMoments || ''}
                  onChange={(e) => setReviewData({ ...reviewData, selfRespectMoments: e.target.value })}
                  data-testid="textarea-self-respect"
                  className="bg-warmwhite border-sage/30 focus:border-forest min-h-[100px] font-crimson"
                />
              </div>

              <div className="bg-gradient-to-br from-sage/10 to-mint/10 rounded-2xl p-6 shadow-sm">
                <Label className="block text-sm font-medium text-forest mb-3">
                  What patterns are you noticing in yourself?
                </Label>
                <Textarea
                  placeholder="Insights about your habits, thoughts, and growth..."
                  value={reviewData.patterns || ''}
                  onChange={(e) => setReviewData({ ...reviewData, patterns: e.target.value })}
                  data-testid="textarea-patterns"
                  className="bg-warmwhite border-sage/30 focus:border-forest min-h-[100px] font-crimson"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-cream/40 to-warmwhite/60 rounded-2xl p-6 shadow-sm">
                  <Label className="block text-sm font-medium text-forest mb-3">
                    What do you want to cultivate next week?
                  </Label>
                  <Textarea
                    placeholder="New habits, mindsets, or practices..."
                    value={reviewData.nextWeekCultivate || ''}
                    onChange={(e) => setReviewData({ ...reviewData, nextWeekCultivate: e.target.value })}
                    data-testid="textarea-cultivate"
                    className="bg-warmwhite border-sage/30 focus:border-forest min-h-[80px] font-crimson"
                  />
                </div>

                <div className="bg-gradient-to-br from-mint/10 to-emerald/5 rounded-2xl p-6 shadow-sm">
                  <Label className="block text-sm font-medium text-forest mb-3">
                    How will you support yourself?
                  </Label>
                  <Textarea
                    placeholder="Systems, people, or practices to help you..."
                    value={reviewData.nextWeekSupport || ''}
                    onChange={(e) => setReviewData({ ...reviewData, nextWeekSupport: e.target.value })}
                    data-testid="textarea-support"
                    className="bg-warmwhite border-sage/30 focus:border-forest min-h-[80px] font-crimson"
                  />
                </div>
              </div>
            </div>

          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleSaveReview}
              disabled={saveReviewMutation.isPending}
              data-testid="button-save-review"
              className="bg-forest text-warmwhite hover:bg-emerald px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveReviewMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-warmwhite mr-2"></div>
                  Harvesting insights...
                </>
              ) : (
                <>
                  Save Review <Save className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}