import { ChatMessage } from "@/types/coach-panel";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isMobile?: boolean;
}

export function ChatMessages({ messages, isMobile = false }: ChatMessagesProps) {
  const textSize = isMobile ? "text-base" : "text-sm";
  const maxWidth = isMobile ? "max-w-[85%]" : "max-w-[90%]";
  const imageMaxHeight = isMobile ? "max-h-48" : "max-h-40";
  const paddingY = isMobile ? "py-3" : "py-2.5";

  return (
    <>
      {messages.map((message, index) => (
        <div
          key={message.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {message.role === "coach" && (
            <div className="space-y-2">
              <span className="text-xs text-primary font-medium">RealCoach</span>
              <p className={`${textSize} text-sidebar-foreground leading-relaxed whitespace-pre-line`}>
                {message.content}
              </p>
            </div>
          )}
          {message.role === "system" && (
            <div className="flex justify-center">
              <span className="text-xs text-muted-foreground/60 px-3 py-1 rounded-full bg-secondary/30">
                {message.content}
              </span>
            </div>
          )}
          {message.role === "user" && (
            <div className="flex justify-end">
              <div className={`bg-secondary rounded-lg px-4 ${paddingY} ${maxWidth} border border-border/50`}>
                {message.imageUrl && (
                  <img
                    src={message.imageUrl}
                    alt="Uploaded screenshot"
                    className={`rounded-md mb-2 ${imageMaxHeight} object-contain`}
                  />
                )}
                <p className={`${textSize} text-foreground`}>{message.content}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
