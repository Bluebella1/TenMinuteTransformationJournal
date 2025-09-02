import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DailyEntry, Task, WeeklyReview, Reflection } from "@shared/schema";
import { format, parseISO } from "date-fns";
import { Calendar, Target, Lightbulb, TrendingUp, Search, Filter, BookOpen, Edit, Trash2, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface JournalEntry {
  id: string;
  date: string;
  type: 'daily' | 'task' | 'reflection' | 'review';
  title: string;
  content: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  originalData: any; // Store the original entry data for editing
}

export default function JournalLog() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch all data
  const { data: dailyEntries = [], isLoading: loadingDaily } = useQuery<DailyEntry[]>({
    queryKey: ['/api/daily-all'],
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks-all'],
  });

  const { data: reflections = [], isLoading: loadingReflections } = useQuery<Reflection[]>({
    queryKey: ['/api/reflections-all'],
  });

  const { data: reviews = [], isLoading: loadingReviews } = useQuery<WeeklyReview[]>({
    queryKey: ['/api/weekly-reviews-all'],
  });

  const isLoading = loadingDaily || loadingTasks || loadingReflections || loadingReviews;

  // Mutation functions for edit/delete
  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string, type: string }) => {
      const endpoints = {
        daily: `/api/daily-entries/${id}`,
        task: `/api/tasks/${id}`,
        reflection: `/api/reflections/${id}`,
        review: `/api/weekly-review/${id}`
      };
      return apiRequest('DELETE', endpoints[type as keyof typeof endpoints]);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks-all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reflections-all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-reviews-all'] });
      toast({
        title: "Entry deleted",
        description: "Your entry has been removed from your journal.",
      });
    },
    onError: (error, variables) => {
      console.error('Delete failed:', error, variables);
      toast({
        title: "Delete failed",
        description: "Could not delete the entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, type, data }: { id: string, type: string, data: any }) => {
      const endpoints = {
        daily: `/api/daily-entries/${id}`,
        task: `/api/tasks/${id}`,
        reflection: `/api/reflections/${id}`,
        review: `/api/weekly-review/${id}`
      };
      return apiRequest('PUT', endpoints[type as keyof typeof endpoints], data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks-all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reflections-all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-reviews-all'] });
      setEditingId(null);
      setEditData({});
      toast({
        title: "Entry updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error, variables) => {
      console.error('Edit failed:', error, variables);
      toast({
        title: "Edit failed",
        description: "Could not save your changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Convert all entries to unified format
  const allEntries: JournalEntry[] = [
    // Daily entries
    ...dailyEntries.map(entry => ({
      id: `daily-${entry.id}`,
      date: entry.date,
      type: 'daily' as const,
      title: `Daily Journal - ${format(parseISO(entry.date), 'MMMM dd, yyyy')}`,
      content: [
        entry.tenMinuteActivity && `Activity: ${entry.tenMinuteActivity}`,
        entry.eveningReflection && `Reflection: ${entry.eveningReflection}`,
        entry.followUpResponse && `Follow-up: ${entry.followUpResponse}`,
        entry.promiseKept && `Promise kept: ${entry.promiseKept}`,
        entry.voiceNotes && entry.voiceNotes.length > 0 && `Voice notes recorded`,
        entry.photos && entry.photos.length > 0 && `${entry.photos.length} photo(s) attached`
      ].filter(Boolean).join(' • '),
      icon: Calendar,
      color: 'emerald',
      originalData: entry
    })),

    // Tasks
    ...tasks.map(task => ({
      id: `task-${task.id}`,
      date: task.weekStart,
      type: 'task' as const,
      title: `Goal: ${task.description || task.title}`,
      content: `${task.isCompleted ? 'Completed' : 'In progress'} • Created for week of ${format(parseISO(task.weekStart), 'MMM dd')}`,
      icon: Target,
      color: 'forest',
      originalData: task
    })),

    // Reflections
    ...reflections.map(reflection => ({
      id: `reflection-${reflection.id}`,
      date: reflection.date,
      type: 'reflection' as const,
      title: reflection.promptText,
      content: [
        reflection.response,
        reflection.followUpResponse
      ].filter(Boolean).join(' • '),
      icon: Lightbulb,
      color: 'sage',
      originalData: reflection
    })),

    // Weekly reviews
    ...reviews.map(review => ({
      id: `review-${review.id}`,
      date: review.weekStart,
      type: 'review' as const,
      title: `Weekly Review - Week of ${format(parseISO(review.weekStart), 'MMM dd')}`,
      content: [
        review.proudActions && `Proud actions: ${review.proudActions.substring(0, 100)}...`,
        review.selfRespectMoments && `Self-respect: ${review.selfRespectMoments.substring(0, 100)}...`,
        review.patterns && `Patterns: ${review.patterns.substring(0, 100)}...`
      ].filter(Boolean).join(' • '),
      icon: TrendingUp,
      color: 'mint',
      originalData: review
    }))
  ];

  // Sort by date (newest first)
  const sortedEntries = allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter entries
  const filteredEntries = sortedEntries.filter(entry => {
    const matchesSearch = searchTerm === '' || 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || entry.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Handler functions
  const handleEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    // Initialize edit data based on entry type
    if (entry.type === 'daily') {
      setEditData({
        tenMinuteActivity: entry.originalData.tenMinuteActivity || '',
        eveningReflection: entry.originalData.eveningReflection || '',
        followUpResponse: entry.originalData.followUpResponse || ''
      });
    } else if (entry.type === 'task') {
      setEditData({
        title: entry.originalData.title || '',
        description: entry.originalData.description || ''
      });
    } else if (entry.type === 'reflection') {
      setEditData({
        response: entry.originalData.response || '',
        followUpResponse: entry.originalData.followUpResponse || ''
      });
    } else if (entry.type === 'review') {
      setEditData({
        proudActions: entry.originalData.proudActions || '',
        selfRespectMoments: entry.originalData.selfRespectMoments || '',
        patterns: entry.originalData.patterns || ''
      });
    }
  };

  const handleSaveEdit = (entry: JournalEntry) => {
    const realId = entry.id.split('-')[1]; // Remove type prefix
    editMutation.mutate({
      id: realId,
      type: entry.type,
      data: editData
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const toggleExpanded = (entryId: string) => {
    setExpandedId(expandedId === entryId ? null : entryId);
  };

  const renderDetailedContent = (entry: JournalEntry) => {
    const { originalData } = entry;
    
    if (entry.type === 'daily') {
      return (
        <div className="mt-4 p-4 bg-cream/20 rounded-lg space-y-3">
          <div className="text-xs font-medium text-sage mb-3">Daily Entry Details</div>
          
          {originalData.morningIntention && (
            <div>
              <span className="text-xs font-medium text-charcoal">Morning Intention:</span>
              <p className="text-sm text-charcoal/80 mt-1">{originalData.morningIntention}</p>
            </div>
          )}
          
          {originalData.energyLevel && (
            <div>
              <span className="text-xs font-medium text-charcoal">Energy Level:</span>
              <p className="text-sm text-charcoal/80 mt-1">{originalData.energyLevel}/10</p>
            </div>
          )}
          
          {originalData.tenMinuteActivity && (
            <div>
              <span className="text-xs font-medium text-charcoal">10-Minute Activity:</span>
              <p className="text-sm text-charcoal/80 mt-1">{originalData.tenMinuteActivity}</p>
            </div>
          )}
          
          {originalData.eveningReflection && (
            <div>
              <span className="text-xs font-medium text-charcoal">Evening Reflection:</span>
              <p className="text-sm text-charcoal/80 mt-1">{originalData.eveningReflection}</p>
            </div>
          )}
          
          {originalData.followUpResponse && (
            <div>
              <span className="text-xs font-medium text-charcoal">Follow-up Response:</span>
              <p className="text-sm text-charcoal/80 mt-1">{originalData.followUpResponse}</p>
            </div>
          )}
          
          {originalData.promiseKept && (
            <div>
              <span className="text-xs font-medium text-charcoal">Promise Kept:</span>
              <p className="text-sm text-charcoal/80 mt-1 capitalize">{originalData.promiseKept}</p>
            </div>
          )}
          
          {originalData.voiceNotes && originalData.voiceNotes.length > 0 && (
            <div>
              <span className="text-xs font-medium text-charcoal">Voice Notes:</span>
              <p className="text-sm text-charcoal/80 mt-1">{originalData.voiceNotes.length} recording(s)</p>
            </div>
          )}
          
          {originalData.photos && originalData.photos.length > 0 && (
            <div>
              <span className="text-xs font-medium text-charcoal">Photos:</span>
              <p className="text-sm text-charcoal/80 mt-1">{originalData.photos.length} photo(s) attached</p>
            </div>
          )}
        </div>
      );
    }
    
    if (entry.type === 'reflection') {
      return (
        <div className="mt-4 p-4 bg-cream/20 rounded-lg space-y-3">
          <div className="text-xs font-medium text-sage mb-3">Reflection Details</div>
          
          <div>
            <span className="text-xs font-medium text-charcoal">Prompt:</span>
            <p className="text-sm text-charcoal/80 mt-1">{originalData.promptText}</p>
          </div>
          
          {originalData.response && (
            <div>
              <span className="text-xs font-medium text-charcoal">Response:</span>
              <p className="text-sm text-charcoal/80 mt-1">{originalData.response}</p>
            </div>
          )}
          
          {originalData.followUpResponse && (
            <div>
              <span className="text-xs font-medium text-charcoal">Follow-up:</span>
              <p className="text-sm text-charcoal/80 mt-1">{originalData.followUpResponse}</p>
            </div>
          )}
        </div>
      );
    }
    
    if (entry.type === 'review') {
      return (
        <div className="mt-4 p-4 bg-cream/20 rounded-lg space-y-3">
          <div className="text-xs font-medium text-sage mb-3">Weekly Review Details</div>
          
          {originalData.proudActions && (
            <div>
              <span className="text-xs font-medium text-charcoal">Proud Actions:</span>
              <p className="text-sm text-charcoal/80 mt-1">{originalData.proudActions}</p>
            </div>
          )}
          
          {originalData.selfRespectMoments && (
            <div>
              <span className="text-xs font-medium text-charcoal">Self-Respect Moments:</span>
              <p className="text-sm text-charcoal/80 mt-1">{originalData.selfRespectMoments}</p>
            </div>
          )}
          
          {originalData.patterns && (
            <div>
              <span className="text-xs font-medium text-charcoal">Patterns Noticed:</span>
              <p className="text-sm text-charcoal/80 mt-1">{originalData.patterns}</p>
            </div>
          )}
          
          {originalData.nextWeekCultivate && (
            <div>
              <span className="text-xs font-medium text-charcoal">Next Week - Cultivate:</span>
              <p className="text-sm text-charcoal/80 mt-1">{originalData.nextWeekCultivate}</p>
            </div>
          )}
          
          {originalData.nextWeekSupport && (
            <div>
              <span className="text-xs font-medium text-charcoal">Next Week - Support:</span>
              <p className="text-sm text-charcoal/80 mt-1">{originalData.nextWeekSupport}</p>
            </div>
          )}
          
          {originalData.growthLevel && (
            <div>
              <span className="text-xs font-medium text-charcoal">Growth Level:</span>
              <p className="text-sm text-charcoal/80 mt-1">{originalData.growthLevel}/10</p>
            </div>
          )}
        </div>
      );
    }
    
    if (entry.type === 'task') {
      return (
        <div className="mt-4 p-4 bg-cream/20 rounded-lg space-y-3">
          <div className="text-xs font-medium text-sage mb-3">Goal Details</div>
          
          <div>
            <span className="text-xs font-medium text-charcoal">Title:</span>
            <p className="text-sm text-charcoal/80 mt-1">{originalData.title}</p>
          </div>
          
          {originalData.description && (
            <div>
              <span className="text-xs font-medium text-charcoal">Description:</span>
              <p className="text-sm text-charcoal/80 mt-1">{originalData.description}</p>
            </div>
          )}
          
          <div>
            <span className="text-xs font-medium text-charcoal">Status:</span>
            <p className="text-sm text-charcoal/80 mt-1">{originalData.isCompleted ? 'Completed' : 'In Progress'}</p>
          </div>
          
          <div>
            <span className="text-xs font-medium text-charcoal">Week:</span>
            <p className="text-sm text-charcoal/80 mt-1">{format(parseISO(originalData.weekStart), 'MMM dd, yyyy')}</p>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const handleDelete = (entry: JournalEntry) => {
    if (confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      // Use the ID from the original data instead of parsing the prefixed ID
      const realId = entry.originalData.id;
      deleteMutation.mutate({
        id: realId,
        type: entry.type
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-emerald/10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-forest font-crimson mb-2">Loading Your Journal</h2>
          <p className="text-sage italic">Gathering all your entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-emerald/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-emerald" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-forest font-crimson mb-2">Your Journal Log</h2>
        <p className="text-sage italic">A complete view of your transformation journey</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-gradient-to-br from-cream/30 to-warmwhite/50 rounded-2xl p-6 shadow-sm border border-sage/20">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage w-4 h-4" />
            <Input
              placeholder="Search your entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-entries"
              className="pl-10 bg-warmwhite border-sage/30 focus:border-emerald font-crimson"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-sage" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40 bg-warmwhite border-sage/30 focus:border-emerald" data-testid="select-filter-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entries</SelectItem>
                <SelectItem value="daily">Daily Journal</SelectItem>
                <SelectItem value="task">Goals</SelectItem>
                <SelectItem value="reflection">Reflections</SelectItem>
                <SelectItem value="review">Weekly Reviews</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Entry Count */}
      <div className="text-center">
        <p className="text-sm text-charcoal/70 font-crimson">
          {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} found
        </p>
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-sage" />
          </div>
          <h3 className="text-lg font-semibold text-charcoal font-crimson mb-2">
            {searchTerm || filterType !== 'all' ? 'No matching entries' : 'Your journal awaits'}
          </h3>
          <p className="text-sage italic">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter'
              : 'Start your journey by setting goals and writing daily entries'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredEntries.map((entry) => {
            const Icon = entry.icon;
            const isEditing = editingId === entry.id;
            const isExpanded = expandedId === entry.id;
            
            return (
              <div
                key={entry.id}
                className="bg-gradient-to-br from-cream/30 to-warmwhite/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-sage/20 hover:shadow-md transition-all duration-300 device-transition"
                data-testid={`entry-${entry.id}`}
              >
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-${entry.color}/10 flex items-center justify-center flex-shrink-0 mt-1`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${entry.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <h3 className="text-sm sm:text-lg font-semibold text-charcoal font-crimson leading-tight">
                        {entry.title}
                      </h3>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <span className="text-xs text-sage font-medium bg-sage/10 px-2 py-1 rounded-full">
                          {format(parseISO(entry.date), window.innerWidth < 640 ? 'MMM dd' : 'MMM dd, yyyy')}
                        </span>
                        {!isEditing && (
                          <>
                            <button
                              onClick={() => toggleExpanded(entry.id)}
                              className="p-1 sm:p-2 text-sage hover:text-emerald transition-colors touch-target-enhanced"
                              data-testid={`expand-${entry.id}`}
                              title={isExpanded ? "Show summary" : "Show full details"}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-1 sm:p-2 text-sage hover:text-emerald transition-colors touch-target-enhanced"
                              data-testid={`edit-${entry.id}`}
                              title="Edit entry"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry)}
                              className="p-1 sm:p-2 text-sage hover:text-red-500 transition-colors touch-target-enhanced"
                              data-testid={`delete-${entry.id}`}
                              title="Delete entry"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {isEditing ? (
                      <div className="space-y-4">
                        {/* Edit form based on entry type */}
                        {entry.type === 'daily' && (
                          <>
                            <div>
                              <label className="text-sm font-medium text-charcoal mb-1 block">Activity</label>
                              <Textarea
                                value={editData.tenMinuteActivity || ''}
                                onChange={(e) => setEditData({...editData, tenMinuteActivity: e.target.value})}
                                className="bg-warmwhite border-sage/30 focus:border-emerald"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-charcoal mb-1 block">Reflection</label>
                              <Textarea
                                value={editData.eveningReflection || ''}
                                onChange={(e) => setEditData({...editData, eveningReflection: e.target.value})}
                                className="bg-warmwhite border-sage/30 focus:border-emerald"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-charcoal mb-1 block">Follow-up</label>
                              <Textarea
                                value={editData.followUpResponse || ''}
                                onChange={(e) => setEditData({...editData, followUpResponse: e.target.value})}
                                className="bg-warmwhite border-sage/30 focus:border-emerald"
                              />
                            </div>
                          </>
                        )}
                        
                        {entry.type === 'task' && (
                          <>
                            <div>
                              <label className="text-sm font-medium text-charcoal mb-1 block">Title</label>
                              <Input
                                value={editData.title || ''}
                                onChange={(e) => setEditData({...editData, title: e.target.value})}
                                className="bg-warmwhite border-sage/30 focus:border-emerald"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-charcoal mb-1 block">Description</label>
                              <Textarea
                                value={editData.description || ''}
                                onChange={(e) => setEditData({...editData, description: e.target.value})}
                                className="bg-warmwhite border-sage/30 focus:border-emerald"
                              />
                            </div>
                          </>
                        )}
                        
                        {entry.type === 'reflection' && (
                          <>
                            <div>
                              <label className="text-sm font-medium text-charcoal mb-1 block">Response</label>
                              <Textarea
                                value={editData.response || ''}
                                onChange={(e) => setEditData({...editData, response: e.target.value})}
                                className="bg-warmwhite border-sage/30 focus:border-emerald"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-charcoal mb-1 block">Follow-up Response</label>
                              <Textarea
                                value={editData.followUpResponse || ''}
                                onChange={(e) => setEditData({...editData, followUpResponse: e.target.value})}
                                className="bg-warmwhite border-sage/30 focus:border-emerald"
                              />
                            </div>
                          </>
                        )}
                        
                        {entry.type === 'review' && (
                          <>
                            <div>
                              <label className="text-sm font-medium text-charcoal mb-1 block">Proud Actions</label>
                              <Textarea
                                value={editData.proudActions || ''}
                                onChange={(e) => setEditData({...editData, proudActions: e.target.value})}
                                className="bg-warmwhite border-sage/30 focus:border-emerald"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-charcoal mb-1 block">Self-Respect Moments</label>
                              <Textarea
                                value={editData.selfRespectMoments || ''}
                                onChange={(e) => setEditData({...editData, selfRespectMoments: e.target.value})}
                                className="bg-warmwhite border-sage/30 focus:border-emerald"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-charcoal mb-1 block">Patterns</label>
                              <Textarea
                                value={editData.patterns || ''}
                                onChange={(e) => setEditData({...editData, patterns: e.target.value})}
                                className="bg-warmwhite border-sage/30 focus:border-emerald"
                              />
                            </div>
                          </>
                        )}
                        
                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            onClick={() => handleSaveEdit(entry)}
                            disabled={editMutation.isPending}
                            className="bg-emerald hover:bg-emerald/90 text-white px-4 py-2"
                            data-testid={`save-${entry.id}`}
                          >
                            {editMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            variant="outline"
                            className="border-sage/30 text-charcoal hover:bg-sage/10"
                            data-testid={`cancel-${entry.id}`}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* Summary Content - Always Visible */}
                        <div 
                          className="cursor-pointer"
                          onClick={() => toggleExpanded(entry.id)}
                        >
                          <p className="text-xs sm:text-sm text-charcoal/80 font-crimson leading-relaxed mb-2">
                            {entry.content}
                          </p>
                          <div className="text-xs text-sage/70 flex items-center gap-1">
                            <span>{isExpanded ? 'Click to show summary' : 'Click to see full details'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </div>
                        </div>
                        
                        {/* Detailed Content - Expandable */}
                        <div className={`expandable-content ${isExpanded ? 'opacity-100' : 'opacity-0 max-h-0'}`}>
                          {isExpanded && renderDetailedContent(entry)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}