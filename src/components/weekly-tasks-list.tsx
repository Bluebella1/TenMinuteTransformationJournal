import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Task, InsertTask, DailyEntry, WeeklyIntention, InsertWeeklyIntention } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Check, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek } from "date-fns";
import GrowthTree from "@/components/growth-tree";

export default function WeeklyTasksList() {
  const { toast } = useToast();
  const today = new Date();
  const weekStart = format(new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1), 'yyyy-MM-dd');
  
  const [newTask, setNewTask] = useState<Partial<InsertTask>>({
    title: '',
    description: '',
    weekStart,
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [swipingTask, setSwipingTask] = useState<string | null>(null);
  const touchStartX = useRef<number>(0);
  const [weeklyIntentions, setWeeklyIntentions] = useState('');

  // Get all tasks for management
  const { data: allTasks, isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks-all'],
  });

  // Separate current week tasks from other tasks
  const currentWeekTasks = allTasks?.filter(task => task.weekStart === weekStart) || [];
  const otherTasks = allTasks?.filter(task => task.weekStart !== weekStart) || [];

  // Get daily entries for the week to calculate growth
  const weekEnd = format(new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7), 'yyyy-MM-dd');
  const { data: weekEntries } = useQuery<DailyEntry[]>({
    queryKey: ['/api/daily-week', weekStart, weekEnd],
  });

  // Get all entries to calculate months active
  const { data: allEntries } = useQuery<DailyEntry[]>({
    queryKey: ['/api/daily-all'],
  });

  // Get weekly intentions
  const { data: weeklyIntentionsData } = useQuery<WeeklyIntention>({
    queryKey: ['/api/weekly-intentions', weekStart],
  });

  // Update intentions state when data loads
  useEffect(() => {
    if (weeklyIntentionsData?.intentions) {
      setWeeklyIntentions(weeklyIntentionsData.intentions);
    }
  }, [weeklyIntentionsData]);

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

  const createTaskMutation = useMutation({
    mutationFn: (task: InsertTask) => apiRequest('POST', '/api/tasks', task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks-all'] });
      setNewTask({
        title: '',
        description: '',
        weekStart,
      });
      toast({
        title: "✨ Task planted!",
        description: "Your goal is now growing in your garden. Take your first 10-minute step when you're ready.",
      });
    },
    onError: () => {
      toast({
        title: "Couldn't add task",
        description: "Something went wrong while saving your task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, task }: { id: string; task: Partial<InsertTask> }) =>
      apiRequest('PUT', `/api/tasks/${id}`, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks-all'] });
      setEditingTask(null);
      toast({
        title: "Task updated",
        description: "Your changes have been saved and your growth continues.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "We couldn't save your changes. Please try editing again.",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks-all'] });
      toast({
        title: "Task removed",
        description: "Sometimes letting go creates space for what truly matters.",
      });
    },
    onError: () => {
      toast({
        title: "Couldn't remove task",
        description: "There was an issue removing your task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveIntentionsMutation = useMutation({
    mutationFn: (intentions: string) => {
      if (weeklyIntentionsData?.id) {
        // Update existing intentions
        return apiRequest('PUT', `/api/weekly-intentions/${weeklyIntentionsData.id}`, {
          intentions
        });
      } else {
        // Create new intentions
        return apiRequest('POST', '/api/weekly-intentions', {
          weekStart,
          intentions
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-intentions', weekStart] });
      toast({
        title: "✨ Intentions saved!",
        description: "Your weekly intentions have been captured for reflection.",
      });
    },
    onError: () => {
      toast({
        title: "Couldn't save intentions",
        description: "Something went wrong while saving your intentions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => 
      apiRequest('PATCH', `/api/tasks/${id}/complete`, { completed }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks-all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-week', weekStart, weekEnd] });
      
      if (variables.completed) {
        toast({
          title: "🌸 Task completed!",
          description: "Your progress helps your garden grow. Check the Reflect section to see your tree bloom!",
        });
        
        // Add gentle celebration effect
        setTimeout(() => {
          const element = document.querySelector(`[data-testid="task-${variables.id}"]`);
          if (element) {
            element.classList.add('task-complete-pulse');
            setTimeout(() => element.classList.remove('task-complete-pulse'), 600);
          }
        }, 100);
      }
    },
  });

  const handleCreateTask = () => {
    if (!newTask.title?.trim()) {
      toast({
        title: "Task needs a title",
        description: "What would you like to work on? Give your task a meaningful name.",
        variant: "destructive",
      });
      return;
    }
    
    if (newTask.title.trim().length < 3) {
      toast({
        title: "Make it more specific",
        description: "Your task title should be at least 3 characters to be meaningful.",
        variant: "destructive",
      });
      return;
    }
    
    createTaskMutation.mutate({
      ...newTask,
      title: newTask.title.trim(),
      description: newTask.description?.trim() || ''
    } as InsertTask);
  };

  const handleUpdateTask = () => {
    if (!editingTask) return;
    updateTaskMutation.mutate({ id: editingTask.id, task: editingTask });
  };

  const handleToggleComplete = (task: Task) => {
    completeTaskMutation.mutate({ 
      id: task.id, 
      completed: !task.isCompleted
    });
  };

  const handleSaveIntentions = () => {
    if (weeklyIntentions.trim()) {
      saveIntentionsMutation.mutate(weeklyIntentions.trim());
    }
  };

  const handleTouchStart = (e: React.TouchEvent, taskId: string) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent, taskId: string) => {
    if (!touchStartX.current) return;
    
    const currentX = e.touches[0].clientX;
    const diffX = currentX - touchStartX.current;
    
    // Show swipe indicator if swiping right more than 50px
    if (diffX > 50) {
      setSwipingTask(taskId);
    } else {
      setSwipingTask(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, task: Task) => {
    if (!touchStartX.current) return;
    
    const endX = e.changedTouches[0].clientX;
    const diffX = endX - touchStartX.current;
    
    // Complete task if swiped right more than 100px
    if (diffX > 100 && !task.isCompleted) {
      handleToggleComplete(task);
    }
    
    touchStartX.current = 0;
    setSwipingTask(null);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-sage/20 rounded w-1/2"></div>
        <div className="h-32 bg-sage/20 rounded"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-sage/20 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-semibold text-forest mb-2" data-testid="tasks-title">
          Tasks & Goals
        </h2>
        <p className="text-sage font-serif italic">Things you want to accomplish - the app will help you break them into 10-minute steps</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Add New Task */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-sage/10">
            <h3 className="text-lg font-medium text-forest mb-4 font-serif">Add New Task</h3>
            <div className="space-y-4">
              <Input
                placeholder="e.g., Write chapter one, organize workspace, learn new skill..."
                value={newTask.title || ''}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                data-testid="input-task-title"
                className="bg-white border-0 focus:ring-2 focus:ring-sage/30 rounded-xl shadow-sm"
              />
              <Button
                onClick={handleCreateTask}
                disabled={createTaskMutation.isPending}
                data-testid="button-add-task"
                className="bg-forest text-warmwhite hover:bg-emerald rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createTaskMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-warmwhite mr-2"></div>
                    Planting...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Weekly Intentions */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-sage/10">
            <h3 className="text-lg font-medium text-forest mb-4 font-serif">Weekly Intentions</h3>
            <p className="text-sm text-sage font-serif italic mb-4">
              Set your deeper intentions for this week - what mindset or energy do you want to cultivate?
            </p>
            <div className="space-y-4">
              <Textarea
                placeholder="e.g., I intend to approach challenges with patience and curiosity this week..."
                value={weeklyIntentions}
                onChange={(e) => setWeeklyIntentions(e.target.value)}
                data-testid="textarea-weekly-intentions"
                className="bg-white border-0 focus:ring-2 focus:ring-sage/30 rounded-xl shadow-sm min-h-[100px] font-serif"
                rows={4}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-sage/70">
                  {weeklyIntentions.length}/500 characters
                </span>
                <Button
                  onClick={handleSaveIntentions}
                  disabled={saveIntentionsMutation.isPending || !weeklyIntentions.trim()}
                  data-testid="button-save-intentions"
                  className="bg-sage text-warmwhite hover:bg-forest rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  size="sm"
                >
                  {saveIntentionsMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-warmwhite mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Intentions'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            {currentWeekTasks?.length === 0 ? (
              <div className="text-center py-12 text-sage bg-white rounded-2xl border border-sage/10">
                <div className="w-16 h-16 mx-auto mb-4 bg-mint/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-seedling text-2xl text-mint"></i>
                </div>
                <h3 className="font-serif text-xl text-forest mb-2">Ready to plant some seeds?</h3>
                <p className="text-sm mb-4 max-w-md mx-auto">
                  Your weekly tasks are like seeds in your growth garden. Start by adding something meaningful you'd like to work on this week.
                </p>
                <p className="text-xs text-sage/80 italic">
                  The app will automatically suggest 10-minute activities based on your goals
                </p>
              </div>
            ) : (
              currentWeekTasks?.map((task: Task) => (
                <div 
                  key={task.id} 
                  className={`relative bg-white rounded-2xl p-4 shadow-lg border border-sage/10 transition-all duration-300 gentle-hover ${
                    task.isCompleted ? 'opacity-70 bg-emerald/5 border-emerald/20' : ''
                  } ${task.isCompleted ? 'transform scale-95' : ''} ${
                    swipingTask === task.id ? 'transform translate-x-2 bg-emerald/10 border-emerald/30' : ''
                  } ${completeTaskMutation.isPending ? 'task-complete-pulse' : ''}`}
                  data-testid={`task-${task.id}`}
                  onTouchStart={(e) => handleTouchStart(e, task.id)}
                  onTouchMove={(e) => handleTouchMove(e, task.id)}
                  onTouchEnd={(e) => handleTouchEnd(e, task)}
                >
                  {editingTask?.id === task.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editingTask.title}
                        onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                        className="bg-white border-0 focus:ring-2 focus:ring-sage/30 rounded-xl"
                      />
                      <Textarea
                        value={editingTask.description || ''}
                        onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                        className="bg-white border-0 focus:ring-2 focus:ring-sage/30 rounded-xl font-serif"
                      />
                      <div className="flex space-x-2">
                        <Button onClick={handleUpdateTask} size="sm" className="bg-sage text-warmwhite hover:bg-forest rounded-xl">
                          Save
                        </Button>
                        <Button onClick={() => setEditingTask(null)} size="sm" variant="outline" className="rounded-xl">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2 flex-1">
                        <div className="flex-1">
                          <h4 className={`font-medium ${task.isCompleted ? 'line-through text-sage' : 'text-forest'}`} data-testid={`text-task-title-${task.id}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className={`text-sm mt-1 font-serif italic ${task.isCompleted ? 'line-through text-sage' : 'text-sage'}`}>
                              {task.description}
                            </p>
                          )}
                          {!task.isCompleted && (
                            <p className="text-xs text-sage mt-2 opacity-60">
                              💡 Swipe right to complete or tap the circle
                            </p>
                          )}
                        </div>
                      </div>
                      {swipingTask === task.id && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-emerald">
                          <ChevronRight className="w-6 h-6 animate-pulse" />
                          <span className="text-xs font-medium">Complete</span>
                        </div>
                      )}
                      <div className="flex space-x-2">
                        {!task.isCompleted && (
                          <Edit 
                            onClick={() => setEditingTask(task)}
                            data-testid={`button-edit-${task.id}`}
                            className="w-3 h-3 text-sage hover:text-forest transition-colors cursor-pointer"
                          />
                        )}
                        <Trash2 
                          onClick={() => deleteTaskMutation.mutate(task.id)}
                          data-testid={`button-delete-${task.id}`}
                          className="w-3 h-3 text-sage hover:text-red-400 transition-colors cursor-pointer"
                          title={task.isCompleted ? "Remove completed task" : "Delete task"}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Past/Other Tasks */}
          {otherTasks.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-serif font-medium text-forest mb-4">Past Goals & Tasks</h3>
              <div className="space-y-3">
                {otherTasks.map((task: Task) => (
                  <div 
                    key={task.id} 
                    className={`relative bg-white rounded-xl p-4 shadow-sm border border-sage/10 transition-all duration-300 ${
                      task.isCompleted ? 'opacity-60 bg-emerald/5 border-emerald/20' : ''
                    }`}
                    data-testid={`task-${task.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <div className="flex-1">
                          <h4 className={`font-medium text-sm ${task.isCompleted ? 'line-through text-sage' : 'text-forest'}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className={`text-xs mt-1 font-serif italic ${task.isCompleted ? 'line-through text-sage' : 'text-sage'}`}>
                              {task.description}
                            </p>
                          )}
                          <p className="text-xs text-sage/70 mt-1">
                            Week of {format(new Date(task.weekStart), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {!task.isCompleted && (
                          <button
                            onClick={() => setEditingTask(task)}
                            data-testid={`button-edit-${task.id}`}
                            className="text-sage hover:text-forest transition-colors p-0"
                          >
                            <Edit className="w-1.5 h-1.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteTaskMutation.mutate(task.id)}
                          data-testid={`button-delete-${task.id}`}
                          className="text-sage hover:text-red-400 transition-colors p-0"
                          title={task.isCompleted ? "Remove completed task" : "Delete task"}
                        >
                          <Trash2 className="w-1.5 h-1.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="font-medium text-forest mb-4 font-serif">Your Growing Tree</h3>
            <GrowthTree 
              promisesKept={weekEntries?.filter(entry => 
                entry && 
                entry.promiseKept === 'yes' && 
                (entry.morningIntention || entry.eveningReflection || entry.energyLevel)
              ).length || 0}
              totalPromises={weekEntries?.filter(entry => 
                entry && 
                (entry.morningIntention || entry.eveningReflection || entry.energyLevel)
              ).length || 0}
              completedTasks={allTasks?.filter(task => task && task.isCompleted && task.isActive !== false).length || 0}
              growthLevel={Math.min(5, Math.max(1, Math.ceil(((weekEntries?.filter(entry => 
                entry && 
                entry.promiseKept === 'yes' && 
                (entry.morningIntention || entry.eveningReflection || entry.energyLevel)
              ).length || 0) / Math.max(weekEntries?.filter(entry => 
                entry && 
                (entry.morningIntention || entry.eveningReflection || entry.energyLevel)
              ).length || 1, 1)) * 5)))}
              monthsActive={calculateMonthsActive()}
              size="small"
            />
            <p className="text-xs text-sage font-serif italic text-center mt-3">
              "Small steps create big transformations"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}