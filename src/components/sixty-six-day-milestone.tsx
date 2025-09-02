import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Heart, Sparkles } from "lucide-react";

interface SixtySixDayMilestoneProps {
  isOpen: boolean;
  onClose: () => void;
  consecutiveDays: number;
}

export default function SixtySixDayMilestone({ isOpen, onClose, consecutiveDays }: SixtySixDayMilestoneProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const reflectionSteps = [
    {
      question: "What feels more natural now?",
      subtitle: "Notice the gentle shifts that have become part of you"
    },
    {
      question: "What small shifts have become daily?",
      subtitle: "Honor the tiny transformations that now flow effortlessly"
    },
    {
      question: "How have you grown into a deeper version of yourself?",
      subtitle: "Recognize the profound journey of becoming"
    }
  ];

  const handleNext = () => {
    if (currentStep < reflectionSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('tenMinuteTransformation_66DayMilestone', 'celebrated');
    onClose();
  };

  if (!isOpen) return null;

  const currentReflection = reflectionSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-warmwhite rounded-3xl page-shadow max-w-lg w-full max-h-[90vh] overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          data-testid="button-close-milestone"
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-cream/80 hover:bg-cream transition-colors"
        >
          <X className="w-5 h-5 text-charcoal" />
        </button>

        {/* Header Section */}
        <div className="bg-gradient-to-b from-forest/5 to-emerald/5 p-8 text-center border-b border-sage/10">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-forest to-emerald rounded-full flex items-center justify-center">
                <Heart className="w-10 h-10 text-warmwhite" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-serif font-semibold text-forest mb-3">
            Honor the 66-Day Momentum
          </h1>
          
          <div className="inline-flex items-center space-x-2 bg-sage/10 rounded-full px-4 py-2 mb-4">
            <div className="w-2 h-2 bg-emerald rounded-full animate-pulse"></div>
            <span className="text-forest font-semibold">{consecutiveDays} consecutive days</span>
          </div>
          
          <p className="text-charcoal font-elegant leading-relaxed">
            Day 66 is your first major milestone. Take a moment to reflect:
          </p>
        </div>

        {/* Reflection Section */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-semibold text-forest mb-4">
              {currentReflection.question}
            </h2>
            <p className="text-sage font-elegant italic">
              {currentReflection.subtitle}
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center space-x-3 mb-8">
            {reflectionSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'bg-forest w-8' 
                    : index < currentStep 
                      ? 'bg-emerald' 
                      : 'bg-sage/30'
                }`}
              />
            ))}
          </div>

          {/* Reflection Space */}
          <div className="bg-cream/30 rounded-2xl p-6 mb-8 border border-sage/10">
            <div className="h-24 flex items-center justify-center">
              <p className="text-charcoal/60 font-elegant italic text-center leading-relaxed">
                Take a quiet moment to feel into this question...
                <br />
                <span className="text-sm">Honor whatever arises within you</span>
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-sage font-elegant">
              {currentStep + 1} of {reflectionSteps.length}
            </div>
            
            <Button
              onClick={handleNext}
              className="bg-forest text-warmwhite hover:bg-emerald px-6 py-2 rounded-full font-serif"
              data-testid="button-next-reflection"
            >
              {currentStep < reflectionSteps.length - 1 ? 'Continue' : 'Honor This Moment'}
            </Button>
          </div>
        </div>

        {/* Footer Message */}
        <div className="bg-gradient-to-t from-mint/5 to-transparent p-6 text-center border-t border-sage/10">
          <p className="text-sm text-charcoal font-elegant italic leading-relaxed">
            This is not about achievement—it's about honoring your own consistency and integrity.
          </p>
        </div>
      </div>
    </div>
  );
}