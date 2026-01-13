import { Button } from "@/components/ui/button";

interface MissedDayPromptProps {
  onUnpack: () => void;
  onSkip: () => void;
}

export function MissedDayPrompt({ onUnpack, onSkip }: MissedDayPromptProps) {
  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg animate-fade-in">
      <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
        Looks like yesterday didn't go as planned.
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={onUnpack} className="text-xs">
          Let's talk about it
        </Button>
        <Button size="sm" variant="outline" onClick={onSkip} className="text-xs">
          Move on
        </Button>
      </div>
    </div>
  );
}
