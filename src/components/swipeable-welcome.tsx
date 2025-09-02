import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Leaf, User, Clock, Award, BookOpen, Brain } from "lucide-react";

interface SwipeableWelcomeProps {
  onBeginJourney: () => void;
}

interface WelcomePage {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: string;
  color: string;
}

const welcomePages: WelcomePage[] = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Welcome to TenMinuteTransformation',
    content: 'Your sacred space for the journey to your higher self and true alignment. Each moment here is designed to guide you toward authentic transformation.',
    color: 'forest'
  },
  {
    id: 'purpose',
    icon: Leaf,
    title: 'Your Purpose',
    content: 'This journal exists to guide you on your journey to your higher self and true alignment. Each 10-minute commitment is a sacred step toward becoming who you\'re meant to be.',
    color: 'emerald'
  },
  {
    id: 'philosophy',
    icon: User,
    title: 'The Philosophy',
    content: 'Transformation occurs through small, consistent actions aligned with your authentic self. Each mindful step builds the bridge to your higher potential.',
    color: 'sage'
  },
  {
    id: 'why-ten',
    icon: Clock,
    title: 'Why 10 Minutes?',
    content: 'Ten minutes is the perfect balance—long enough to create meaningful change, short enough to honor your busy life. Gentle, consistent practice creates lasting transformation from within.',
    color: 'mint'
  },
  {
    id: 'science',
    icon: Brain,
    title: 'The Science of 66 Days',
    content: 'University College London research shows it takes an average of 66 days to form a new habit. Your brain literally rewires itself through consistent practice, making positive changes feel natural and automatic.',
    color: 'emerald'
  },
  {
    id: 'reward',
    icon: Award,
    title: 'The True Reward',
    content: 'The greatest reward is inner peace and self-trust. As you align with your true self, you discover the unshakeable confidence that comes from authentic living.',
    color: 'forest'
  },
  {
    id: 'journey',
    icon: BookOpen,
    title: 'Your Journey Begins',
    content: 'Set weekly tasks, receive daily 10-minute activities, reflect on your growth, and celebrate your progress. Every step is sacred in your transformation.',
    color: 'emerald'
  }
];

export default function SwipeableWelcome({ onBeginJourney }: SwipeableWelcomeProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-progression every 4 seconds with looping
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPage((prev) => {
          return (prev + 1) % welcomePages.length; // Loop back to 0 after last page
        });
        setIsTransitioning(false);
      }, 400); // Half the animation duration
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextPage = () => {
    setIsAutoPlaying(false);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage((prev) => (prev + 1) % welcomePages.length);
      setIsTransitioning(false);
    }, 400);
  };

  const prevPage = () => {
    setIsAutoPlaying(false);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage((prev) => (prev - 1 + welcomePages.length) % welcomePages.length);
      setIsTransitioning(false);
    }, 400);
  };


  const currentPageData = welcomePages[currentPage];
  const IconComponent = currentPageData.icon;

  return (
    <div className="fade-in h-full flex flex-col relative">
      
      <div 
        className="flex-1 flex flex-col justify-center items-center text-center px-6 py-8"
        data-testid={`welcome-page-${currentPageData.id}`}
      >
        {/* Icon */}
        <div className="mb-8">
          <IconComponent className="w-20 h-20 text-forest opacity-80" />
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-semibold text-forest mb-6 sm:mb-8 leading-tight max-w-2xl mx-auto px-2" data-testid={`welcome-title-${currentPageData.id}`}>
          {currentPageData.title}
        </h2>

        {/* Content */}
        <p className="text-sage leading-relaxed font-elegant text-lg sm:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto px-2" data-testid={`welcome-content-${currentPageData.id}`}>
          {currentPageData.content}
        </p>
        

        {/* Show journey steps on last page */}
        {currentPage === welcomePages.length - 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 max-w-4xl mx-auto px-2">
            <div className="text-center">
              <div className="w-12 h-12 bg-forest rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-warmwhite font-semibold">1</span>
              </div>
              <h4 className="font-semibold text-forest mb-2 font-serif">Set Tasks</h4>
              <p className="text-sm text-sage font-elegant">Weekly goals for growth</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-forest rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-warmwhite font-semibold">2</span>
              </div>
              <h4 className="font-semibold text-forest mb-2 font-serif">Daily Practice</h4>
              <p className="text-sm text-sage font-elegant">10-minute activities</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-forest rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-warmwhite font-semibold">3</span>
              </div>
              <h4 className="font-semibold text-forest mb-2 font-serif">Reflect</h4>
              <p className="text-sm text-sage font-elegant">Journal your journey</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-forest rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-warmwhite font-semibold">4</span>
              </div>
              <h4 className="font-semibold text-forest mb-2 font-serif">Celebrate</h4>
              <p className="text-sm text-sage font-elegant">Honor your progress</p>
            </div>
          </div>
        )}

        {/* Begin Journey Button - only on last page */}
        {currentPage === welcomePages.length - 1 && (
          <div className="px-4 sm:px-6">
            <button 
              onClick={onBeginJourney}
              data-testid="button-begin-journey"
              className="bg-forest text-warmwhite px-6 py-3 sm:px-8 sm:py-4 rounded-full font-semibold hover:bg-emerald transition-all duration-300 transform hover:scale-105 shadow-lg font-serif text-sm sm:text-base md:text-lg w-full max-w-[280px] sm:max-w-xs md:max-w-sm mx-auto"
              style={{
                fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
                padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1.5rem, 6vw, 2rem)',
                minHeight: '48px'
              }}
            >
              Begin Your Sacred Journey
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Previous Button */}
        <button
          onClick={prevPage}
          data-testid="button-prev-page"
          className="p-4 rounded-full transition-all duration-300 hover:bg-sage/10 text-sage touch-manipulation active:scale-95"
          style={{ minHeight: '48px', minWidth: '48px' }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Page Indicators - FORCED INLINE STYLES */}
        <div className="flex items-center" style={{ gap: '12px' }}>
          {welcomePages.map((_, index) => (
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
              data-testid={`page-indicator-${index}`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={nextPage}
          data-testid="button-next-page"
          className="p-4 rounded-full transition-all duration-300 hover:bg-sage/10 text-sage touch-manipulation active:scale-95"
          style={{ minHeight: '48px', minWidth: '48px' }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}