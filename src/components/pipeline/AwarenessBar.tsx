interface AwarenessBarProps {
  title: string;
  current: number | string;
  target?: number;
  subtitle?: string;
}

export function AwarenessBar({ title, current, target, subtitle }: AwarenessBarProps) {
  const percentage = target ? (typeof current === 'number' ? (current / target) * 100 : 0) : 60;
  
  return (
    <div className="flex-shrink-0 min-w-[140px] md:min-w-0 md:flex-1">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs text-white/90 whitespace-nowrap">{title}</span>
        <div className="flex items-baseline gap-1 ml-2">
          <span className="text-sm font-medium text-white">{current}</span>
          {target && (
            <span className="text-xs text-white/70">/ {target}</span>
          )}
        </div>
      </div>
      <div className="awareness-bar">
        <div 
          className="awareness-bar-fill"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-white/70 whitespace-nowrap">{subtitle}</p>
      )}
    </div>
  );
}
