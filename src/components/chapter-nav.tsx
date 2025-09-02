import { Home, Target, Calendar, Lightbulb, BookOpen, HelpCircle } from "lucide-react";
import { Chapter } from "@/pages/home";

interface ChapterNavProps {
  activeChapter: Chapter;
  onChapterChange: (chapter: Chapter) => void;
  onShowHelp?: () => void;
}

export default function ChapterNav({ activeChapter, onChapterChange, onShowHelp }: ChapterNavProps) {
  
  const chapters = [
    { id: 'welcome' as Chapter, label: 'Welcome', icon: Home },
    { id: 'goals' as Chapter, label: 'Goals', icon: Target },
    { id: 'daily' as Chapter, label: 'Daily', icon: Calendar },
    { id: 'reflect' as Chapter, label: 'Reflect', icon: Lightbulb },
    { id: 'journal' as Chapter, label: 'Journal Log', icon: BookOpen },
  ];

  const handleChapterClick = (chapter: Chapter) => {
    onChapterChange(chapter);
  };

  return (
    <nav className="text-white shadow-deep" style={{ backgroundColor: 'var(--primary-green)' }}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        {/* Title Section */}
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
              <i className="fas fa-book-open text-lg sm:text-xl text-mint"></i>
            </div>
            <button 
              onClick={() => handleChapterClick('welcome')}
              className="text-xl sm:text-2xl font-crimson font-semibold text-white hover:text-white transition-colors duration-300 cursor-pointer bg-transparent border-0 p-0 m-0 outline-none focus:outline-none shadow-none focus:shadow-none" 
              data-testid="app-title"
              title="Go to Welcome page"
              style={{ backgroundColor: 'transparent !important', border: 'none !important', boxShadow: 'none !important' }}
            >
              TenMinuteTransformation
            </button>
          </div>
        </div>

        {/* Navigation Strip */}
        <div className="py-3">
          <div className="flex items-center justify-center space-x-1 sm:space-x-3 overflow-x-auto scrollbar-hide px-2">
            {chapters.map((chapter) => {
              const Icon = chapter.icon;
              return (
                <span
                  key={chapter.id}
                  onClick={() => handleChapterClick(chapter.id)}
                  data-testid={`chapter-${chapter.id}`}
                  className={`px-2 sm:px-4 py-2.5 transition-all duration-300 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-crimson font-medium whitespace-nowrap cursor-pointer ${
                    activeChapter === chapter.id
                      ? 'text-green-200'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="inline">{chapter.label}</span>
                </span>
              );
            })}
            {onShowHelp && (
              <span 
                onClick={onShowHelp}
                title="Show journal instructions"
                className="px-2 sm:px-4 py-2.5 transition-all duration-300 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-crimson font-medium whitespace-nowrap text-white/80 hover:text-white cursor-pointer"
                data-testid="button-help"
              >
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="inline">Help</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
