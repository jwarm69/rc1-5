import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, ArrowRight, Sparkles, Target, Calendar, CheckCircle2 } from "lucide-react";

type FlowStep = 
  | "intro" 
  | "q1" | "q2" | "q3" | "q4" | "q5" 
  | "processing" 
  | "reveal-411" 
  | "reveal-actions" 
  | "conversion";

interface Answer {
  question: string;
  answer: string;
}

const questions = [
  {
    id: "q1",
    question: "One year from now, what does 'success' look like for your real estate business?",
    placeholder: "e.g., Close 24 transactions, build a team, reach $500k GCI..."
  },
  {
    id: "q2", 
    question: "Right now, what are you most focused on improving?",
    placeholder: "e.g., Lead generation, follow-up consistency, time management..."
  },
  {
    id: "q3",
    question: "Where do leads usually fall through for you?",
    placeholder: "e.g., After initial contact, during nurturing, at contract stage..."
  },
  {
    id: "q4",
    question: "What type of leads are you mostly working right now?",
    placeholder: "e.g., SOI, past clients, online leads, open house..."
  },
  {
    id: "q5",
    question: "On a typical day, how much time can you realistically spend on follow-up?",
    placeholder: "e.g., 30 minutes, 1-2 hours, varies by day..."
  }
];

const sampleActions = [
  {
    contact: "Sarah Mitchell",
    action: "Send congratulations message",
    reason: "Her daughter just graduated — perfect touchpoint",
    script: "Hey Sarah! Just saw the graduation pics — congratulations to the whole family! Hope you're celebrating. 🎓"
  },
  {
    contact: "Mike & Lisa Chen",
    action: "6-month check-in call",
    reason: "It's been 6 months since closing",
    script: "Hi Mike & Lisa! Hope you're settled into the new place. Just wanted to check in — how's everything going?"
  },
  {
    contact: "David Park",
    action: "Market update email",
    reason: "Expressed interest in upgrading next year",
    script: "David — thought you'd find this interesting. Homes in your target neighborhood are up 4% this quarter..."
  },
  {
    contact: "Jennifer Adams",
    action: "Send listing alert",
    reason: "Actively searching in Eastside area",
    script: "Jennifer — just hit the market: 3BR/2BA in Eastside, $450K. Want to schedule a showing?"
  },
  {
    contact: "Robert Thompson",
    action: "Anniversary touchpoint",
    reason: "1-year home anniversary tomorrow",
    script: "Happy home-iversary Robert! 🏠 Can you believe it's been a year? Hope the house is treating you well."
  }
];

export function IgnitionFlow() {
  const [step, setStep] = useState<FlowStep>("intro");
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentQuestionIndex = step.startsWith("q") ? parseInt(step[1]) - 1 : -1;
  const currentQuestion = currentQuestionIndex >= 0 ? questions[currentQuestionIndex] : null;

  const handleSubmit = () => {
    if (!input.trim()) return;
    
    setIsTransitioning(true);
    
    // Save answer
    if (currentQuestion) {
      setAnswers(prev => [...prev, { question: currentQuestion.question, answer: input }]);
    }
    
    setInput("");
    
    setTimeout(() => {
      if (step === "intro") {
        setStep("q1");
      } else if (step === "q5") {
        setStep("processing");
        // Simulate AI processing
        setTimeout(() => {
          setStep("reveal-411");
        }, 2500);
      } else if (step.startsWith("q")) {
        const nextQ = parseInt(step[1]) + 1;
        setStep(`q${nextQ}` as FlowStep);
      }
      setIsTransitioning(false);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const progressToActions = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep("reveal-actions");
      setIsTransitioning(false);
    }, 300);
  };

  const progressToConversion = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep("conversion");
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <section id="ignition" className="min-h-screen flex flex-col items-center justify-center px-5 md:px-6 py-16 md:py-24">
      <div className={`w-full max-w-2xl transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Intro Step */}
        {step === "intro" && (
          <div className="animate-fade-in text-center">
            <div className="mb-6 md:mb-8">
              <div className="relative inline-block mb-4 md:mb-6">
                <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                <div className="absolute inset-0 w-4 h-4 rounded-full bg-primary blur-md opacity-60" />
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-foreground mb-4 tracking-tight leading-snug">
                A few questions first.
              </h2>
            </div>
            
            <div className="relative mt-8 md:mt-12">
              <div className="ignition-input-glow rounded-2xl p-[1px]">
                <div className="bg-card rounded-2xl">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tell me about your real estate business..."
                    className="min-h-[120px] md:min-h-[140px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base p-5 md:p-6"
                  />
                  <div className="flex justify-end p-4 pt-0">
                    <Button
                      onClick={handleSubmit}
                      disabled={!input.trim()}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px] px-6"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Begin
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question Steps */}
        {currentQuestion && (
          <div className="animate-fade-in">
            {/* Progress indicator */}
            <div className="flex items-center gap-1.5 md:gap-2 mb-6 md:mb-8">
              {questions.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i < currentQuestionIndex ? 'bg-primary' : 
                    i === currentQuestionIndex ? 'bg-primary/60' : 'bg-secondary'
                  }`}
                />
              ))}
            </div>
            
            <div className="mb-6 md:mb-8">
              <p className="text-xs text-muted-foreground mb-2 md:mb-3">Question {currentQuestionIndex + 1} of 5</p>
              <h3 className="text-xl md:text-2xl font-light text-foreground leading-relaxed">
                {currentQuestion.question}
              </h3>
            </div>
            
            <div className="relative">
              <div className="ignition-input-glow rounded-2xl p-[1px]">
                <div className="bg-card rounded-2xl">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={currentQuestion.placeholder}
                    className="min-h-[100px] md:min-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base p-5 md:p-6"
                    autoFocus
                  />
                  <div className="flex justify-end p-4 pt-0">
                    <Button
                      onClick={handleSubmit}
                      disabled={!input.trim()}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px] min-w-[44px]"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {step === "processing" && (
          <div className="animate-fade-in text-center py-12 md:py-16">
            <div className="relative inline-block mb-6 md:mb-8">
              <div className="w-6 h-6 rounded-full bg-primary animate-pulse" />
              <div className="absolute inset-0 w-6 h-6 rounded-full bg-primary blur-lg opacity-60 animate-pulse" />
            </div>
            <p className="text-lg md:text-xl text-muted-foreground font-light">
              Processing...
            </p>
          </div>
        )}

        {/* 411 Reveal */}
        {step === "reveal-411" && (
          <div className="animate-fade-in">
            <div className="text-center mb-8 md:mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary">Example output based on what you shared</span>
              </div>
              <h3 className="text-xl md:text-2xl font-light text-foreground">Your 411 Strategy</h3>
            </div>
            
            <div className="space-y-4 md:space-y-6">
              {/* Year Goal */}
              <div className="p-5 md:p-6 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-muted-foreground">YEAR GOAL</span>
                </div>
                <p className="text-base md:text-lg text-foreground leading-relaxed">
                  Close 24 transactions with a focus on referral-based business
                </p>
              </div>
              
              {/* Monthly Focus */}
              <div className="p-5 md:p-6 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-sm font-medium text-muted-foreground">THIS MONTH'S FOCUS</span>
                </div>
                <p className="text-base md:text-lg text-foreground leading-relaxed">
                  Re-engage past clients and strengthen SOI touchpoints
                </p>
              </div>
              
              {/* Daily Commitments */}
              <div className="p-5 md:p-6 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-muted-foreground">DAILY COMMITMENTS</span>
                </div>
                <ul className="space-y-2">
                  <li className="text-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    5 meaningful SOI contacts per day
                  </li>
                  <li className="text-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    2 past client check-ins per week
                  </li>
                  <li className="text-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    1 hour of focused prospecting daily
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 md:mt-10 text-center">
              <Button
                onClick={progressToActions}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(156_100%_50%/0.3)] min-h-[48px] px-6"
              >
                See Today's Actions
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Actions Reveal */}
        {step === "reveal-actions" && (
          <div className="animate-fade-in">
            <div className="text-center mb-8 md:mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary">Daily Action Engine — Preview</span>
              </div>
              <h3 className="text-xl md:text-2xl font-light text-foreground">Today's 5 Priority Actions</h3>
              <p className="text-sm text-muted-foreground mt-2">
                RealCoach generates these automatically, every day
              </p>
            </div>
            
            <div className="space-y-3 md:space-y-4">
              {sampleActions.map((action, index) => (
                <div 
                  key={index}
                  className="p-4 md:p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="min-w-0">
                      <h4 className="font-medium text-foreground truncate">{action.contact}</h4>
                      <p className="text-sm text-primary">{action.action}</p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded flex-shrink-0">
                      {index + 1}/5
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    <span className="text-accent">Why:</span> {action.reason}
                  </p>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/30">
                    <p className="text-sm text-foreground/80 italic">"{action.script}"</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 md:mt-10 text-center">
              <Button
                onClick={progressToConversion}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(156_100%_50%/0.3)] min-h-[48px] px-6"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Conversion */}
        {step === "conversion" && (
          <div className="animate-fade-in text-center py-12 md:py-16">
            <div className="relative inline-block mb-6 md:mb-8">
              <div className="w-4 h-4 rounded-full bg-primary" />
              <div className="absolute inset-0 w-4 h-4 rounded-full bg-primary blur-lg opacity-60" />
            </div>
            
            <h3 className="text-xl md:text-2xl lg:text-3xl font-light text-foreground mb-4 leading-snug">
              This runs daily, automatically.
            </h3>
            
            <p className="text-muted-foreground mb-8 md:mb-10 max-w-md mx-auto">
              Clear actions. No maintenance.
            </p>
            
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-center md:gap-4">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_hsl(156_100%_50%/0.4)] hover:shadow-[0_0_40px_hsl(156_100%_50%/0.5)] transition-all duration-300 px-8 min-h-[52px]"
              >
                Continue
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-border hover:border-accent hover:text-accent min-h-[52px]"
                asChild
              >
                <a href="#features">View features</a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
