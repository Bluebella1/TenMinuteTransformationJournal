import { useState, useEffect } from "react";
import ChapterNav from "@/components/chapter-nav";
import SwipeableWelcome from "@/components/swipeable-welcome";
import WeeklyTasksList from "@/components/weekly-tasks-list";
import DailyJournalPage from "@/components/daily-journal-page";
import ReflectAndReview from "@/components/reflect-and-review";
import JournalLog from "@/components/journal-log";
import OnboardingModal from "@/components/onboarding-modal";
import HelpModal from "@/components/help-modal";

export type Chapter = 'welcome' | 'goals' | 'daily' | 'reflect' | 'journal';

export default function Home() {
  // Start new users on welcome page, returning users on goals page
  const [activeChapter, setActiveChapter] = useState<Chapter>(() => {
    const hasSeenOnboarding = localStorage.getItem('tenMinuteTransformation_onboardingComplete');
    return hasSeenOnboarding ? 'goals' : 'welcome';
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // Clear old onboarding to force showing new slides
    localStorage.removeItem('tenMinuteTransformation_onboardingComplete');
    setShowOnboarding(true);
  }, []);

  const [nextChapter, setNextChapter] = useState<Chapter | null>(null);

  const handleChapterChange = (newChapter: Chapter) => {
    if (newChapter === activeChapter || isTransitioning) return;
    
    setIsTransitioning(true);
    setNextChapter(newChapter);
    
    // Add elegant fade transition
    const pageElement = document.querySelector('.journal-page');
    if (pageElement) {
      pageElement.classList.add('fade-out');
    }
    
    // Complete transition with elegant timing
    setTimeout(() => {
      setActiveChapter(newChapter);
      setNextChapter(null);
      setIsTransitioning(false);
      
      if (pageElement) {
        pageElement.classList.remove('fade-out');
        pageElement.classList.add('fade-in');
        
        setTimeout(() => {
          pageElement.classList.remove('fade-in');
        }, 400);
      }
    }, 200);
  };

  const renderChapterContent = () => {
    switch (activeChapter) {
      case 'welcome':
        return <SwipeableWelcome onBeginJourney={() => handleChapterChange('goals')} />;
      case 'goals':
        return <WeeklyTasksList />;
      case 'daily':
        return <DailyJournalPage />;
      case 'reflect':
        return <ReflectAndReview />;
      case 'journal':
        return <JournalLog />;
      default:
        return <SwipeableWelcome onBeginJourney={() => handleChapterChange('goals')} />;
    }
  };

  return (
    <div 
      className="min-h-screen font-crimson" 
      style={{ backgroundColor: 'var(--background)' }}
      key={`refresh-${Date.now()}`}>
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => {
          setShowOnboarding(false);
          // After completing onboarding, navigate to goals page
          handleChapterChange('goals');
        }} 
      />
      
      <HelpModal 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
      
      <ChapterNav 
        activeChapter={activeChapter} 
        onChapterChange={handleChapterChange} 
        onShowHelp={() => setShowHelp(true)}
      />
      
      {/* Professional Journal Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 device-transition">
        <div className={`journal-page card-elevated journal-texture p-6 sm:p-8 md:p-10 lg:p-12 mb-8 relative device-transition ${isTransitioning ? 'chapter-transition' : ''}`}>
          {/* Content */}
          <div className="device-transition">
            {renderChapterContent()}
          </div>
        </div>
      </div>

      <footer className="text-white py-12 mt-16 shadow-deep" style={{ backgroundColor: 'var(--primary-green)' }}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <i className="fas fa-seedling text-mint text-xl"></i>
            <span className="font-serif italic">Growing in alignment, one step at a time</span>
          </div>
          <p className="text-sage text-sm">
            Your transformation is sacred. Your data stays private on your device.
          </p>
        </div>
      </footer>
    </div>
  );
}
