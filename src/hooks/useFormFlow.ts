import { useState, useCallback } from "react";
import { FlowStep, FlowData } from "@/types/coach-panel";

export interface UseFormFlowOptions<TActionType extends string | null> {
  flows: Record<string, FlowStep[]>;
  onStepComplete?: (flowData: FlowData, actionType: TActionType) => void;
  onFlowComplete: (flowData: FlowData, actionType: TActionType) => Promise<void>;
}

export interface UseFormFlowReturn<TActionType extends string | null> {
  activeAction: TActionType;
  currentStep: number;
  flowData: FlowData;
  currentFlow: FlowStep[] | null;
  currentStepData: FlowStep | null;
  isSubmitting: boolean;
  setActiveAction: (action: TActionType) => void;
  startFlow: (actionType: TActionType) => void;
  handleStepSubmit: (value: string) => Promise<void>;
  handleSelectOption: (option: string) => Promise<void>;
  goBack: () => boolean; // Returns true if went back, false if at start
  reset: () => void;
}

export function useFormFlow<TActionType extends string | null>({
  flows,
  onStepComplete,
  onFlowComplete,
}: UseFormFlowOptions<TActionType>): UseFormFlowReturn<TActionType> {
  const [activeAction, setActiveAction] = useState<TActionType>(null as TActionType);
  const [currentStep, setCurrentStep] = useState(0);
  const [flowData, setFlowData] = useState<FlowData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentFlow = activeAction && activeAction !== "screenshot-context"
    ? flows[activeAction as string] || null
    : null;
  const currentStepData = currentFlow ? currentFlow[currentStep] : null;

  const startFlow = useCallback((actionType: TActionType) => {
    setActiveAction(actionType);
    setCurrentStep(0);
    setFlowData({});
  }, []);

  const reset = useCallback(() => {
    setActiveAction(null as TActionType);
    setCurrentStep(0);
    setFlowData({});
    setIsSubmitting(false);
  }, []);

  const goBack = useCallback((): boolean => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      return true;
    }
    return false;
  }, [currentStep]);

  const processStep = useCallback(
    async (value: string) => {
      if (!currentStepData || !currentFlow || !activeAction) return;

      const newFlowData = { ...flowData, [currentStepData.field]: value };
      setFlowData(newFlowData);

      if (currentStep === currentFlow.length - 1) {
        // Last step - complete the flow
        setIsSubmitting(true);
        try {
          await onFlowComplete(newFlowData, activeAction);
        } finally {
          setIsSubmitting(false);
        }
      } else {
        // Move to next step
        setCurrentStep((prev) => prev + 1);
        onStepComplete?.(newFlowData, activeAction);
      }
    },
    [currentStepData, currentFlow, activeAction, flowData, currentStep, onFlowComplete, onStepComplete]
  );

  const handleStepSubmit = useCallback(
    async (value: string) => {
      if (!value.trim() && currentStepData?.type !== "select") return;
      await processStep(value.trim());
    },
    [processStep, currentStepData]
  );

  const handleSelectOption = useCallback(
    async (option: string) => {
      await processStep(option);
    },
    [processStep]
  );

  return {
    activeAction,
    currentStep,
    flowData,
    currentFlow,
    currentStepData,
    isSubmitting,
    setActiveAction,
    startFlow,
    handleStepSubmit,
    handleSelectOption,
    goBack,
    reset,
  };
}
