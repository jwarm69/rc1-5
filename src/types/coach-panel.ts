// Types for CoachPanel and related components

export type ActionType =
  | "update-opportunity"
  | "add-note"
  | "schedule-meeting"
  | "provide-actions"
  | "screenshot-context"
  | null;

export type ScreenshotActionType =
  | "update-stage"
  | "update-notes"
  | "draft-email"
  | "schedule-actions"
  | "add-note"
  | null;

export interface ChatMessage {
  id: string;
  role: "coach" | "user" | "system";
  content: string;
  action?: ActionType;
  imageUrl?: string;
}

export interface FlowStep {
  field: string;
  prompt: string;
  type: "text" | "select" | "date" | "textarea";
  options?: string[];
}

export interface FlowData {
  [key: string]: string;
}

export interface ActionButton {
  id: ActionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ScreenshotAction {
  id: ScreenshotActionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}
