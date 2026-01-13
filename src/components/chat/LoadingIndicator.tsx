import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  message: string;
  isMobile?: boolean;
}

export function LoadingIndicator({ message, isMobile = false }: LoadingIndicatorProps) {
  const textSize = isMobile ? "text-base" : "text-sm";

  return (
    <div className="space-y-2 animate-fade-in">
      <span className="text-xs text-primary font-medium">RealCoach</span>
      <div className={`flex items-center gap-2 ${textSize} text-muted-foreground`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  );
}
