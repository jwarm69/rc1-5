import { FlowStep } from "@/types/coach-panel";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  currentStepData: FlowStep | null;
  isMobile?: boolean;
  isSubmitting?: boolean;
  onSubmit: () => void;
  onSelectOption: (option: string) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  placeholder?: string;
}

export function ChatInput({
  input,
  setInput,
  currentStepData,
  isMobile = false,
  isSubmitting = false,
  onSubmit,
  onSelectOption,
  onPaste,
  placeholder = "Message or paste screenshot",
}: ChatInputProps) {
  const baseInputClass = `flex-1 bg-secondary/80 border border-primary/20 rounded-lg px-4 text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20`;
  const mobileClass = isMobile ? "py-4 text-base" : "py-3.5";
  const focusGlow = !isMobile ? "focus:shadow-[0_0_20px_hsl(156_100%_50%/0.15)]" : "";

  // Default text input when no step data
  if (!currentStepData) {
    return (
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        onPaste={onPaste}
        placeholder={placeholder}
        className={`${baseInputClass} ${mobileClass} ${focusGlow}`}
      />
    );
  }

  // Select options
  if (currentStepData.type === "select" && currentStepData.options) {
    return (
      <div className="flex-1 flex flex-wrap gap-2">
        {currentStepData.options.map((option) => (
          <button
            key={option}
            onClick={() => onSelectOption(option)}
            disabled={isSubmitting}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30 transition-all duration-200 disabled:opacity-50"
          >
            {option}
          </button>
        ))}
      </div>
    );
  }

  // Textarea
  if (currentStepData.type === "textarea") {
    return (
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSubmit()}
        onPaste={onPaste}
        placeholder={currentStepData.prompt}
        rows={2}
        className={`flex-1 bg-secondary/80 border border-primary/20 rounded-lg px-4 py-3 ${isMobile ? "text-base" : "text-sm"} text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 resize-none`}
      />
    );
  }

  // Date input
  if (currentStepData.type === "date") {
    return (
      <input
        type="date"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        className={`${baseInputClass} ${mobileClass}`}
      />
    );
  }

  // Default text input
  return (
    <input
      type="text"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onSubmit()}
      onPaste={onPaste}
      placeholder={currentStepData.prompt}
      className={`${baseInputClass} ${mobileClass} ${focusGlow}`}
    />
  );
}
