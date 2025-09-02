import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Reflection, InsertReflection } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

const reflectionPrompts: ReflectionPrompt[] = [
  {
    id: 'self-promise',
    question: 'Did you keep a promise to yourself today?',
    icon: 'fas fa-question',
    color: 'forest',
    responses: {
      yes: "That's a powerful act of respect for yourself. How does it feel to notice that?",
      no: "That happens. What got in the way, and how could you support yourself better tomorrow?",
    }
  },
  {
    id: 'resistance',
    question: 'What resistance did you notice in yourself today?',
    icon: 'fas fa-seedling',
    color: 'emerald',
    responses: {
      followUp: "Resistance often points to growth edges. What might this resistance be protecting or teaching you?",
    }
  },
  {
    id: 'authenticity',
    question: 'How did you honor your authentic self today?',
    icon: 'fas fa-compass',
    color: 'sage',
    responses: {
      followUp: "Authenticity is a practice. Each genuine moment builds your inner compass.",
    }
  },
  {
    id: 'release',
    question: 'What are you ready to release or forgive?',
    icon: 'fas fa-dove',
    color: 'mint',
    responses: {
      followUp: "Release creates space for new growth. What wants to emerge in this cleared space?",
    }
  },
];

export default function ReflectionPrompts() {
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const [responses, setResponses] = useState<Record<string, { response: string; followUpResponse?: string; selectedButton?: string }>>({});

  const { data: existingReflections } = useQuery<Reflection[]>({
    queryKey: ['/api/reflections', today],
  });

  const saveReflectionMutation = useMutation({
    mutationFn: (reflection: InsertReflection) => 
      apiRequest('POST', '/api/reflections', reflection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reflections', today] });
      toast({
        title: "Reflection saved",
        description: "Your wisdom has been captured for your journey.",
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

  const getFollowUpText = (prompt: ReflectionPrompt, selectedButton?: string) => {
    if (selectedButton && prompt.responses[selectedButton as keyof typeof prompt.responses]) {
      return prompt.responses[selectedButton as keyof typeof prompt.responses];
    }
    return prompt.responses.followUp;
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-crimson font-semibold text-forest mb-2" data-testid="reflection-title">
          Deep Reflection
        </h2>
        <p className="text-sage font-crimson italic">Conversational prompts for spiritual growth and self-discovery</p>
      </div>

      <div className="space-y-8">
        {reflectionPrompts.map((prompt, index) => (
          <div key={prompt.id} className={`bg-cream/30 rounded-lg p-6 border-l-4 border-${prompt.color}`} data-testid={`prompt-${prompt.id}`}>
            <div className="flex items-start space-x-4">
              <div className={`w-10 h-10 bg-${prompt.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                <i className={`${prompt.icon} text-warmwhite`}></i>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-forest mb-3 font-crimson" data-testid={`text-prompt-${prompt.id}`}>
                  {prompt.question}
                </h3>
                <div className="space-y-4">
                  {/* Yes/No buttons for the first prompt */}
                  {prompt.id === 'self-promise' && (
                    <div className="flex space-x-4">
                      <Button
                        onClick={() => handleButtonResponse(prompt.id, 'yes')}
                        data-testid={`button-${prompt.id}-yes`}
                        className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                          responses[prompt.id]?.selectedButton === 'yes'
                            ? 'bg-emerald text-warmwhite'
                            : 'bg-emerald/80 text-warmwhite hover:bg-forest'
                        }`}
                      >
                        Yes, I did
                      </Button>
                      <Button
                        onClick={() => handleButtonResponse(prompt.id, 'no')}
                        data-testid={`button-${prompt.id}-no`}
                        className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                          responses[prompt.id]?.selectedButton === 'no'
                            ? 'bg-sage text-warmwhite'
                            : 'bg-sage/80 text-warmwhite hover:bg-forest'
                        }`}
                      >
                        No, I didn't
                      </Button>
                    </div>
                  )}
                  
                  {/* Main response area */}
                  <Textarea
                    placeholder={`Explore ${prompt.question.toLowerCase()}...`}
                    value={responses[prompt.id]?.response || ''}
                    onChange={(e) => handleTextResponse(prompt.id, e.target.value)}
                    data-testid={`textarea-${prompt.id}-response`}
                    className="bg-warmwhite border-sage/30 focus:border-forest min-h-[120px] font-crimson"
                  />
                  
                  {/* Follow-up response area */}
                  {(responses[prompt.id]?.selectedButton || prompt.responses.followUp) && (
                    <div className={`bg-${prompt.color}/5 rounded p-3`}>
                      <p className={`text-sm text-${prompt.color} font-medium mb-3`} data-testid={`text-followup-${prompt.id}`}>
                        <i className="fas fa-lightbulb mr-2"></i>
                        {getFollowUpText(prompt, responses[prompt.id]?.selectedButton)}
                      </p>
                      <Textarea
                        placeholder="Continue your reflection..."
                        value={responses[prompt.id]?.followUpResponse || ''}
                        onChange={(e) => handleFollowUpResponse(prompt.id, e.target.value)}
                        data-testid={`textarea-${prompt.id}-followup`}
                        className="bg-warmwhite border-sage/30 focus:border-forest text-sm font-crimson"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Button
          onClick={saveAllReflections}
          disabled={saveReflectionMutation.isPending}
          data-testid="button-save-reflections"
          className="bg-forest text-warmwhite hover:bg-emerald px-8 py-3"
        >
          Save Reflections <Heart className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
