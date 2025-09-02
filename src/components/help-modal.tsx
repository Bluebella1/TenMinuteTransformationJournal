import { X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-warmwhite rounded-3xl page-shadow max-w-2xl w-full max-h-[90vh] overflow-hidden relative mx-2"
        style={{ maxWidth: 'calc(100vw - 16px)' }}
        data-testid="help-modal"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          data-testid="button-close-help"
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-cream/80 hover:bg-cream transition-colors"
        >
          <X className="w-5 h-5 text-charcoal" />
        </button>

        {/* Header */}
        <div className="p-8 text-center border-b border-sage/20">
          <BookOpen className="w-12 h-12 text-forest opacity-80 mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-semibold text-forest">How to Use This Journal Effectively</h2>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-96">
          <div className="space-y-6 text-sage">
            <div>
              <h3 className="font-semibold text-forest mb-3 text-lg">1. Start with Intention</h3>
              <p className="leading-relaxed">In your first week, simply notice. Use your journal to gently observe patterns, automatic responses, and moments where a 10-minute pause would shift energy.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-forest mb-3 text-lg">2. Weekly List: Your Anchor</h3>
              <p className="leading-relaxed">Each week, write up to 10 things you'd like to accomplish—big or small. No pressure—just clarity and intention. These become your daily targets. You'll pick which one gets 10 minutes today (or more, if you choose).</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-forest mb-3 text-lg">3. Daily Practice: Honor Your Word</h3>
              <p className="leading-relaxed">Each day, use one 10-minute segment to work toward something you said you'd do. Reflect on how it feels—this act of follow-through is building self-respect word by word.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-forest mb-3 text-lg">4. Reflect with Presence, Not Judgment</h3>
              <p className="leading-relaxed">Questions aren't about blame—they're about awareness. Missed it? No problem. Notice what got in the way, and what support you need tomorrow. Daily reflections help you surface the deeper currents—fear, hesitation, surprises, small shifts of courage.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-forest mb-3 text-lg">5. Build in Micro-Practices</h3>
              <p className="leading-relaxed">These mini-mindfulness moments—like a 2-minute breath, a gentle stretch, or noticing where your mind rested—create a spaciousness that sustains transformation.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-forest mb-3 text-lg">6. Celebrate the Process</h3>
              <p className="leading-relaxed">Instead of rewarding with external markers, notice how showing up for yourself makes you feel inside. That is the real reward: the truth that you gave yourself respect today.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-forest mb-3 text-lg">7. Honor the 66-Day Momentum</h3>
              <p className="leading-relaxed">Day 66 is your first major milestone. Take a moment to reflect:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>What feels more natural now?</li>
                <li>What small shifts have become daily?</li>
                <li>How have you grown into a deeper version of yourself?</li>
              </ul>
              <p className="mt-2">This is not about achievement—it's about honoring your own consistency and integrity.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-forest mb-3 text-lg">8. Continue Beyond—Living the Journey</h3>
              <p className="leading-relaxed">The journal doesn't end with completion. Transformation doesn't either. Use the final section to map forward: what micro-practices will you carry on? What quiet commitments serve your soul next?</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-cream/30 text-center">
          <Button
            onClick={onClose}
            data-testid="button-close-help-footer"
            className="bg-forest text-warmwhite hover:bg-emerald px-6 py-2 rounded-full"
          >
            Got it!
          </Button>
        </div>
      </div>
    </div>
  );
}