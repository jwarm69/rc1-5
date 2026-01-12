/**
 * RealCoach.ai - Interpretation Card Component
 *
 * Displays the AI's interpretation of uploaded screenshots.
 * Shows "Here's what I see" with summary, people, dates, and patterns.
 * User must explicitly confirm/adjust/reject before signals are generated.
 *
 * CRITICAL: No database writes until user confirms.
 */

import React from 'react';
import { Camera, User, Calendar, AlertCircle, Check, X, Edit } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ScreenshotInterpretation,
  ContentType,
  CONTENT_TYPE_LABELS,
  DetectedPattern,
} from '@/types/screenshot';

// ============================================================================
// TYPES
// ============================================================================

export interface InterpretationCardProps {
  /** The AI interpretation to display */
  interpretation: ScreenshotInterpretation;
  /** Called when user confirms the interpretation */
  onConfirm: () => void;
  /** Called when user wants to adjust/clarify the interpretation */
  onAdjust: () => void;
  /** Called when user rejects the interpretation */
  onReject: () => void;
  /** Whether actions are currently being processed */
  isLoading?: boolean;
  /** Optional className for styling */
  className?: string;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Severity badge styling
 */
function getSeverityBadgeVariant(severity: 'low' | 'medium' | 'high'): 'default' | 'secondary' | 'destructive' {
  switch (severity) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
    default:
      return 'secondary';
  }
}

/**
 * Content type icon
 */
function ContentTypeIcon({ contentType }: { contentType: ContentType }) {
  // Use Camera as default icon for screenshot content
  return <Camera className="h-4 w-4" />;
}

/**
 * Pattern item display
 */
function PatternItem({ pattern }: { pattern: DetectedPattern }) {
  return (
    <div className="flex items-start gap-2">
      <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm">{pattern.description}</span>
          <Badge variant={getSeverityBadgeVariant(pattern.severity)} className="text-xs">
            {pattern.severity}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function InterpretationCard({
  interpretation,
  onConfirm,
  onAdjust,
  onReject,
  isLoading = false,
  className = '',
}: InterpretationCardProps) {
  const {
    contentType,
    summary,
    peopleDetected,
    datesDetected,
    patterns,
    inferredIntent,
    confidence,
  } = interpretation;

  const contentTypeLabel = CONTENT_TYPE_LABELS[contentType] || 'Unknown Content';
  const confidencePercent = Math.round(confidence * 100);

  return (
    <Card className={`w-full ${className}`}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <ContentTypeIcon contentType={contentType} />
            Here's what I see:
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {contentTypeLabel}
          </Badge>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-4">
        {/* Summary bullets */}
        {summary.length > 0 && (
          <div className="space-y-1">
            <ul className="space-y-1.5 text-sm">
              {summary.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* People detected */}
        {peopleDetected.length > 0 && (
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex flex-wrap gap-1.5">
              {peopleDetected.map((person, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {person}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Dates detected */}
        {datesDetected.length > 0 && (
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex flex-wrap gap-1.5">
              {datesDetected.map((date, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {date}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Patterns detected */}
        {patterns.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Patterns Detected
            </span>
            <div className="space-y-2">
              {patterns.map((pattern, index) => (
                <PatternItem key={index} pattern={pattern} />
              ))}
            </div>
          </div>
        )}

        {/* Inferred intent */}
        {inferredIntent && (
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground italic">
              I'm assuming you want help with: <span className="font-medium text-foreground">{inferredIntent}</span>
            </p>
            <p className="text-sm mt-1">Is that right?</p>
          </div>
        )}

        {/* Confidence indicator */}
        <div className="flex items-center gap-2 pt-2">
          <span className="text-xs text-muted-foreground">Confidence:</span>
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{confidencePercent}%</span>
        </div>
      </CardContent>

      {/* Action buttons */}
      <CardFooter className="flex gap-2 pt-4 border-t">
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          size="sm"
          className="flex-1"
        >
          <Check className="h-4 w-4 mr-1" />
          Yes
        </Button>
        <Button
          onClick={onAdjust}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Edit className="h-4 w-4 mr-1" />
          Adjust
        </Button>
        <Button
          onClick={onReject}
          disabled={isLoading}
          variant="ghost"
          size="sm"
          className="flex-1"
        >
          <X className="h-4 w-4 mr-1" />
          No
        </Button>
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// LOADING STATE COMPONENT
// ============================================================================

export function InterpretationCardLoading({ className = '' }: { className?: string }) {
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Camera className="h-4 w-4 animate-pulse" />
          Analyzing screenshot...
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ERROR STATE COMPONENT
// ============================================================================

export function InterpretationCardError({
  error,
  onRetry,
  onDismiss,
  className = '',
}: {
  error: string;
  onRetry: () => void;
  onDismiss: () => void;
  className?: string;
}) {
  return (
    <Card className={`w-full border-destructive ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium text-destructive">
          <AlertCircle className="h-4 w-4" />
          Failed to analyze screenshot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{error}</p>
      </CardContent>
      <CardFooter className="flex gap-2 pt-4 border-t">
        <Button onClick={onRetry} variant="outline" size="sm">
          Try Again
        </Button>
        <Button onClick={onDismiss} variant="ghost" size="sm">
          Dismiss
        </Button>
      </CardFooter>
    </Card>
  );
}

export default InterpretationCard;
