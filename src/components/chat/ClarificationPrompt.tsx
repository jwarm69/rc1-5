/**
 * RealCoach.ai - Clarification Prompt Component
 *
 * Displayed when the AI needs more context about what the user
 * wants to do with the uploaded screenshot.
 */

import React, { useState } from 'react';
import { HelpCircle, Send } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// ============================================================================
// TYPES
// ============================================================================

export interface ClarificationPromptProps {
  /** Called when user submits their intent */
  onSubmit: (intent: string) => void;
  /** Called when user wants to skip/cancel */
  onSkip: () => void;
  /** Suggested prompts to help user */
  suggestions?: string[];
  /** Whether submission is in progress */
  isLoading?: boolean;
  /** Optional className for styling */
  className?: string;
}

// ============================================================================
// DEFAULT SUGGESTIONS
// ============================================================================

const DEFAULT_SUGGESTIONS = [
  'Help me follow up with this person',
  'Add this to my contact notes',
  'Find time conflicts in my calendar',
  'Summarize this conversation',
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ClarificationPrompt({
  onSubmit,
  onSkip,
  suggestions = DEFAULT_SUGGESTIONS,
  isLoading = false,
  className = '',
}: ClarificationPromptProps) {
  const [intent, setIntent] = useState('');

  const handleSubmit = () => {
    if (intent.trim()) {
      onSubmit(intent.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSubmit(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <HelpCircle className="h-4 w-4" />
          What would you like to do?
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          I've received your screenshot. Help me understand what you'd like me to do with it.
        </p>

        {/* Suggestion buttons */}
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isLoading}
              className="text-xs"
            >
              {suggestion}
            </Button>
          ))}
        </div>

        {/* Custom intent input */}
        <div className="space-y-2">
          <label htmlFor="intent-input" className="text-sm font-medium">
            Or describe what you need:
          </label>
          <Textarea
            id="intent-input"
            placeholder="e.g., Help me remember to call Sarah back about the property..."
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={2}
            className="resize-none"
          />
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-4 border-t">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !intent.trim()}
          size="sm"
          className="flex-1"
        >
          <Send className="h-4 w-4 mr-1" />
          Continue
        </Button>
        <Button
          onClick={onSkip}
          disabled={isLoading}
          variant="ghost"
          size="sm"
        >
          Skip
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ClarificationPrompt;
