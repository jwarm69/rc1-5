/**
 * RealCoach.ai - Upload Context
 *
 * Manages screenshot upload state machine and interpretation flow.
 * Handles the journey from image upload to signal generation.
 *
 * Key Non-Negotiables:
 * - NO silent database writes - signals only
 * - Confirmation is MANDATORY before signals
 * - Screenshots deleted after interpretation
 * - Max 10 images per upload, 10 uploads per day
 */

import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import {
  UploadState,
  UploadedImage,
  ScreenshotInterpretation,
  ScreenshotSignal,
  UploadContextState,
  UploadAction,
  INITIAL_UPLOAD_STATE,
  UPLOAD_STATE_TRANSITIONS,
  MAX_IMAGES_PER_UPLOAD,
  MAX_UPLOADS_PER_DAY,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
} from '@/types/screenshot';

// ============================================================================
// TYPES
// ============================================================================

interface UploadContextValue {
  // State
  state: UploadContextState;

  // Computed values
  canUpload: boolean;
  isInterpreting: boolean;
  hasInterpretation: boolean;
  imageCount: number;
  remainingUploadsToday: number;

  // Actions
  addImages: (files: File[]) => Promise<{ success: boolean; error?: string }>;
  removeImage: (id: string) => void;
  setUserIntent: (intent: string) => void;
  startInterpretation: () => void;
  setInterpretation: (interpretation: ScreenshotInterpretation) => void;
  requestClarification: () => void;
  confirmInterpretation: () => void;
  adjustInterpretation: (newIntent: string) => void;
  rejectInterpretation: () => void;
  setSignals: (signals: ScreenshotSignal[]) => void;
  setError: (error: string) => void;
  reset: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Validate state transition
 */
function isValidTransition(from: UploadState, to: UploadState): boolean {
  return UPLOAD_STATE_TRANSITIONS[from].includes(to);
}

/**
 * Generate unique ID for images
 */
function generateId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate image file
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return { valid: false, error: `Invalid file type: ${file.type}. Allowed: PNG, JPEG, GIF, WebP` };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File too large: ${sizeMB}MB. Maximum: 10MB` };
  }
  return { valid: true };
}

/**
 * Convert file to base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get pure base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Check if we're on a new day (for daily limit reset)
 */
function isNewDay(lastDate?: string): boolean {
  if (!lastDate) return true;
  const today = new Date().toISOString().split('T')[0];
  return lastDate !== today;
}

/**
 * Get today's date string
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================================================================
// REDUCER
// ============================================================================

function uploadReducer(
  state: UploadContextState,
  action: UploadAction
): UploadContextState {
  switch (action.type) {
    case 'ADD_IMAGES': {
      // Check daily limit reset
      const dailyCount = isNewDay(state.lastUploadDate) ? 0 : state.dailyUploadCount;

      return {
        ...state,
        uploadState: 'UPLOAD_RECEIVED',
        images: [...state.images, ...action.payload].slice(0, MAX_IMAGES_PER_UPLOAD),
        dailyUploadCount: dailyCount,
        lastUploadDate: getTodayString(),
        error: undefined,
      };
    }

    case 'REMOVE_IMAGE': {
      const newImages = state.images.filter(img => img.id !== action.payload);
      // Revoke the blob URL to free memory
      const removedImage = state.images.find(img => img.id === action.payload);
      if (removedImage?.previewUrl) {
        URL.revokeObjectURL(removedImage.previewUrl);
      }
      return {
        ...state,
        images: newImages,
        // If no images left, go back to IDLE
        uploadState: newImages.length === 0 ? 'UPLOAD_IDLE' : state.uploadState,
      };
    }

    case 'SET_USER_INTENT':
      return {
        ...state,
        userIntent: action.payload,
      };

    case 'START_INTERPRETATION':
      if (!isValidTransition(state.uploadState, 'UPLOAD_INTERPRETING')) {
        console.warn(`Invalid transition from ${state.uploadState} to UPLOAD_INTERPRETING`);
        return state;
      }
      return {
        ...state,
        uploadState: 'UPLOAD_INTERPRETING',
        error: undefined,
      };

    case 'SET_INTERPRETATION':
      return {
        ...state,
        uploadState: 'UPLOAD_AWAITING_CONFIRMATION',
        interpretation: action.payload,
      };

    case 'NEEDS_CLARIFICATION':
      return {
        ...state,
        uploadState: 'UPLOAD_NEEDS_CLARIFICATION',
      };

    case 'CONFIRM_INTERPRETATION':
      if (!isValidTransition(state.uploadState, 'UPLOAD_CONFIRMED')) {
        console.warn(`Invalid transition from ${state.uploadState} to UPLOAD_CONFIRMED`);
        return state;
      }
      return {
        ...state,
        uploadState: 'UPLOAD_CONFIRMED',
        dailyUploadCount: state.dailyUploadCount + 1,
      };

    case 'SET_SIGNALS':
      return {
        ...state,
        signals: action.payload,
      };

    case 'ADJUST_INTERPRETATION':
      return {
        ...state,
        uploadState: 'UPLOAD_INTERPRETING',
        userIntent: action.payload,
        interpretation: undefined,
      };

    case 'REJECT_INTERPRETATION':
      // Clean up blob URLs
      state.images.forEach(img => {
        if (img.previewUrl) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
      return {
        ...INITIAL_UPLOAD_STATE,
        dailyUploadCount: state.dailyUploadCount,
        lastUploadDate: state.lastUploadDate,
      };

    case 'SET_ERROR':
      return {
        ...state,
        uploadState: 'UPLOAD_FAILED',
        error: action.payload,
      };

    case 'RESET':
      // Clean up blob URLs
      state.images.forEach(img => {
        if (img.previewUrl) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
      return {
        ...INITIAL_UPLOAD_STATE,
        dailyUploadCount: state.dailyUploadCount,
        lastUploadDate: state.lastUploadDate,
      };

    case 'INCREMENT_DAILY_COUNT':
      return {
        ...state,
        dailyUploadCount: state.dailyUploadCount + 1,
        lastUploadDate: getTodayString(),
      };

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const UploadContext = createContext<UploadContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(uploadReducer, INITIAL_UPLOAD_STATE);
  const processingRef = useRef(false);

  // Computed values
  const dailyCount = isNewDay(state.lastUploadDate) ? 0 : state.dailyUploadCount;
  const canUpload = dailyCount < MAX_UPLOADS_PER_DAY && state.images.length < MAX_IMAGES_PER_UPLOAD;
  const isInterpreting = state.uploadState === 'UPLOAD_INTERPRETING';
  const hasInterpretation = state.uploadState === 'UPLOAD_AWAITING_CONFIRMATION' && !!state.interpretation;
  const imageCount = state.images.length;
  const remainingUploadsToday = MAX_UPLOADS_PER_DAY - dailyCount;

  // Actions
  const addImages = useCallback(async (files: File[]): Promise<{ success: boolean; error?: string }> => {
    // Prevent concurrent processing
    if (processingRef.current) {
      return { success: false, error: 'Already processing images' };
    }

    // Check daily limit
    const currentDailyCount = isNewDay(state.lastUploadDate) ? 0 : state.dailyUploadCount;
    if (currentDailyCount >= MAX_UPLOADS_PER_DAY) {
      return { success: false, error: `Daily upload limit reached (${MAX_UPLOADS_PER_DAY} per day)` };
    }

    // Check image count limit
    const availableSlots = MAX_IMAGES_PER_UPLOAD - state.images.length;
    if (availableSlots <= 0) {
      return { success: false, error: `Maximum ${MAX_IMAGES_PER_UPLOAD} images per upload` };
    }

    processingRef.current = true;

    try {
      const filesToProcess = files.slice(0, availableSlots);
      const processedImages: UploadedImage[] = [];

      for (const file of filesToProcess) {
        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
          processingRef.current = false;
          return { success: false, error: validation.error };
        }

        // Convert to base64 and create preview
        const base64 = await fileToBase64(file);
        const previewUrl = URL.createObjectURL(file);

        processedImages.push({
          id: generateId(),
          file,
          previewUrl,
          base64,
          mediaType: file.type as UploadedImage['mediaType'],
        });
      }

      dispatch({ type: 'ADD_IMAGES', payload: processedImages });
      processingRef.current = false;
      return { success: true };
    } catch (error) {
      processingRef.current = false;
      const message = error instanceof Error ? error.message : 'Failed to process images';
      return { success: false, error: message };
    }
  }, [state.images.length, state.dailyUploadCount, state.lastUploadDate]);

  const removeImage = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_IMAGE', payload: id });
  }, []);

  const setUserIntent = useCallback((intent: string) => {
    dispatch({ type: 'SET_USER_INTENT', payload: intent });
  }, []);

  const startInterpretation = useCallback(() => {
    dispatch({ type: 'START_INTERPRETATION' });
  }, []);

  const setInterpretation = useCallback((interpretation: ScreenshotInterpretation) => {
    dispatch({ type: 'SET_INTERPRETATION', payload: interpretation });
  }, []);

  const requestClarification = useCallback(() => {
    dispatch({ type: 'NEEDS_CLARIFICATION' });
  }, []);

  const confirmInterpretation = useCallback(() => {
    dispatch({ type: 'CONFIRM_INTERPRETATION' });
  }, []);

  const adjustInterpretation = useCallback((newIntent: string) => {
    dispatch({ type: 'ADJUST_INTERPRETATION', payload: newIntent });
  }, []);

  const rejectInterpretation = useCallback(() => {
    dispatch({ type: 'REJECT_INTERPRETATION' });
  }, []);

  const setSignals = useCallback((signals: ScreenshotSignal[]) => {
    dispatch({ type: 'SET_SIGNALS', payload: signals });
  }, []);

  const setError = useCallback((error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value: UploadContextValue = {
    state,
    canUpload,
    isInterpreting,
    hasInterpretation,
    imageCount,
    remainingUploadsToday,
    addImages,
    removeImage,
    setUserIntent,
    startInterpretation,
    setInterpretation,
    requestClarification,
    confirmInterpretation,
    adjustInterpretation,
    rejectInterpretation,
    setSignals,
    setError,
    reset,
  };

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useUpload(): UploadContextValue {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}
