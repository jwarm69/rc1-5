import { useState, useEffect, useRef, DragEvent, ChangeEvent, ClipboardEvent } from "react";
import { Send, Sparkles, Bot, RefreshCw, FileText, Calendar, Zap, ArrowLeft, Check, ImagePlus, X, Loader2, Mail, ListChecks, TrendingUp, StickyNote, SkipForward } from "lucide-react";
import { SupportFormModal } from "./SupportFormModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCalibration } from "@/contexts/CalibrationContext";
import { useCoachingEngine } from "@/contexts/CoachingEngineContext";
import { getLLMClient } from "@/lib/llm";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

type ActionType = "update-opportunity" | "add-note" | "schedule-meeting" | "provide-actions" | "screenshot-context" | null;
type ScreenshotActionType = "update-stage" | "update-notes" | "draft-email" | "schedule-actions" | "add-note" | null;

interface Message {
  id: string;
  role: "coach" | "user" | "system";
  content: string;
  action?: ActionType;
  imageUrl?: string;
}

interface FlowStep {
  field: string;
  prompt: string;
  type: "text" | "select" | "date" | "textarea";
  options?: string[];
}

interface FlowData {
  [key: string]: string;
}

// Screenshot action options for the guided flow
const screenshotActions = [
  { id: "update-stage" as ScreenshotActionType, label: "Update Opportunity Stage", icon: TrendingUp },
  { id: "update-notes" as ScreenshotActionType, label: "Update Opportunity Notes", icon: FileText },
  { id: "draft-email" as ScreenshotActionType, label: "Draft Email Response", icon: Mail },
  { id: "schedule-actions" as ScreenshotActionType, label: "Schedule Action Items", icon: ListChecks },
  { id: "add-note" as ScreenshotActionType, label: "Add as Note", icon: StickyNote },
];

// Screenshot flow steps based on selected action
const screenshotFlows: Record<string, FlowStep[]> = {
  "update-stage": [
    { field: "contact_name", prompt: "Which contact is this for?", type: "text" },
    { field: "status", prompt: "What stage should we update to?", type: "select", options: ["Active", "Pending", "Closed", "On Hold"] },
    { field: "notes", prompt: "Any additional notes from the screenshot?", type: "textarea" },
  ],
  "update-notes": [
    { field: "contact_name", prompt: "Which contact is this for?", type: "text" },
    { field: "notes", prompt: "What notes should I add from this screenshot?", type: "textarea" },
  ],
  "draft-email": [
    { field: "contact_name", prompt: "Who should I draft this email for?", type: "text" },
    { field: "email_context", prompt: "What's the context or key points for the email?", type: "textarea" },
  ],
  "schedule-actions": [
    { field: "contact_name", prompt: "Which contact is this related to? (optional)", type: "text" },
    { field: "action_text", prompt: "What action items should I schedule?", type: "textarea" },
  ],
  "add-note": [
    { field: "contact_name", prompt: "Which contact is this for? (optional)", type: "text" },
    { field: "content", prompt: "Describe what's in this screenshot", type: "textarea" },
  ],
};

const actionFlows: Record<string, FlowStep[]> = {
  "update-opportunity": [
    { field: "contact_name", prompt: "Contact name", type: "text" },
    { field: "status", prompt: "Status", type: "select", options: ["Active", "Pending", "Closed", "On Hold"] },
    { field: "deal_amount", prompt: "Deal amount", type: "text" },
    { field: "notes", prompt: "Notes", type: "textarea" },
  ],
  "add-note": [
    { field: "contact_name", prompt: "Contact name (optional)", type: "text" },
    { field: "content", prompt: "Note", type: "textarea" },
  ],
  "schedule-meeting": [
    { field: "contact_name", prompt: "Contact name", type: "text" },
    { field: "meeting_date", prompt: "Date", type: "date" },
    { field: "meeting_time", prompt: "Time", type: "text" },
    { field: "location", prompt: "Location", type: "text" },
    { field: "notes", prompt: "Notes (optional)", type: "textarea" },
  ],
  "provide-actions": [
    { field: "contact_name", prompt: "Contact name (optional)", type: "text" },
    { field: "action_text", prompt: "Action item", type: "textarea" },
  ],
};

const actionButtons = [
  { id: "update-opportunity" as ActionType, label: "Update Opportunity", icon: RefreshCw },
  { id: "add-note" as ActionType, label: "Add Note", icon: FileText },
  { id: "schedule-meeting" as ActionType, label: "Schedule Meeting", icon: Calendar },
  { id: "provide-actions" as ActionType, label: "Actions", icon: Zap },
];

interface CoachPanelProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function CoachPanel({ isMobile = false }: CoachPanelProps) {
  const { user } = useAuth();
  const calibration = useCalibration();
  const engine = useCoachingEngine();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [input, setInput] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [flowData, setFlowData] = useState<FlowData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  
  // Screenshot upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [screenshotAction, setScreenshotAction] = useState<ScreenshotActionType>(null);
  const [screenshotStep, setScreenshotStep] = useState(0);
  const [screenshotFlowData, setScreenshotFlowData] = useState<FlowData>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Calibration state
  const [calibrationStarted, setCalibrationStarted] = useState(false);
  const [showToneSelection, setShowToneSelection] = useState(false);

  // Get current flow based on whether we're in screenshot mode or regular action mode
  const currentFlow = activeAction && activeAction !== "screenshot-context" ? actionFlows[activeAction] : null;
  const currentStepData = currentFlow ? currentFlow[currentStep] : null;
  
  // Screenshot flow helpers
  const currentScreenshotFlow = screenshotAction ? screenshotFlows[screenshotAction] : null;
  const currentScreenshotStepData = currentScreenshotFlow ? currentScreenshotFlow[screenshotStep] : null;

  // Load messages on mount (only for logged-in users)
  useEffect(() => {
    if (!user) {
      setLoadingMessages(false);
      return;
    }

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(50);

      if (!error && data) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            role: m.role as "coach" | "user" | "system",
            content: m.content,
            action: m.action_type as ActionType,
          }))
        );
      }
      setLoadingMessages(false);
    };

    loadMessages();
  }, [user]);

  // Initialize calibration flow for new users
  useEffect(() => {
    if (!calibration.isLoading && calibration.state.userState === 'UNINITIALIZED' && !calibrationStarted) {
      setCalibrationStarted(true);
      // Start calibration automatically
      calibration.start();
    }
  }, [calibration.isLoading, calibration.state.userState, calibrationStarted, calibration.start]);

  // Show welcome message and tone selection when calibration starts
  useEffect(() => {
    if (calibration.state.userState === 'CALIBRATING' && !calibration.state.tone && !showToneSelection) {
      setShowToneSelection(true);
      // Add welcome message
      const welcomeMsg: Message = {
        id: 'cal-welcome',
        role: 'coach',
        content: "Welcome to RealCoach! I'm here to help you stay focused and make consistent progress toward your goals.\n\nLet's start with a few questions so I can understand what you're working toward.",
      };
      setMessages([welcomeMsg]);
    }
  }, [calibration.state.userState, calibration.state.tone, showToneSelection]);

  // Show calibration questions one at a time
  useEffect(() => {
    if (calibration.state.userState === 'CALIBRATING' && calibration.state.tone && calibration.currentQuestion) {
      // Check if this question is already shown
      const questionId = `cal-q-${calibration.currentQuestion.id}`;
      const hasQuestion = messages.some(m => m.id === questionId);

      if (!hasQuestion) {
        setTimeout(() => {
          const questionMsg: Message = {
            id: questionId,
            role: 'coach',
            content: calibration.currentQuestion?.question || '',
          };
          setMessages(prev => [...prev, questionMsg]);
        }, 500);
      }
    }
  }, [calibration.state.userState, calibration.state.tone, calibration.currentQuestion, messages]);

  // Show G&A draft for confirmation
  useEffect(() => {
    if (calibration.state.userState === 'G&A_DRAFTED' && calibration.state.goalsAndActions) {
      const ga = calibration.state.goalsAndActions;
      const draftContent = `Here's what I captured:

**Your Annual Goal**
${ga.annualProfessionalGoal || '(not specified)'}

**Personal Priority**
${ga.annualPersonalGoal || '(not specified)'}

**30-Day Focus**
${ga.monthlyMilestone || '(not specified)'}

**Execution Style**
${ga.executionStyle === 'STRUCTURED' ? 'Structured and planned' :
  ga.executionStyle === 'SHORT_BURSTS' ? 'Short bursts of focus' :
  ga.executionStyle === 'SLOW_CONSISTENT' ? 'Slow and consistent' : 'Flexible'}

Does this look right? Say "yes" to confirm, or tell me what to change.`;

      const draftMsg: Message = {
        id: 'cal-draft',
        role: 'coach',
        content: draftContent,
      };
      setMessages(prev => [...prev, draftMsg]);
    }
  }, [calibration.state.userState, calibration.state.goalsAndActions]);

  // Handle G&A confirmation
  useEffect(() => {
    if (calibration.state.userState === 'G&A_CONFIRMED') {
      const confirmMsg: Message = {
        id: 'cal-confirmed',
        role: 'coach',
        content: "Your Goals & Actions are set. I'll use this to give you focused daily guidance.\n\nStarting tomorrow, I'll ask what you got done and give you your next actions. Let's make progress!",
      };
      setMessages(prev => [...prev, confirmMsg]);
    }
  }, [calibration.state.userState]);

  // Only persist to database if user is logged in
  const saveMessage = async (msg: Message) => {
    if (!user) return; // Demo mode - no persistence
    
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: msg.role,
      content: msg.content,
      action_type: msg.action || null,
    });
  };

  // Handle missed-day choice and generate appropriate LLM response
  const handleMissedDayChoiceWithResponse = async (choice: 'UNPACK' | 'SKIP') => {
    engine.handleMissedDayChoice(choice);

    // Add user message indicating choice
    const choiceText = choice === 'UNPACK'
      ? "Let's talk about what happened yesterday."
      : "Let's skip that and move forward.";

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: choiceText,
    };
    setMessages(prev => [...prev, userMsg]);
    await saveMessage(userMsg);

    // Generate LLM response
    setIsGeneratingResponse(true);
    try {
      const client = getLLMClient();
      const recentMessages = messages.slice(-10).map(m => ({
        role: m.role === 'coach' ? 'assistant' as const : 'user' as const,
        content: m.content,
      }));

      const response = await client.generateCoachingResponse(choiceText, {
        currentMode: engine.getCurrentMode(),
        currentMove: engine.getCurrentMove(),
        tone: calibration.state.tone || null,
        goalsAndActions: calibration.state.goalsAndActions || null,
        businessPlan: calibration.state.businessPlan || null,
        recentMessages,
      });

      const coachResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "coach",
        content: response.message,
      };
      setMessages(prev => [...prev, coachResponse]);
      await saveMessage(coachResponse);

      if (response.suggestedMode) {
        engine.transitionTo(response.suggestedMode);
      }
    } catch (error) {
      console.error('LLM error:', error);
      const fallback: Message = {
        id: (Date.now() + 1).toString(),
        role: "coach",
        content: choice === 'UNPACK'
          ? "What got in the way yesterday?"
          : "Let's focus on what's possible today.",
      };
      setMessages(prev => [...prev, fallback]);
      await saveMessage(fallback);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  const handleActionSelect = async (actionId: ActionType) => {
    setActiveAction(actionId);
    setCurrentStep(0);
    setFlowData({});
    
    const actionLabel = actionButtons.find(a => a.id === actionId)?.label || "";
    const systemMessage: Message = {
      id: Date.now().toString(),
      role: "system",
      content: actionLabel,
      action: actionId,
    };
    setMessages(prev => [...prev, systemMessage]);
    await saveMessage(systemMessage);
  };

  const handleBack = () => {
    // Reset screenshot states
    setUploadedImage(null);
    setScreenshotAction(null);
    setScreenshotStep(0);
    setScreenshotFlowData({});
    setIsAnalyzing(false);
    
    if (activeAction === "screenshot-context") {
      // If in screenshot flow with steps, go back one step
      if (screenshotStep > 0) {
        setScreenshotStep(prev => prev - 1);
        setMessages(prev => {
          const lastUserIndex = prev.map(m => m.role).lastIndexOf("user");
          if (lastUserIndex > -1) {
            return prev.slice(0, lastUserIndex);
          }
          return prev;
        });
        return;
      } else if (screenshotAction) {
        // Go back to action selection
        setScreenshotAction(null);
        setMessages(prev => {
          // Keep the image message, remove the rest
          const imageMessageIndex = prev.findIndex(m => m.imageUrl);
          if (imageMessageIndex > -1) {
            return prev.slice(0, imageMessageIndex + 2); // Keep image and coach response
          }
          return prev;
        });
        return;
      }
    }
    
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setMessages(prev => {
        const lastUserIndex = prev.map(m => m.role).lastIndexOf("user");
        if (lastUserIndex > -1) {
          return prev.slice(0, lastUserIndex);
        }
        return prev;
      });
    } else {
      setActiveAction(null);
      setFlowData({});
      setMessages([]);
    }
  };

  // Screenshot handling functions
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processImageFile(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processImageFile(files[0]);
    }
  };

  // Handle paste events for screenshots
  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
        }
        break;
      }
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setUploadedImage(imageUrl);
      startScreenshotFlow(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const startScreenshotFlow = (imageUrl: string) => {
    setActiveAction("screenshot-context");
    setScreenshotAction(null);
    setScreenshotStep(0);
    setScreenshotFlowData({});
    
    // Add user message with image
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "Screenshot uploaded",
      imageUrl: imageUrl,
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Coach asks what to do with the screenshot
    setTimeout(() => {
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "coach",
        content: "Got it! What would you like me to do with this screenshot?",
      };
      setMessages(prev => [...prev, coachMessage]);
    }, 500);
  };

  const handleScreenshotActionSelect = (actionId: ScreenshotActionType) => {
    setScreenshotAction(actionId);
    setScreenshotStep(0);
    setScreenshotFlowData({});
    
    const actionLabel = screenshotActions.find(a => a.id === actionId)?.label || "";
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: actionLabel,
    };
    setMessages(prev => [...prev, userMessage]);
  };

  const handleScreenshotStepSubmit = async () => {
    if (!input.trim() && currentScreenshotStepData?.type !== "select") return;
    if (!currentScreenshotStepData || !currentScreenshotFlow) return;

    const value = input.trim();
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: value,
    };
    setMessages(prev => [...prev, userMessage]);
    
    const newFlowData = { ...screenshotFlowData, [currentScreenshotStepData.field]: value };
    setScreenshotFlowData(newFlowData);
    setInput("");

    if (screenshotStep === currentScreenshotFlow.length - 1) {
      await saveScreenshotData(newFlowData);
    } else {
      setScreenshotStep(prev => prev + 1);
    }
  };

  const handleScreenshotSelectOption = async (option: string) => {
    if (!currentScreenshotStepData || !currentScreenshotFlow) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: option,
    };
    setMessages(prev => [...prev, userMessage]);
    
    const newFlowData = { ...screenshotFlowData, [currentScreenshotStepData.field]: option };
    setScreenshotFlowData(newFlowData);

    if (screenshotStep === currentScreenshotFlow.length - 1) {
      await saveScreenshotData(newFlowData);
    } else {
      setScreenshotStep(prev => prev + 1);
    }
  };

  const saveScreenshotData = async (data: FlowData) => {
    setIsSubmitting(true);
    
    try {
      if (user) {
        let error = null;

        if (screenshotAction === "update-stage" || screenshotAction === "update-notes") {
          const { error: e } = await supabase.from("opportunities").insert({
            user_id: user.id,
            contact_name: data.contact_name,
            status: data.status?.toLowerCase() || "active",
            notes: `[From Screenshot] ${data.notes || ""}`,
          });
          error = e;
        } else if (screenshotAction === "draft-email") {
          // Save as a note with email context
          const { error: e } = await supabase.from("notes").insert({
            user_id: user.id,
            contact_name: data.contact_name || null,
            content: `[Email Draft Request from Screenshot]\nContact: ${data.contact_name}\nContext: ${data.email_context}`,
          });
          error = e;
        } else if (screenshotAction === "schedule-actions") {
          const { error: e } = await supabase.from("action_items").insert({
            user_id: user.id,
            contact_name: data.contact_name || null,
            action_text: `[From Screenshot] ${data.action_text}`,
          });
          error = e;
        } else if (screenshotAction === "add-note") {
          const { error: e } = await supabase.from("notes").insert({
            user_id: user.id,
            contact_name: data.contact_name || null,
            content: `[From Screenshot] ${data.content}`,
          });
          error = e;
        }

        if (error) {
          console.error("Save error:", error);
          toast.error("Could not save.");
          setIsSubmitting(false);
          return;
        }
      }

      const confirmMessage: Message = {
        id: Date.now().toString(),
        role: "coach",
        content: user ? "Done! I've saved that for you." : "Noted. Create an account to save permanently.",
      };
      setMessages(prev => [...prev, confirmMessage]);
      
      setTimeout(() => {
        setActiveAction(null);
        setScreenshotAction(null);
        setScreenshotStep(0);
        setScreenshotFlowData({});
        setUploadedImage(null);
        setMessages([]);
      }, 1500);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Could not save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStepSubmit = async () => {
    if (!input.trim() && currentStepData?.type !== "select") return;
    if (!currentStepData || !currentFlow) return;

    const value = input.trim();
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: value,
    };
    setMessages(prev => [...prev, userMessage]);
    await saveMessage(userMessage);
    
    const newFlowData = { ...flowData, [currentStepData.field]: value };
    setFlowData(newFlowData);
    setInput("");

    if (currentStep === currentFlow.length - 1) {
      await saveToDatabase(newFlowData);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSelectOption = async (option: string) => {
    if (!currentStepData || !currentFlow) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: option,
    };
    setMessages(prev => [...prev, userMessage]);
    await saveMessage(userMessage);
    
    const newFlowData = { ...flowData, [currentStepData.field]: option };
    setFlowData(newFlowData);

    if (currentStep === currentFlow.length - 1) {
      await saveToDatabase(newFlowData);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const saveToDatabase = async (data: FlowData) => {
    setIsSubmitting(true);
    
    try {
      // Only save to database if user is logged in
      if (user) {
        let error = null;

        if (activeAction === "update-opportunity") {
          const { error: e } = await supabase.from("opportunities").insert({
            user_id: user.id,
            contact_name: data.contact_name,
            status: data.status?.toLowerCase() || "active",
            deal_amount: data.deal_amount ? parseFloat(data.deal_amount.replace(/[^0-9.]/g, "")) : null,
            notes: data.notes || null,
          });
          error = e;
        } else if (activeAction === "add-note") {
          const { error: e } = await supabase.from("notes").insert({
            user_id: user.id,
            contact_name: data.contact_name || null,
            content: data.content,
          });
          error = e;
        } else if (activeAction === "schedule-meeting") {
          const { error: e } = await supabase.from("meetings").insert({
            user_id: user.id,
            contact_name: data.contact_name || null,
            meeting_date: data.meeting_date,
            meeting_time: data.meeting_time || null,
            location: data.location || null,
            notes: data.notes || null,
          });
          error = e;
        } else if (activeAction === "provide-actions") {
          const { error: e } = await supabase.from("action_items").insert({
            user_id: user.id,
            contact_name: data.contact_name || null,
            action_text: data.action_text,
          });
          error = e;
        }

        if (error) {
          console.error("Save error:", error);
          toast.error("Could not save.");
          setIsSubmitting(false);
          return;
        }
      }

      // Always show confirmation (demo mode or logged in)
      const confirmMessage: Message = {
        id: Date.now().toString(),
        role: "coach",
        content: user ? "Saved." : "Noted. Create an account to save permanently.",
      };
      setMessages(prev => [...prev, confirmMessage]);
      if (user) await saveMessage(confirmMessage);
      
      setTimeout(() => {
        setActiveAction(null);
        setCurrentStep(0);
        setFlowData({});
      }, 1500);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Could not save.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = async () => {
    // Handle screenshot flow steps
    if (activeAction === "screenshot-context" && currentScreenshotStepData) {
      await handleScreenshotStepSubmit();
      return;
    }

    // Handle calibration flow
    if (calibration.isCalibrating && input.trim()) {
      const userInput = input.trim();
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: userInput,
      };
      setMessages(prev => [...prev, userMsg]);
      setInput("");

      // Check for Fast Lane trigger
      if (calibration.checkForFastLane(userInput)) {
        calibration.triggerFastLane();
        setTimeout(() => {
          const fastLaneMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "coach",
            content: "Got it — let's keep this quick. Just 2 questions and you're in.",
          };
          setMessages(prev => [...prev, fastLaneMsg]);
        }, 500);
        return;
      }

      // Handle tone selection
      if (!calibration.state.tone) {
        const lower = userInput.toLowerCase();
        if (lower.includes('direct') || lower.includes('executive') || lower.includes('1')) {
          calibration.setTone('DIRECT_EXECUTIVE');
        } else if (lower.includes('coach') || lower.includes('supportive') || lower.includes('2')) {
          calibration.setTone('COACH_CONCISE');
        } else {
          calibration.setTone('NEUTRAL_MINIMAL');
        }
        return;
      }

      // Handle calibration question answers
      if (calibration.currentQuestion) {
        calibration.answerQuestion(calibration.currentQuestion.id, userInput);
        return;
      }
      return;
    }

    // Handle G&A confirmation
    if (calibration.state.userState === 'G&A_DRAFTED' && input.trim()) {
      const userInput = input.trim();
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: userInput,
      };
      setMessages(prev => [...prev, userMsg]);
      setInput("");

      const lower = userInput.toLowerCase();
      if (lower.includes('yes') || lower.includes('confirm') || lower.includes('looks good') || lower.includes('approved')) {
        calibration.confirmGoalsAndActions();
      } else {
        // User wants to edit
        setTimeout(() => {
          const editMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "coach",
            content: "What would you like to change?",
          };
          setMessages(prev => [...prev, editMsg]);
        }, 500);
      }
      return;
    }

    if (activeAction && currentStepData) {
      await handleStepSubmit();
    } else if (!activeAction && input.trim()) {
      const userInput = input;
      const newMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: userInput,
      };
      setMessages(prev => [...prev, newMessage]);
      await saveMessage(newMessage);
      setInput("");

      // Process message through coaching engine for signal detection
      engine.processMessage(userInput);
      engine.detectAndSetMove(userInput);

      // If missed day detected, wait for user choice before proceeding
      if (engine.needsMissedDayChoice) {
        return;
      }

      // Generate LLM response
      setIsGeneratingResponse(true);
      try {
        const client = getLLMClient();

        // Build recent messages for context
        const recentMessages = messages.slice(-10).map(m => ({
          role: m.role === 'coach' ? 'assistant' as const : 'user' as const,
          content: m.content,
        }));

        const response = await client.generateCoachingResponse(userInput, {
          currentMode: engine.getCurrentMode(),
          currentMove: engine.getCurrentMove(),
          tone: calibration.state.tone || null,
          goalsAndActions: calibration.state.goalsAndActions || null,
          businessPlan: calibration.state.businessPlan || null,
          recentMessages,
        });

        const coachResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "coach",
          content: response.message,
        };
        setMessages(prev => [...prev, coachResponse]);
        await saveMessage(coachResponse);

        // Update engine state if mode/move suggested
        if (response.suggestedMode) {
          engine.transitionTo(response.suggestedMode);
        }

        // Log policy violations for debugging
        if (response.policyViolations && response.policyViolations.length > 0) {
          console.warn('Coaching policy violations:', response.policyViolations);
        }
      } catch (error) {
        console.error('LLM error:', error);
        // Fallback to "Noted." on error
        const fallback: Message = {
          id: (Date.now() + 1).toString(),
          role: "coach",
          content: "Noted.",
        };
        setMessages(prev => [...prev, fallback]);
        await saveMessage(fallback);
      } finally {
        setIsGeneratingResponse(false);
      }
    }
  };

  const hasMessages = messages.length > 0;
  // Only show action buttons when calibration is complete (ACTIONS_ACTIVE or G&A_CONFIRMED)
  const isCalibrationComplete = calibration.canShowActions;
  const showActionButtons = !hasMessages && !activeAction && !loadingMessages && isCalibrationComplete;
  // Show tone selection when in calibration without a tone set
  const showToneButtons = calibration.isCalibrating && !calibration.state.tone && hasMessages;
  const showBackButton = activeAction !== null || (hasMessages && !calibration.isCalibrating);
  // Show skip button during calibration questions
  const showSkipButton = calibration.isCalibrating && calibration.state.tone && calibration.currentQuestion;
  
  // Determine if we're in a screenshot action flow step
  const inScreenshotActionStep = activeAction === "screenshot-context" && screenshotAction && currentScreenshotStepData;

  const renderInput = () => {
    // Handle screenshot flow inputs
    if (inScreenshotActionStep && currentScreenshotStepData) {
      if (currentScreenshotStepData.type === "select" && currentScreenshotStepData.options) {
        return (
          <div className="flex-1 flex flex-wrap gap-2">
            {currentScreenshotStepData.options.map((option) => (
              <button
                key={option}
                onClick={() => handleScreenshotSelectOption(option)}
                disabled={isSubmitting}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30 transition-all duration-200 disabled:opacity-50"
              >
                {option}
              </button>
            ))}
          </div>
        );
      }

      if (currentScreenshotStepData.type === "textarea") {
        return (
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleScreenshotStepSubmit()}
            onPaste={handlePaste}
            placeholder={currentScreenshotStepData.prompt}
            rows={2}
            className={`flex-1 bg-secondary/80 border border-primary/20 rounded-lg px-4 py-3 ${isMobile ? "text-base" : "text-sm"} text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 resize-none`}
          />
        );
      }

      return (
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleScreenshotStepSubmit()}
          onPaste={handlePaste}
          placeholder={currentScreenshotStepData.prompt}
          className={`flex-1 bg-secondary/80 border border-primary/20 rounded-lg px-4 ${isMobile ? "py-4 text-base" : "py-3.5"} text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 ${!isMobile && "focus:shadow-[0_0_20px_hsl(156_100%_50%/0.15)]"}`}
        />
      );
    }
    
    if (!currentStepData) {
      return (
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          onPaste={handlePaste}
          placeholder="Message or paste screenshot"
          className={`flex-1 bg-secondary/80 border border-primary/20 rounded-lg px-4 ${isMobile ? "py-4 text-base" : "py-3.5"} text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 ${!isMobile && "focus:shadow-[0_0_20px_hsl(156_100%_50%/0.15)]"}`}
        />
      );
    }

    if (currentStepData.type === "select" && currentStepData.options) {
      return (
        <div className="flex-1 flex flex-wrap gap-2">
          {currentStepData.options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelectOption(option)}
              disabled={isSubmitting}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30 transition-all duration-200 disabled:opacity-50"
            >
              {option}
            </button>
          ))}
        </div>
      );
    }

    if (currentStepData.type === "textarea") {
      return (
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleStepSubmit()}
          onPaste={handlePaste}
          placeholder={currentStepData.prompt}
          rows={2}
          className={`flex-1 bg-secondary/80 border border-primary/20 rounded-lg px-4 py-3 ${isMobile ? "text-base" : "text-sm"} text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 resize-none`}
        />
      );
    }

    if (currentStepData.type === "date") {
      return (
        <input
          type="date"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleStepSubmit()}
          className={`flex-1 bg-secondary/80 border border-primary/20 rounded-lg px-4 ${isMobile ? "py-4 text-base" : "py-3.5"} text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20`}
        />
      );
    }

    return (
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleStepSubmit()}
        onPaste={handlePaste}
        placeholder={currentStepData.prompt}
        className={`flex-1 bg-secondary/80 border border-primary/20 rounded-lg px-4 ${isMobile ? "py-4 text-base" : "py-3.5"} text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 ${!isMobile && "focus:shadow-[0_0_20px_hsl(156_100%_50%/0.15)]"}`}
      />
    );
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div 
        className={`flex flex-col h-full bg-background relative ${isDragging ? 'ring-2 ring-accent ring-inset' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-accent/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="bg-card border-2 border-dashed border-accent rounded-xl p-6 text-center">
              <ImagePlus className="w-10 h-10 text-accent mx-auto mb-2" />
              <p className="text-accent font-medium">Drop screenshot here</p>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
          {loadingMessages && (
            <div className="text-center text-muted-foreground text-sm">Loading...</div>
          )}

          {showActionButtons && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <span className="text-xs text-primary font-medium">RealCoach</span>
                <p className="text-base text-foreground leading-relaxed">
                  How can I help you today?
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {actionButtons.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleActionSelect(action.id)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30 transition-all duration-200 touch-target"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
                {/* Screenshot Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 hover:border-accent/50 transition-all duration-200 touch-target"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span>Screenshot</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {message.role === "coach" && (
                <div className="space-y-2">
                  <span className="text-xs text-primary font-medium">RealCoach</span>
                  <p className="text-base text-foreground leading-relaxed whitespace-pre-line">
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
                  <div className="bg-secondary rounded-lg px-4 py-3 max-w-[85%] border border-border/50">
                    {message.imageUrl && (
                      <img 
                        src={message.imageUrl} 
                        alt="Uploaded screenshot" 
                        className="rounded-md mb-2 max-h-48 object-contain"
                      />
                    )}
                    <p className="text-base text-foreground">{message.content}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Tone selection buttons during calibration (mobile) */}
          {showToneButtons && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Direct & Executive" };
                    setMessages(prev => [...prev, userMsg]);
                    calibration.setTone('DIRECT_EXECUTIVE');
                  }}
                  className="flex items-center gap-2 px-3 py-3 rounded-lg text-base font-medium bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30 transition-all duration-200 text-left touch-target"
                >
                  <span className="font-semibold">1.</span> Direct & Executive
                </button>
                <button
                  onClick={() => {
                    const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Coach-like" };
                    setMessages(prev => [...prev, userMsg]);
                    calibration.setTone('COACH_CONCISE');
                  }}
                  className="flex items-center gap-2 px-3 py-3 rounded-lg text-base font-medium bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30 transition-all duration-200 text-left touch-target"
                >
                  <span className="font-semibold">2.</span> Coach-like & Supportive
                </button>
                <button
                  onClick={() => {
                    const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Neutral & Minimal" };
                    setMessages(prev => [...prev, userMsg]);
                    calibration.setTone('NEUTRAL_MINIMAL');
                  }}
                  className="flex items-center gap-2 px-3 py-3 rounded-lg text-base font-medium bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30 transition-all duration-200 text-left touch-target"
                >
                  <span className="font-semibold">3.</span> Neutral & Minimal
                </button>
              </div>
            </div>
          )}

          {/* Calibration progress indicator with step counter (mobile - Stream 2) */}
          {calibration.isCalibrating && calibration.state.tone && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {calibration.currentQuestion
                    ? `Question ${(calibration.state.currentQuestionIndex || 0) + 1} of 7`
                    : 'Calibration Progress'}
                </span>
                <span>{calibration.progress}%</span>
              </div>
              <Progress value={calibration.progress} className="h-1.5" />
              {/* Skip button during calibration questions (mobile - Stream 2) */}
              {calibration.currentQuestion && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => calibration.skipQuestion?.()}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <SkipForward className="w-3 h-3 mr-1" />
                  Skip this question
                </Button>
              )}
            </div>
          )}

          {/* Missed-day choice UI (mobile - Stream 4) */}
          {engine.needsMissedDayChoice && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg animate-fade-in">
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                Looks like yesterday didn't go as planned.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleMissedDayChoiceWithResponse('UNPACK')}
                  className="text-xs"
                >
                  Let's talk about it
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMissedDayChoiceWithResponse('SKIP')}
                  className="text-xs"
                >
                  Move on
                </Button>
              </div>
            </div>
          )}

          {/* G&A Draft Confirm/Edit buttons (mobile - Stream 2) */}
          {calibration.state.userState === 'G&A_DRAFTED' && (
            <div className="flex gap-2 animate-fade-in">
              <Button
                onClick={() => calibration.confirmGoalsAndActions()}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const editMsg: Message = {
                    id: Date.now().toString(),
                    role: 'user',
                    content: 'I want to edit something',
                  };
                  setMessages(prev => [...prev, editMsg]);
                  setTimeout(() => {
                    const askMsg: Message = {
                      id: (Date.now() + 1).toString(),
                      role: 'coach',
                      content: 'What would you like to change?',
                    };
                    setMessages(prev => [...prev, askMsg]);
                  }, 500);
                }}
                className="flex-1"
              >
                Edit
              </Button>
            </div>
          )}

          {/* LLM generating response indicator (mobile) */}
          {isGeneratingResponse && (
            <div className="space-y-2 animate-fade-in">
              <span className="text-xs text-primary font-medium">RealCoach</span>
              <div className="flex items-center gap-2 text-base text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}

          {/* Analyzing screenshot state */}
          {isAnalyzing && (
            <div className="space-y-2 animate-fade-in">
              <span className="text-xs text-primary font-medium">RealCoach</span>
              <div className="flex items-center gap-2 text-base text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing your screenshot...</span>
              </div>
            </div>
          )}

          {/* Screenshot action selection buttons */}
          {activeAction === "screenshot-context" && !screenshotAction && !isSubmitting && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex flex-wrap gap-2">
                {screenshotActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleScreenshotActionSelect(action.id)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30 transition-all duration-200 touch-target"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Screenshot flow step prompt */}
          {currentScreenshotStepData && !isSubmitting && (
            <div className="space-y-2 animate-fade-in">
              <span className="text-xs text-primary font-medium">RealCoach</span>
              <p className="text-base text-foreground leading-relaxed">
                {currentScreenshotStepData.prompt}
              </p>
            </div>
          )}

          {currentStepData && !isSubmitting && (
            <div className="space-y-2 animate-fade-in">
              <span className="text-xs text-primary font-medium">RealCoach</span>
              <p className="text-base text-foreground leading-relaxed">
                {currentStepData.prompt}
              </p>
            </div>
          )}

          {isSubmitting && (
            <div className="space-y-2 animate-fade-in">
              <span className="text-xs text-primary font-medium">RealCoach</span>
              <p className="text-base text-muted-foreground leading-relaxed">
                Saving...
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border safe-area-bottom">
          <div className="relative">
            <div className="absolute -inset-1 bg-primary/10 blur-lg opacity-50 rounded-xl pointer-events-none" />
            <div className="relative flex gap-2 items-end">
              {showBackButton && (
                <button
                  onClick={handleBack}
                  className="p-4 bg-secondary border border-border rounded-lg hover:bg-muted transition-colors touch-target"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
              {renderInput()}
              <button
                onClick={() => setSupportOpen(true)}
                className="p-4 bg-secondary border border-border rounded-lg hover:bg-muted transition-colors touch-target"
                aria-label="Report an issue"
              >
                <Bot className="w-5 h-5 text-muted-foreground" />
              </button>
              {currentStepData?.type !== "select" && currentScreenshotStepData?.type !== "select" && (
                <button
                  onClick={handleSend}
                  disabled={isSubmitting}
                  className="relative p-4 rounded-lg transition-all duration-200 touch-target disabled:opacity-50 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-primary" />
                  <div className="absolute -inset-1 bg-primary/40 blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10 text-black">
                    {isSubmitting ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
        <SupportFormModal open={supportOpen} onOpenChange={setSupportOpen} />
      </div>
    );
  }

  // Desktop layout
  return (
    <div 
      className="relative w-96 h-full flex-shrink-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="absolute -inset-1 bg-primary/10 blur-xl opacity-40 pointer-events-none" />
      <div className="absolute -inset-0.5 bg-primary/5 blur-md opacity-50 pointer-events-none" />
      
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-accent/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-card border-2 border-dashed border-accent rounded-xl p-6 text-center">
            <ImagePlus className="w-10 h-10 text-accent mx-auto mb-2" />
            <p className="text-accent font-medium">Drop screenshot here</p>
          </div>
        </div>
      )}
      
      <div className={`relative h-full flex flex-col bg-sidebar border-l border-primary/20 shadow-[inset_4px_0_30px_hsl(156_100%_50%/0.05)] ${isDragging ? 'ring-2 ring-accent ring-inset' : ''}`}>
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <div className="relative p-5 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-md rounded-lg" />
                <div className="relative w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-medium text-foreground">RealCoach</h3>
                <p className="text-xs text-muted-foreground">Assistant</p>
              </div>
            </div>
            {/* Mode indicator (Stream 4) */}
            {calibration.canShowActions && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  {engine.isInDirectMode ? 'Direct' : engine.getCurrentMode()}
                </span>
                {engine.getCurrentMove() !== 'NONE' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                    {engine.getCurrentMove()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
          {loadingMessages && (
            <div className="text-center text-muted-foreground text-sm">Loading...</div>
          )}

          {showActionButtons && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-2">
                <span className="text-xs text-primary font-medium">RealCoach</span>
                <p className="text-sm text-sidebar-foreground leading-relaxed">
                  How can I help you today?
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {actionButtons.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleActionSelect(action.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30 transition-all duration-200"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
                {/* Screenshot Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 hover:border-accent/50 transition-all duration-200"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span>Screenshot</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {message.role === "coach" && (
                <div className="space-y-2">
                  <span className="text-xs text-primary font-medium">RealCoach</span>
                  <p className="text-sm text-sidebar-foreground leading-relaxed whitespace-pre-line">
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
                  <div className="bg-secondary rounded-lg px-4 py-2.5 max-w-[90%] border border-border/50">
                    {message.imageUrl && (
                      <img 
                        src={message.imageUrl} 
                        alt="Uploaded screenshot" 
                        className="rounded-md mb-2 max-h-40 object-contain"
                      />
                    )}
                    <p className="text-sm text-foreground">{message.content}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Tone selection buttons during calibration */}
          {showToneButtons && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Direct & Executive" };
                    setMessages(prev => [...prev, userMsg]);
                    calibration.setTone('DIRECT_EXECUTIVE');
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30 transition-all duration-200 text-left"
                >
                  <span className="font-semibold">1.</span> Direct & Executive
                </button>
                <button
                  onClick={() => {
                    const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Coach-like" };
                    setMessages(prev => [...prev, userMsg]);
                    calibration.setTone('COACH_CONCISE');
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30 transition-all duration-200 text-left"
                >
                  <span className="font-semibold">2.</span> Coach-like & Supportive
                </button>
                <button
                  onClick={() => {
                    const userMsg: Message = { id: Date.now().toString(), role: "user", content: "Neutral & Minimal" };
                    setMessages(prev => [...prev, userMsg]);
                    calibration.setTone('NEUTRAL_MINIMAL');
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30 transition-all duration-200 text-left"
                >
                  <span className="font-semibold">3.</span> Neutral & Minimal
                </button>
              </div>
            </div>
          )}

          {/* Calibration progress indicator with step counter (Stream 2) */}
          {calibration.isCalibrating && calibration.state.tone && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {calibration.currentQuestion
                    ? `Question ${(calibration.state.currentQuestionIndex || 0) + 1} of 7`
                    : 'Calibration Progress'}
                </span>
                <span>{calibration.progress}%</span>
              </div>
              <Progress value={calibration.progress} className="h-1" />
              {/* Skip button during calibration questions (Stream 2) */}
              {calibration.currentQuestion && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => calibration.skipQuestion?.()}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <SkipForward className="w-3 h-3 mr-1" />
                  Skip this question
                </Button>
              )}
            </div>
          )}

          {/* Missed-day choice UI (Stream 4) */}
          {engine.needsMissedDayChoice && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg animate-fade-in">
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                Looks like yesterday didn't go as planned.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleMissedDayChoiceWithResponse('UNPACK')}
                  className="text-xs"
                >
                  Let's talk about it
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMissedDayChoiceWithResponse('SKIP')}
                  className="text-xs"
                >
                  Move on
                </Button>
              </div>
            </div>
          )}

          {/* G&A Draft Confirm/Edit buttons (Stream 2) */}
          {calibration.state.userState === 'G&A_DRAFTED' && (
            <div className="flex gap-2 animate-fade-in">
              <Button
                onClick={() => calibration.confirmGoalsAndActions()}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const editMsg: Message = {
                    id: Date.now().toString(),
                    role: 'user',
                    content: 'I want to edit something',
                  };
                  setMessages(prev => [...prev, editMsg]);
                  setTimeout(() => {
                    const askMsg: Message = {
                      id: (Date.now() + 1).toString(),
                      role: 'coach',
                      content: 'What would you like to change?',
                    };
                    setMessages(prev => [...prev, askMsg]);
                  }, 500);
                }}
                className="flex-1"
              >
                Edit
              </Button>
            </div>
          )}

          {/* LLM generating response indicator (desktop) */}
          {isGeneratingResponse && (
            <div className="space-y-2 animate-fade-in">
              <span className="text-xs text-primary font-medium">RealCoach</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}

          {/* Analyzing screenshot state */}
          {isAnalyzing && (
            <div className="space-y-2 animate-fade-in">
              <span className="text-xs text-primary font-medium">RealCoach</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing your screenshot...</span>
              </div>
            </div>
          )}

          {/* Screenshot action selection buttons */}
          {activeAction === "screenshot-context" && !screenshotAction && !isSubmitting && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex flex-wrap gap-2">
                {screenshotActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleScreenshotActionSelect(action.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30 transition-all duration-200"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Screenshot flow step prompt */}
          {currentScreenshotStepData && !isSubmitting && (
            <div className="space-y-2 animate-fade-in">
              <span className="text-xs text-primary font-medium">RealCoach</span>
              <p className="text-sm text-sidebar-foreground leading-relaxed">
                {currentScreenshotStepData.prompt}
              </p>
            </div>
          )}

          {currentStepData && !isSubmitting && (
            <div className="space-y-2 animate-fade-in">
              <span className="text-xs text-primary font-medium">RealCoach</span>
              <p className="text-sm text-sidebar-foreground leading-relaxed">
                {currentStepData.prompt}
              </p>
            </div>
          )}

          {isSubmitting && (
            <div className="space-y-2 animate-fade-in">
              <span className="text-xs text-primary font-medium">RealCoach</span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Saving...
              </p>
            </div>
          )}
        </div>

        <div className="relative p-5 border-t border-primary/10">
          <div className="relative">
            <div className="absolute -inset-1 bg-primary/10 blur-lg opacity-50 rounded-xl pointer-events-none" />
            <div className="absolute -inset-0.5 bg-primary/5 blur-md opacity-60 rounded-lg pointer-events-none" />
            
            <div className="relative flex gap-2 items-end">
              {showBackButton && (
                <button
                  onClick={handleBack}
                  className="p-2.5 bg-secondary border border-border rounded-lg hover:bg-muted transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              {renderInput()}
              <button
                onClick={() => setSupportOpen(true)}
                className="p-2.5 bg-secondary border border-border rounded-lg hover:bg-muted transition-colors"
                aria-label="Report an issue"
              >
                <Bot className="w-4 h-4 text-muted-foreground" />
              </button>
              {currentStepData?.type !== "select" && currentScreenshotStepData?.type !== "select" && (
                <button
                  onClick={handleSend}
                  disabled={isSubmitting}
                  className="relative p-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-primary" />
                  <div className="absolute -inset-1 bg-primary/40 blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10 text-black">
                    {isSubmitting ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
        <SupportFormModal open={supportOpen} onOpenChange={setSupportOpen} />
      </div>
    </div>
  );
}
