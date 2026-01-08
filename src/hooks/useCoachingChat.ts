/**
 * RealCoach.ai - Coaching Chat Hook
 *
 * Provides calibration-aware chat functionality for the CoachPanel.
 * Handles the flow from calibration questions through to regular coaching.
 *
 * Key Behaviors:
 * - When in calibration mode, routes messages through calibration flow
 * - Enforces one-question-at-a-time rule
 * - Detects Fast Lane triggers
 * - Transitions to regular coaching after G&A confirmation
 */

import { useState, useCallback, useEffect } from 'react';
import { useCalibration } from '@/contexts/CalibrationContext';
import { GA_CALIBRATION_QUESTIONS, FAST_LANE_QUESTIONS } from '@/types/coaching';

export interface ChatMessage {
  id: string;
  role: 'coach' | 'user' | 'system';
  content: string;
  imageUrl?: string;
  isCalibrationQuestion?: boolean;
  questionId?: string;
}

interface UseCoachingChatReturn {
  messages: ChatMessage[];
  isCalibrating: boolean;
  canShowActions: boolean;
  progress: number;
  statusText: string;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
  skipCurrentQuestion: () => void;
}

/**
 * Get the welcome message based on calibration state
 */
function getWelcomeMessage(isCalibrating: boolean, isFastLane: boolean): string {
  if (isFastLane) {
    return "Got it — let's keep this quick. Just 2 questions and you're in.";
  }
  if (isCalibrating) {
    return "Let's get started. I'm going to ask you a few questions to understand what you're trying to accomplish. This helps me give you better, more specific guidance.\n\nReady?";
  }
  return "How can I help you today?";
}

/**
 * Get the tone selection prompt
 */
function getToneSelectionPrompt(): string {
  return "First, how would you like me to communicate with you?\n\n• Direct & Executive — straight to the point\n• Coach-like — supportive but concise\n• Neutral & Minimal — just the facts";
}

export function useCoachingChat(): UseCoachingChatReturn {
  const {
    state,
    isCalibrating,
    canShowActions,
    progress,
    statusText,
    currentQuestion,
    start,
    setTone,
    answerQuestion,
    skipQuestion,
    checkForFastLane,
    triggerFastLane,
  } = useCalibration();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasStarted, setHasStarted] = useState(false);

  // Initialize with welcome message when component mounts
  useEffect(() => {
    if (!hasStarted && state.userState === 'UNINITIALIZED') {
      setHasStarted(true);
      // Start calibration automatically
      start();
    }
  }, [hasStarted, state.userState, start]);

  // Add the first calibration message when calibration starts
  useEffect(() => {
    if (state.userState === 'CALIBRATING' && messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'coach',
        content: getWelcomeMessage(true, state.fastLaneTriggered),
      };
      setMessages([welcomeMsg]);

      // If no tone set yet, ask for tone preference
      if (!state.tone) {
        setTimeout(() => {
          const toneMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'coach',
            content: getToneSelectionPrompt(),
            isCalibrationQuestion: true,
            questionId: 'tone_selection',
          };
          setMessages(prev => [...prev, toneMsg]);
        }, 1000);
      }
    }
  }, [state.userState, state.tone, state.fastLaneTriggered, messages.length]);

  // Add calibration question when tone is set and we have a current question
  useEffect(() => {
    if (state.userState === 'CALIBRATING' && state.tone && currentQuestion) {
      // Check if we already have this question in messages
      const hasQuestion = messages.some(m => m.questionId === currentQuestion.id);
      if (!hasQuestion) {
        setTimeout(() => {
          const questionMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'coach',
            content: currentQuestion.question,
            isCalibrationQuestion: true,
            questionId: currentQuestion.id,
          };
          setMessages(prev => [...prev, questionMsg]);
        }, 500);
      }
    }
  }, [state.userState, state.tone, currentQuestion, messages]);

  // Handle G&A draft completion
  useEffect(() => {
    if (state.userState === 'G&A_DRAFTED' && state.goalsAndActions) {
      const draftMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'coach',
        content: formatGADraft(state.goalsAndActions),
        isCalibrationQuestion: true,
        questionId: 'ga_confirmation',
      };
      setMessages(prev => [...prev, draftMsg]);
    }
  }, [state.userState, state.goalsAndActions]);

  // Handle G&A confirmation
  useEffect(() => {
    if (state.userState === 'G&A_CONFIRMED') {
      const confirmMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'coach',
        content: "Your Goals & Actions are confirmed. I'll use this as our foundation.\n\nFrom now on, I'll give you focused daily actions that move you toward your monthly milestone. Let's get to work.",
      };
      setMessages(prev => [...prev, confirmMsg]);
    }
  }, [state.userState]);

  // Handle ACTIONS_ACTIVE state
  useEffect(() => {
    if (state.userState === 'ACTIONS_ACTIVE') {
      setTimeout(() => {
        const actionMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'coach',
          content: "What did you get done yesterday?",
        };
        setMessages(prev => [...prev, actionMsg]);
      }, 1500);
    }
  }, [state.userState]);

  /**
   * Send a message from the user
   */
  const sendMessage = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    // Add user message to chat
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
    };
    setMessages(prev => [...prev, userMsg]);

    // Check for Fast Lane trigger
    if (isCalibrating && checkForFastLane(trimmed)) {
      triggerFastLane();
      setTimeout(() => {
        const fastLaneMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'coach',
          content: getWelcomeMessage(true, true),
        };
        setMessages(prev => [...prev, fastLaneMsg]);
      }, 500);
      return;
    }

    // Handle tone selection
    if (state.userState === 'CALIBRATING' && !state.tone) {
      const lower = trimmed.toLowerCase();
      if (lower.includes('direct') || lower.includes('executive')) {
        setTone('DIRECT_EXECUTIVE');
      } else if (lower.includes('coach') || lower.includes('supportive')) {
        setTone('COACH_CONCISE');
      } else {
        setTone('NEUTRAL_MINIMAL');
      }
      return;
    }

    // Handle calibration question answers
    if (state.userState === 'CALIBRATING' && currentQuestion) {
      answerQuestion(currentQuestion.id, trimmed);
      return;
    }

    // Handle G&A confirmation
    if (state.userState === 'G&A_DRAFTED') {
      const lower = trimmed.toLowerCase();
      if (lower.includes('yes') || lower.includes('confirm') || lower.includes('looks good') || lower.includes('approved')) {
        // Confirmation handled by context
        return;
      }
      // Otherwise, user wants to edit - add their feedback
      setTimeout(() => {
        const editMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'coach',
          content: "Got it. What would you like to change?",
        };
        setMessages(prev => [...prev, editMsg]);
      }, 500);
      return;
    }

    // Regular coaching mode
    if (canShowActions) {
      // TODO: Route through coaching engine
      setTimeout(() => {
        const coachMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'coach',
          content: "Noted. Let me process that.",
        };
        setMessages(prev => [...prev, coachMsg]);
      }, 500);
    }
  }, [
    isCalibrating,
    canShowActions,
    state.userState,
    state.tone,
    currentQuestion,
    checkForFastLane,
    triggerFastLane,
    setTone,
    answerQuestion,
  ]);

  /**
   * Skip the current calibration question
   */
  const skipCurrentQuestion = useCallback(() => {
    if (currentQuestion) {
      skipQuestion(currentQuestion.id);

      const skipMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: "(skipped)",
      };
      setMessages(prev => [...prev, skipMsg]);
    }
  }, [currentQuestion, skipQuestion]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isCalibrating,
    canShowActions,
    progress,
    statusText,
    sendMessage,
    clearMessages,
    skipCurrentQuestion,
  };
}

/**
 * Format the G&A draft for display
 */
function formatGADraft(ga: any): string {
  return `Here's what I've captured:

**Annual Professional Goal**
${ga.annualProfessionalGoal || '(not specified)'}

**Personal Priority/Constraint**
${ga.annualPersonalGoal || '(not specified)'}

**Current Reality**
${ga.currentReality || '(not specified)'}

**30-Day Milestone**
${ga.monthlyMilestone || '(not specified)'}

**Execution Style**
${formatExecutionStyle(ga.executionStyle)}

**What You're Willing to Do**
${ga.willingnessFilter?.length > 0 ? ga.willingnessFilter.join(', ') : '(not specified)'}

**What to Avoid**
${ga.frictionBoundaries?.length > 0 ? ga.frictionBoundaries.join(', ') : '(not specified)'}

Does this look right? Say "yes" to confirm, or tell me what you'd like to change.`;
}

function formatExecutionStyle(style: string | undefined): string {
  switch (style) {
    case 'STRUCTURED':
      return 'Structured and planned';
    case 'FLEXIBLE':
      return 'Flexible and adaptable';
    case 'SHORT_BURSTS':
      return 'Short bursts of intense focus';
    case 'SLOW_CONSISTENT':
      return 'Slow and consistent';
    default:
      return 'Flexible';
  }
}
