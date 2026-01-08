/**
 * RealCoach.ai - Supabase Calibration Hook
 *
 * Handles persistence of calibration state to Supabase.
 * Falls back to localStorage for unauthenticated users.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalibrationState,
  GoalsAndActions,
  UserState,
  CalibrationTone,
  ExecutionStyle,
} from '@/types/coaching';

// ============================================================================
// TYPES
// ============================================================================

interface SupabaseCalibrationRow {
  id: string;
  user_id: string;
  state: string;
  tone: string | null;
  fast_lane_triggered: boolean;
  current_question_index: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SupabaseGoalsActionsRow {
  id: string;
  user_id: string;
  annual_professional_goal: string | null;
  annual_personal_goal: string | null;
  current_reality: string | null;
  monthly_milestone: string | null;
  execution_style: string | null;
  willingness_filter: string[] | null;
  friction_boundaries: string[] | null;
  status: string;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSupabaseCalibration() {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  /**
   * Load calibration state from Supabase
   */
  const loadCalibrationState = useCallback(async (): Promise<CalibrationState | null> => {
    if (!user) return null;

    try {
      setIsSyncing(true);
      setLastSyncError(null);

      // Fetch calibration state
      const { data: calibrationData, error: calibrationError } = await supabase
        .from('user_calibration')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (calibrationError && calibrationError.code !== 'PGRST116') {
        // PGRST116 = no rows found (not an error for us)
        throw calibrationError;
      }

      // Fetch goals and actions
      const { data: goalsData, error: goalsError } = await supabase
        .from('user_goals_actions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (goalsError && goalsError.code !== 'PGRST116') {
        throw goalsError;
      }

      // If no data exists, return null (will use defaults)
      if (!calibrationData) return null;

      // Convert to CalibrationState
      const state: CalibrationState = {
        userState: calibrationData.state as UserState,
        tone: calibrationData.tone as CalibrationTone | null,
        currentQuestionIndex: calibrationData.current_question_index,
        answers: {}, // We'll reconstruct from goals if available
        goalsAndActions: goalsData ? convertGoalsFromSupabase(goalsData) : null,
        businessPlan: null,
        fastLaneTriggered: calibrationData.fast_lane_triggered,
        startedAt: calibrationData.started_at ? new Date(calibrationData.started_at) : undefined,
        completedAt: calibrationData.completed_at ? new Date(calibrationData.completed_at) : undefined,
      };

      // Reconstruct answers from goalsAndActions
      if (state.goalsAndActions) {
        state.answers = {
          annual_professional_goal: state.goalsAndActions.annualProfessionalGoal,
          annual_personal_goal: state.goalsAndActions.annualPersonalGoal,
          current_reality: state.goalsAndActions.currentReality,
          monthly_milestone: state.goalsAndActions.monthlyMilestone,
          execution_style: state.goalsAndActions.executionStyle,
          willingness_filter: state.goalsAndActions.willingnessFilter,
          friction_boundary: state.goalsAndActions.frictionBoundaries,
        };
      }

      return state;
    } catch (error) {
      console.error('[Supabase Calibration] Load error:', error);
      setLastSyncError(error instanceof Error ? error.message : 'Unknown error');
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  /**
   * Save calibration state to Supabase
   */
  const saveCalibrationState = useCallback(async (state: CalibrationState): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsSyncing(true);
      setLastSyncError(null);

      // Upsert calibration state
      const { error: calibrationError } = await supabase
        .from('user_calibration')
        .upsert({
          user_id: user.id,
          state: state.userState,
          tone: state.tone,
          fast_lane_triggered: state.fastLaneTriggered,
          current_question_index: state.currentQuestionIndex,
          started_at: state.startedAt?.toISOString() || null,
          completed_at: state.completedAt?.toISOString() || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (calibrationError) throw calibrationError;

      // Upsert goals and actions if they exist
      if (state.goalsAndActions) {
        const { error: goalsError } = await supabase
          .from('user_goals_actions')
          .upsert({
            user_id: user.id,
            annual_professional_goal: state.goalsAndActions.annualProfessionalGoal,
            annual_personal_goal: state.goalsAndActions.annualPersonalGoal,
            current_reality: state.goalsAndActions.currentReality,
            monthly_milestone: state.goalsAndActions.monthlyMilestone,
            execution_style: state.goalsAndActions.executionStyle,
            willingness_filter: state.goalsAndActions.willingnessFilter,
            friction_boundaries: state.goalsAndActions.frictionBoundaries,
            status: state.goalsAndActions.status,
            confirmed_at: state.goalsAndActions.confirmedAt?.toISOString() || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (goalsError) throw goalsError;
      }

      console.log('[Supabase Calibration] State saved successfully');
      return true;
    } catch (error) {
      console.error('[Supabase Calibration] Save error:', error);
      setLastSyncError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  /**
   * Delete calibration state (for reset)
   */
  const deleteCalibrationState = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsSyncing(true);

      // Delete goals first (due to potential foreign key constraints)
      await supabase
        .from('user_goals_actions')
        .delete()
        .eq('user_id', user.id);

      // Delete calibration state
      await supabase
        .from('user_calibration')
        .delete()
        .eq('user_id', user.id);

      console.log('[Supabase Calibration] State deleted');
      return true;
    } catch (error) {
      console.error('[Supabase Calibration] Delete error:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  return {
    loadCalibrationState,
    saveCalibrationState,
    deleteCalibrationState,
    isSyncing,
    lastSyncError,
    isAuthenticated: !!user,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function convertGoalsFromSupabase(data: SupabaseGoalsActionsRow): GoalsAndActions {
  return {
    annualProfessionalGoal: data.annual_professional_goal || '',
    annualPersonalGoal: data.annual_personal_goal || '',
    currentReality: data.current_reality || '',
    monthlyMilestone: data.monthly_milestone || '',
    executionStyle: (data.execution_style as ExecutionStyle) || 'STRUCTURED',
    willingnessFilter: data.willingness_filter || [],
    frictionBoundaries: data.friction_boundaries || [],
    status: data.status as 'DRAFT' | 'CONFIRMED',
    createdAt: new Date(data.created_at),
    confirmedAt: data.confirmed_at ? new Date(data.confirmed_at) : undefined,
  };
}
