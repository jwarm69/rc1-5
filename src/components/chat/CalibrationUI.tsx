import { SkipForward, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChatMessage } from "@/types/coach-panel";

interface ToneSelectionProps {
  onSelectTone: (tone: 'DIRECT_EXECUTIVE' | 'COACH_CONCISE' | 'NEUTRAL_MINIMAL', label: string) => void;
  isMobile?: boolean;
}

export function ToneSelection({ onSelectTone, isMobile = false }: ToneSelectionProps) {
  const buttonClass = isMobile
    ? "flex items-center gap-2 px-3 py-3 rounded-lg text-base font-medium bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30 transition-all duration-200 text-left touch-target"
    : "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30 transition-all duration-200 text-left";

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onSelectTone('DIRECT_EXECUTIVE', 'Direct & Executive')}
          className={buttonClass}
        >
          <span className="font-semibold">1.</span> Direct & Executive
        </button>
        <button
          onClick={() => onSelectTone('COACH_CONCISE', 'Coach-like')}
          className={buttonClass}
        >
          <span className="font-semibold">2.</span> Coach-like & Supportive
        </button>
        <button
          onClick={() => onSelectTone('NEUTRAL_MINIMAL', 'Neutral & Minimal')}
          className={buttonClass}
        >
          <span className="font-semibold">3.</span> Neutral & Minimal
        </button>
      </div>
    </div>
  );
}

interface CalibrationProgressProps {
  progress: number;
  currentQuestionIndex: number | null;
  hasCurrentQuestion: boolean;
  onSkip?: () => void;
  isMobile?: boolean;
}

export function CalibrationProgress({
  progress,
  currentQuestionIndex,
  hasCurrentQuestion,
  onSkip,
  isMobile = false,
}: CalibrationProgressProps) {
  return (
    <div className="space-y-2 animate-fade-in">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {hasCurrentQuestion
            ? `Question ${(currentQuestionIndex || 0) + 1} of 7`
            : 'Calibration Progress'}
        </span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className={isMobile ? "h-1.5" : "h-1"} />
      {hasCurrentQuestion && onSkip && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <SkipForward className="w-3 h-3 mr-1" />
          Skip this question
        </Button>
      )}
    </div>
  );
}

interface GAConfirmButtonsProps {
  onConfirm: () => void;
  onEdit: () => void;
}

export function GAConfirmButtons({ onConfirm, onEdit }: GAConfirmButtonsProps) {
  return (
    <div className="flex gap-2 animate-fade-in">
      <Button onClick={onConfirm} className="flex-1">
        <Check className="w-4 h-4 mr-2" />
        Confirm
      </Button>
      <Button variant="outline" onClick={onEdit} className="flex-1">
        Edit
      </Button>
    </div>
  );
}
