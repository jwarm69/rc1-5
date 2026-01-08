import { useState, useRef } from "react";
import { Upload, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type IgnitionState = "listening" | "thinking" | "preview" | "actions";

interface ProposedAction {
  id: string;
  contact?: string;
  action: string;
  reason: string;
}

export default function Ignition() {
  const [state, setState] = useState<IgnitionState>("listening");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "coach"; content: string }>>([]);
  const [proposedActions, setProposedActions] = useState<ProposedAction[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: "user", content: input }]);
    setInput("");
    setState("thinking");
    
    // Simulate coach thinking (will be replaced with real AI)
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "coach", 
        content: "I hear you. Let me understand what's happening and we'll figure out the right next step together." 
      }]);
      setState("listening");
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMessages(prev => [...prev, { role: "user", content: `[Screenshot uploaded: ${file.name}]` }]);
      setState("thinking");
      
      // Simulate processing
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: "coach", 
          content: "I'm reviewing what you shared. Give me a moment to understand the context." 
        }]);
        setState("listening");
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-8 pb-12 animate-fade-in overflow-hidden">
      {/* Coach Presence */}
      <div className="mb-12 text-center">
        <div 
          className={`w-3 h-3 rounded-full mx-auto mb-4 transition-all duration-700 ${
            state === "thinking" 
              ? "bg-primary shadow-[0_0_20px_rgba(0,255,65,0.4)] animate-pulse" 
              : "bg-primary/60"
          }`} 
        />
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="matrix-text-gradient">RealCoach</span>
          <span className="tiffany-text-gradient">.ai</span>
        </h1>
      </div>

      {/* Conversation Area */}
      <div className="w-full max-w-2xl flex-1 flex flex-col">
        {messages.length === 0 ? (
          /* Initial Guided Prompt */
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xl text-muted-foreground font-light text-center leading-relaxed max-w-md">
              Tell me what's happening right now, and we'll take it from there.
            </p>
          </div>
        ) : (
          /* Message Thread */
          <div className="flex-1 space-y-6 mb-8 max-h-[50vh] overflow-y-auto">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`animate-fade-in ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div 
                  className={`inline-block max-w-[80%] px-4 py-3 rounded-lg ${
                    msg.role === "user" 
                      ? "bg-secondary/50 text-foreground" 
                      : "text-foreground"
                  }`}
                >
                  {msg.role === "coach" && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-xs text-muted-foreground">RealCoach</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {/* Thinking State */}
            {state === "thinking" && (
              <div className="animate-fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,255,65,0.5)]" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="relative mt-auto">
          <div 
            className={`relative rounded-2xl border-2 transition-all duration-500 ${
              state === "thinking" 
                ? "border-primary/50 shadow-[0_0_60px_rgba(0,255,65,0.25),0_0_100px_rgba(0,255,65,0.1)]" 
                : "border-primary/20 shadow-[0_0_40px_rgba(0,255,65,0.15),0_0_80px_rgba(0,255,65,0.05)] hover:border-primary/40 hover:shadow-[0_0_50px_rgba(0,255,65,0.2),0_0_100px_rgba(0,255,65,0.1)] focus-within:border-primary/50 focus-within:shadow-[0_0_60px_rgba(0,255,65,0.25),0_0_120px_rgba(0,255,65,0.1)]"
            }`}
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind?"
              className="min-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pr-24 text-base p-6"
              disabled={state === "thinking"}
            />
            
            {/* Input Actions */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                onClick={() => fileInputRef.current?.click()}
                disabled={state === "thinking"}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10"
                onClick={handleSubmit}
                disabled={!input.trim() || state === "thinking"}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground/60 text-center mt-3">
            Share context freely. Nothing changes until you confirm.
          </p>
        </div>
      </div>
    </div>
  );
}
