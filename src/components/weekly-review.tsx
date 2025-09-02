import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { WeeklyReview as WeeklyReviewType, InsertWeeklyReview, DailyEntry } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek } from "date-fns";
import GrowthTree from "@/components/growth-tree";

export default function WeeklyReview() {
  const { toast } = useToast();
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  
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

  const { data: existingReview } = useQuery<WeeklyReviewType | null>({
    queryKey: ['/api/weekly-review', weekStart],
  });

  const { data: weekEntries } = useQuery<DailyEntry[]>({
    queryKey: ['/api/daily-week', weekStart, weekEnd],
  });

  // Update form data when existing review loads
  useState(() => {
    if (existingReview) {
      setReviewData(existingReview);
    }
  });

  const saveReviewMutation = useMutation({
    mutationFn: (data: InsertWeeklyReview) => {
      if (existingReview) {
        return apiRequest('PUT', `/api/weekly-review/${existingReview.id}`, data);
      } else {
        return apiRequest('POST', '/api/weekly-review', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-review', weekStart] });
      toast({
        title: "Weekly review saved",
        description: "Your growth has been honored and preserved.",
      });
    },
  });

  const handleSave = () => {
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

  const handleStartNewWeek = () => {
    // Could navigate to goals or show a new week dialog
    toast({
      title: "New week awaits",
      description: "Ready to plant new seeds of growth?",
    });
  };

  const completedPromises = weekEntries?.filter(entry => 
    entry && 
    entry.promiseKept === 'yes' && 
    (entry.morningIntention || entry.eveningReflection || entry.energyLevel)
  ).length || 0;
  
  const totalPromises = weekEntries?.filter(entry => 
    entry && 
    (entry.morningIntention || entry.eveningReflection || entry.energyLevel)
  ).length || 0;
  const morningIntentions = weekEntries?.filter(entry => entry.morningIntention).length || 0;
  const eveningReflections = weekEntries?.filter(entry => entry.eveningReflection).length || 0;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-crimson font-semibold text-forest mb-2" data-testid="review-title">
          Weekly Review
        </h2>
        <p className="text-sage font-crimson italic" data-testid="text-week-range">
          {format(new Date(weekStart), 'MMMM d')} - {format(new Date(weekEnd), 'd, yyyy')}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Growth Tree Visualization */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-b from-cream/50 to-emerald/10 rounded-2xl p-6 text-center shadow-sm">
            <GrowthTree 
              promisesKept={completedPromises}
              totalPromises={totalPromises}
              growthLevel={reviewData.growthLevel || 1}
              size="medium"
            />
          </div>
        </div>

        {/* Weekly Insights */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-cream/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-forest mb-4">Weekly Reflection Prompts</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Which small actions made you proud this week?
                </label>
                <Textarea
                  placeholder="Celebrate your consistency and growth..."
                  value={reviewData.proudActions || ''}
                  onChange={(e) => setReviewData({ ...reviewData, proudActions: e.target.value })}
                  data-testid="textarea-proud-actions"
                  className="bg-warmwhite border-sage/30 focus:border-forest font-crimson"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Where did you show yourself respect?
                </label>
                <Textarea
                  placeholder="Honor the ways you cared for yourself..."
                  value={reviewData.selfRespectMoments || ''}
                  onChange={(e) => setReviewData({ ...reviewData, selfRespectMoments: e.target.value })}
                  data-testid="textarea-self-respect"
                  className="bg-warmwhite border-sage/30 focus:border-forest font-crimson"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  What patterns are you noticing?
                </label>
                <Textarea
                  placeholder="Observe your rhythms with curiosity..."
                  value={reviewData.patterns || ''}
                  onChange={(e) => setReviewData({ ...reviewData, patterns: e.target.value })}
                  data-testid="textarea-patterns"
                  className="bg-warmwhite border-sage/30 focus:border-forest font-crimson"
                />
              </div>
            </div>
          </div>

          {/* Weekly Stats */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-forest/5 rounded-lg p-4 border border-forest/20">
              <h4 className="font-semibold text-forest mb-3">This Week's Alignment</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-charcoal">Morning Intentions</span>
                  <span className="font-semibold text-forest" data-testid="text-morning-count">
                    {morningIntentions}/7
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-charcoal">Evening Reflections</span>
                  <span className="font-semibold text-emerald" data-testid="text-evening-count">
                    {eveningReflections}/7
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-charcoal">10-Min Actions</span>
                  <span className="font-semibold text-sage" data-testid="text-actions-count">
                    {completedPromises}/{totalPromises}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-emerald/5 rounded-lg p-4 border border-emerald/20">
              <h4 className="font-semibold text-emerald mb-3">Growth Highlights</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-star text-mint text-sm"></i>
                  <span className="text-sm text-charcoal">Consistent practice</span>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-book text-mint text-sm"></i>
                  <span className="text-sm text-charcoal">Thoughtful reflections</span>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-heart text-mint text-sm"></i>
                  <span className="text-sm text-charcoal">Self-compassion moments</span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Week Intentions */}
          <div className="bg-sage/5 rounded-lg p-6 border border-sage/20">
            <h3 className="text-lg font-semibold text-sage mb-4">Setting Intentions for Next Week</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  What do you want to cultivate?
                </label>
                <Textarea
                  placeholder="Plant seeds for the coming week..."
                  value={reviewData.nextWeekCultivate || ''}
                  onChange={(e) => setReviewData({ ...reviewData, nextWeekCultivate: e.target.value })}
                  data-testid="textarea-next-cultivate"
                  className="bg-warmwhite border-sage/30 focus:border-forest font-crimson"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  How can you support yourself better?
                </label>
                <Textarea
                  placeholder="Consider ways to nurture your growth..."
                  value={reviewData.nextWeekSupport || ''}
                  onChange={(e) => setReviewData({ ...reviewData, nextWeekSupport: e.target.value })}
                  data-testid="textarea-next-support"
                  className="bg-warmwhite border-sage/30 focus:border-forest font-crimson"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center space-x-4">
        <Button
          onClick={handleSave}
          disabled={saveReviewMutation.isPending}
          data-testid="button-save-review"
          className="bg-forest text-warmwhite hover:bg-emerald px-8 py-3"
        >
          Save Weekly Review <Save className="w-4 h-4 ml-2" />
        </Button>
        <Button
          onClick={handleStartNewWeek}
          data-testid="button-start-new-week"
          className="bg-sage text-warmwhite hover:bg-emerald px-8 py-3"
        >
          Begin New Week <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
