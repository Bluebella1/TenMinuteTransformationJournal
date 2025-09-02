import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Sparkles, Leaf, User, Clock, Award, BookOpen, Target, Heart, Lightbulb, Flower } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OnboardingPage {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: string;
  color: string;
}

const onboardingPages: OnboardingPage[] = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Welcome to Your Journal',
    content: 'Your personal space for building self-respect through 10-minute daily commitments.',
    color: 'forest'
  },
  {
    id: 'simple',
    icon: Clock,
    title: 'Simple & Gentle',
    content: 'Just 10 minutes a day. No pressure, no perfect streaks. Just showing up for yourself.',
    color: 'emerald'
  },
  {
    id: 'how-it-works',
    icon: Target,
    title: 'How It Works',
    content: 'Set weekly goals, track daily energy, and reflect with kindness. That\'s it.',
    color: 'sage'
  },
  {
    id: 'ready',
    icon: BookOpen,
    title: 'Ready to Begin?',
    content: 'Start with Goals to set your intentions, then use Daily to track your journey.',
    color: 'mint'
  }
];

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentPage, setCurrentPage] = useState(0);
  
  // Force cache bust for onboarding content
  const cacheKey = Date.now();

  const nextPage = () => {
    if (currentPage < onboardingPages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };


  const handleComplete = () => {
    localStorage.setItem('tenMinuteTransformation_onboardingComplete', 'true');
    onClose();
  };

  if (!isOpen) return null;

  const currentPageData = onboardingPages[currentPage];
  const IconComponent = currentPageData.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div 
        className="bg-warmwhite rounded-3xl page-shadow max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden relative"
        data-testid="onboarding-modal"
        style={{ margin: '8px', maxWidth: 'calc(100vw - 16px)' }}
        key={`onboarding-${cacheKey}`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          data-testid="button-close-onboarding"
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-cream/80 hover:bg-cream transition-colors"
        >
          <X className="w-5 h-5 text-charcoal" />
        </button>

        {/* Page Content */}
        <div className="p-8 text-center min-h-[500px] flex flex-col justify-center">
          {/* Icon */}
          <div className="mb-6">
            <IconComponent className="w-16 h-16 text-forest opacity-80 mx-auto" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-serif font-semibold text-forest mb-6" data-testid={`onboarding-title-${currentPageData.id}`}>
            {currentPageData.title}
          </h2>

          {/* Content */}
          <p className="text-sage leading-relaxed font-serif text-lg mb-8 flex-1 flex items-center justify-center" data-testid={`onboarding-content-${currentPageData.id}`}>
            {currentPageData.content}
          </p>

          {/* Begin Journey Button (on final page) */}
          {currentPage === onboardingPages.length - 1 && (
            <div className="flex justify-center mb-6 px-4">
              <Button
                onClick={handleComplete}
                data-testid="button-complete-onboarding"
                className="bg-forest text-warmwhite hover:bg-emerald px-6 py-3 sm:px-10 sm:py-4 rounded-full text-sm sm:text-base font-medium w-full max-w-[240px] sm:min-w-[160px] shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1.5rem, 6vw, 2.5rem)',
                  minHeight: '48px'
                }}
              >
                Begin Journey
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              data-testid="button-prev-page"
              className={`p-3 rounded-full transition-all duration-300 ${
                currentPage === 0 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-sage/10 text-sage'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Page Indicators - FORCED NEW DESIGN */}
            <div className="flex items-center" style={{ gap: '12px' }}>
              {onboardingPages.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: index === currentPage ? '12px' : '10px',
                    height: index === currentPage ? '12px' : '10px',
                    borderRadius: '50%',
                    border: '2px solid',
                    borderColor: index === currentPage ? 'hsl(149, 38%, 20%)' : 'hsl(140, 27%, 52%, 0.6)',
                    backgroundColor: index === currentPage ? 'hsl(149, 38%, 20%)' : 'transparent',
                    boxShadow: index === currentPage ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.5s ease',
                    cursor: 'pointer'
                  }}
                  data-testid={`onboarding-indicator-${index}`}
                />
              ))}
            </div>

            {/* Next Button (only on non-final pages) */}
            {currentPage < onboardingPages.length - 1 ? (
              <button
                onClick={nextPage}
                data-testid="button-next-page"
                className="p-3 rounded-full hover:bg-sage/10 text-sage transition-all duration-300"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            ) : (
              <div className="w-[60px]"></div> // Spacer to maintain layout balance
            )}
          </div>
        </div>

      </div>
    </div>
  );
}