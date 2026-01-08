/**
 * RealCoach.ai - Business Plan Modal
 *
 * Optional modal for capturing business plan details after G&A confirmation.
 * Saves to user_business_plan table in Supabase.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, TrendingUp, Target, Clock, Shield } from 'lucide-react';
import { useBusinessPlan, type DatabaseBusinessPlan } from '@/hooks/useBusinessPlan';

interface BusinessPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function BusinessPlanModal({ open, onOpenChange, onComplete }: BusinessPlanModalProps) {
  const { saveBusinessPlan, isSaving } = useBusinessPlan();

  const [formData, setFormData] = useState<Partial<DatabaseBusinessPlan>>({
    revenueTarget: '',
    buyerSellerSplit: '50/50',
    unitTarget: undefined,
    averageCommission: undefined,
    primaryLeadSource: '',
    secondaryLeadSources: [],
    geographicFocus: '',
    riskTolerance: 'MODERATE',
    weeklyHoursAvailable: 40,
  });

  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const handleInputChange = (field: keyof DatabaseBusinessPlan, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const success = await saveBusinessPlan(formData);
    if (success) {
      onOpenChange(false);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    onComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Business Plan (Optional)
          </DialogTitle>
          <DialogDescription>
            Help us understand your business targets to give more relevant coaching.
            Step {step} of {totalSteps}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === 1 && (
            <>
              {/* Revenue & Units */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Target className="w-4 h-4 text-primary" />
                  Revenue Goals
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="revenueTarget">Annual GCI Target</Label>
                    <Input
                      id="revenueTarget"
                      placeholder="e.g., $150,000"
                      value={formData.revenueTarget}
                      onChange={e => handleInputChange('revenueTarget', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unitTarget">Unit Target</Label>
                      <Input
                        id="unitTarget"
                        type="number"
                        placeholder="e.g., 24"
                        value={formData.unitTarget || ''}
                        onChange={e => handleInputChange('unitTarget', parseInt(e.target.value) || undefined)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avgCommission">Avg Commission ($)</Label>
                      <Input
                        id="avgCommission"
                        type="number"
                        placeholder="e.g., 6000"
                        value={formData.averageCommission || ''}
                        onChange={e => handleInputChange('averageCommission', parseInt(e.target.value) || undefined)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyerSellerSplit">Buyer/Seller Split</Label>
                    <Select
                      value={formData.buyerSellerSplit}
                      onValueChange={value => handleInputChange('buyerSellerSplit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select split" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100/0">100% Buyers</SelectItem>
                        <SelectItem value="75/25">75% Buyers / 25% Sellers</SelectItem>
                        <SelectItem value="50/50">50/50</SelectItem>
                        <SelectItem value="25/75">25% Buyers / 75% Sellers</SelectItem>
                        <SelectItem value="0/100">100% Sellers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Lead Sources & Focus */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Lead Generation Strategy
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryLeadSource">Primary Lead Source</Label>
                    <Select
                      value={formData.primaryLeadSource}
                      onValueChange={value => handleInputChange('primaryLeadSource', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sphere">Sphere of Influence</SelectItem>
                        <SelectItem value="referrals">Referrals</SelectItem>
                        <SelectItem value="open_houses">Open Houses</SelectItem>
                        <SelectItem value="online_leads">Online Leads (Zillow, etc.)</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="farming">Geographic Farming</SelectItem>
                        <SelectItem value="expired">Expired/FSBO</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="geographicFocus">Geographic Focus</Label>
                    <Textarea
                      id="geographicFocus"
                      placeholder="e.g., Palm Beach Gardens, Jupiter, North Palm Beach"
                      value={formData.geographicFocus}
                      onChange={e => handleInputChange('geographicFocus', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {/* Capacity & Risk */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  Capacity & Approach
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weeklyHours">Weekly Hours Available for Business</Label>
                    <Input
                      id="weeklyHours"
                      type="number"
                      placeholder="e.g., 40"
                      value={formData.weeklyHoursAvailable || ''}
                      onChange={e => handleInputChange('weeklyHoursAvailable', parseInt(e.target.value) || undefined)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="riskTolerance" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Risk Tolerance
                    </Label>
                    <Select
                      value={formData.riskTolerance}
                      onValueChange={value => handleInputChange('riskTolerance', value as BusinessPlan['riskTolerance'])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk tolerance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONSERVATIVE">Conservative - Steady, proven methods</SelectItem>
                        <SelectItem value="MODERATE">Moderate - Balanced approach</SelectItem>
                        <SelectItem value="AGGRESSIVE">Aggressive - Growth-focused, willing to experiment</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This helps us suggest actions that match your comfort level.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleSkip} className="sm:mr-auto">
            Skip for now
          </Button>

          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                Back
              </Button>
            )}

            {step < totalSteps ? (
              <Button onClick={() => setStep(s => s + 1)}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Business Plan
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
