/**
 * RealCoach.ai - Business Plan Hook
 *
 * Handles persistence of business plan to Supabase.
 */

import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Extended business plan type for database storage
// Matches the user_business_plan table schema
export interface DatabaseBusinessPlan {
  revenueTarget: string;
  buyerSellerSplit: string;
  unitTarget?: number;
  averageCommission?: number;
  primaryLeadSource: string;
  secondaryLeadSources: string[];
  geographicFocus: string;
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  weeklyHoursAvailable?: number;
  status: 'DRAFT' | 'CONFIRMED';
  confirmedAt?: Date;
}

export function useBusinessPlan() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load business plan from Supabase
   */
  const loadBusinessPlan = useCallback(async (): Promise<DatabaseBusinessPlan | null> => {
    if (!user) return null;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_business_plan')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!data) return null;

      return {
        revenueTarget: data.revenue_target || '',
        buyerSellerSplit: data.buyer_seller_split || '50/50',
        unitTarget: data.unit_target || undefined,
        averageCommission: data.average_commission || undefined,
        primaryLeadSource: data.primary_lead_source || '',
        secondaryLeadSources: data.secondary_lead_sources || [],
        geographicFocus: data.geographic_focus || '',
        riskTolerance: (data.risk_tolerance as DatabaseBusinessPlan['riskTolerance']) || 'MODERATE',
        weeklyHoursAvailable: data.weekly_hours_available || 40,
        status: data.status as 'DRAFT' | 'CONFIRMED',
        confirmedAt: data.confirmed_at ? new Date(data.confirmed_at) : undefined,
      };
    } catch (err) {
      console.error('[BusinessPlan] Load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Save business plan to Supabase
   */
  const saveBusinessPlan = useCallback(async (plan: Partial<DatabaseBusinessPlan>): Promise<boolean> => {
    if (!user) {
      setError('Not authenticated');
      return false;
    }

    try {
      setIsSaving(true);
      setError(null);

      const { error: upsertError } = await supabase
        .from('user_business_plan')
        .upsert({
          user_id: user.id,
          revenue_target: plan.revenueTarget,
          buyer_seller_split: plan.buyerSellerSplit,
          unit_target: plan.unitTarget,
          average_commission: plan.averageCommission,
          primary_lead_source: plan.primaryLeadSource,
          secondary_lead_sources: plan.secondaryLeadSources,
          geographic_focus: plan.geographicFocus,
          risk_tolerance: plan.riskTolerance,
          weekly_hours_available: plan.weeklyHoursAvailable,
          status: 'CONFIRMED',
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (upsertError) throw upsertError;

      console.log('[BusinessPlan] Saved successfully');
      return true;
    } catch (err) {
      console.error('[BusinessPlan] Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  /**
   * Delete business plan from Supabase
   */
  const deleteBusinessPlan = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsSaving(true);

      const { error: deleteError } = await supabase
        .from('user_business_plan')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      console.log('[BusinessPlan] Deleted');
      return true;
    } catch (err) {
      console.error('[BusinessPlan] Delete error:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  return {
    loadBusinessPlan,
    saveBusinessPlan,
    deleteBusinessPlan,
    isSaving,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
