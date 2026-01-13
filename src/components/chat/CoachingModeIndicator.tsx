interface CoachingModeIndicatorProps {
  currentMode: string;
  currentMove: string;
  isDirectMode: boolean;
}

export function CoachingModeIndicator({
  currentMode,
  currentMove,
  isDirectMode,
}: CoachingModeIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
        {isDirectMode ? 'Direct' : currentMode}
      </span>
      {currentMove !== 'NONE' && (
        <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
          {currentMove}
        </span>
      )}
    </div>
  );
}
