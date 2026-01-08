import { useState, useEffect, useMemo } from "react";
import { GoalCard } from "@/components/goals/GoalCard";
import { ActionCard } from "@/components/actions/ActionCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronDown, ChevronUp, Target, Sparkles, MessageCircle, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCalibration } from "@/contexts/CalibrationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { generateDailyPlan, type DailyActionPlan } from "@/lib/daily-action-engine";

interface Action {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
}

const demoActions: Action[] = [
  {
    id: "1",
    title: "Follow up with Sarah Mitchell",
    description: "She expressed interest in the Oak Street property. Send updated pricing.",
    priority: "high",
    completed: false,
  },
  {
    id: "2",
    title: "Schedule showing for the Hendersons",
    description: "They want to see 3 properties this weekend. Confirm availability.",
    priority: "high",
    completed: false,
  },
  {
    id: "3",
    title: "Send market analysis to new lead",
    description: "Jake Robinson requested a CMA for his neighborhood.",
    priority: "medium",
    completed: false,
  },
];

const demoCompletedActions: Action[] = [
  {
    id: "4",
    title: "Call back expired listing owner",
    description: "Discussed relisting strategy.",
    priority: "low",
    completed: true,
  },
  {
    id: "5",
    title: "Update CRM notes",
    description: "Added meeting notes from Tuesday's showing.",
    priority: "low",
    completed: true,
  },
];

export default function GoalsAndActions() {
  const { user } = useAuth();
  const calibration = useCalibration();
  const [actions, setActions] = useState<Action[]>(demoActions);
  const [completed, setCompleted] = useState<Action[]>(demoCompletedActions);
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  // Daily action plan from engine (Stream 3)
  const [actionPlan, setActionPlan] = useState<DailyActionPlan | null>(null);

  // Determine if we should show calibration UI or actions
  const showCalibrationUI = calibration.isCalibrating || calibration.state.userState === 'G&A_DRAFTED';
  const canShowActions = calibration.canShowActions;

  // Fetch actions from database when user is logged in
  useEffect(() => {
    if (user) {
      fetchActions();
    } else {
      // Reset to demo data when logged out
      setActions(demoActions);
      setCompleted(demoCompletedActions);
    }
  }, [user]);

  // Generate daily action plan from engine when G&A is confirmed (Stream 3)
  useEffect(() => {
    if (canShowActions && calibration.state.goalsAndActions) {
      const plan = generateDailyPlan(
        calibration.state.goalsAndActions,
        null, // businessPlan (not yet implemented)
        [],   // pipeline (empty for now, will come from Supabase)
        { type: 'NONE', description: '', mayOverridePrimary: false },
        false // reducedLoad
      );
      setActionPlan(plan);

      // Convert plan to Action[] format for existing UI compatibility
      const engineActions: Action[] = [];

      if (plan.primary) {
        engineActions.push({
          id: plan.primary.id,
          title: plan.primary.title,
          description: plan.primary.description,
          priority: 'high',
          completed: false,
        });
      }

      plan.supporting.forEach(action => {
        engineActions.push({
          id: action.id,
          title: action.title,
          description: action.description,
          priority: 'medium',
          completed: false,
        });
      });

      // Only use engine actions if we have them, otherwise keep demo
      if (engineActions.length > 0) {
        setActions(engineActions);
      }
    }
  }, [canShowActions, calibration.state.goalsAndActions]);

  const fetchActions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('action_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const activeActions: Action[] = data
          .filter(item => !item.completed)
          .map(item => ({
            id: item.id,
            title: item.action_text,
            description: item.contact_name || '',
            priority: 'medium' as const,
            completed: false,
          }));

        const completedActions: Action[] = data
          .filter(item => item.completed)
          .map(item => ({
            id: item.id,
            title: item.action_text,
            description: item.contact_name || '',
            priority: 'low' as const,
            completed: true,
          }));

        setActions(activeActions.length > 0 ? activeActions : demoActions);
        setCompleted(completedActions.length > 0 ? completedActions : demoCompletedActions);
      }
    } catch (error) {
      console.error('Error fetching actions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    const action = actions.find(a => a.id === id);
    if (!action) return;

    // Optimistic update - add to end of completed list
    setActions(actions.filter(a => a.id !== id));
    setCompleted([...completed, { ...action, completed: true }]);

    // If logged in, persist to database
    if (user) {
      try {
        const { error } = await supabase
          .from('action_items')
          .update({ completed: true })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success('Action completed!');
      } catch (error) {
        // Revert on error
        setActions([action, ...actions.filter(a => a.id !== id)]);
        setCompleted(completed.filter(a => a.id !== action.id));
        toast.error('Failed to save. Please try again.');
        console.error('Error completing action:', error);
      }
    } else {
      toast.success('Action completed! Create an account to save permanently.');
    }
  };

  // If in calibration mode, show calibration progress UI
  if (showCalibrationUI) {
    return (
      <div className="animate-fade-in">
        {/* Page header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl font-semibold text-foreground">Goals & Actions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Let's set up your goals first.
          </p>
        </div>

        {/* Calibration in progress card */}
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl bg-card border border-primary/20 p-6 md:p-8 space-y-6">
            {/* Icon and title */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-md rounded-lg" />
                <div className="relative w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-medium text-foreground">Setting Up Your Plan</h2>
                <p className="text-sm text-muted-foreground">{calibration.statusText}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Calibration Progress</span>
                <span className="text-primary font-medium">{calibration.progress}%</span>
              </div>
              <Progress value={calibration.progress} className="h-2" />
            </div>

            {/* Status message */}
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm text-foreground">
                    {calibration.state.userState === 'G&A_DRAFTED'
                      ? "Your Goals & Actions draft is ready for review."
                      : "Answer a few questions in the coach panel to set up your personalized plan."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {calibration.state.userState === 'G&A_DRAFTED'
                      ? "Open the coach panel to confirm or edit your goals."
                      : "This helps RealCoach give you focused daily actions that match your goals."}
                  </p>
                </div>
              </div>
            </div>

            {/* G&A Preview (when draft is ready) */}
            {calibration.state.userState === 'G&A_DRAFTED' && calibration.state.goalsAndActions && (
              <div className="space-y-4 border-t border-border pt-4">
                <h3 className="text-sm font-medium text-foreground">Your Draft Goals</h3>
                <div className="grid gap-3">
                  {calibration.state.goalsAndActions.annualProfessionalGoal && (
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Annual Goal</p>
                      <p className="text-sm text-foreground">{calibration.state.goalsAndActions.annualProfessionalGoal}</p>
                    </div>
                  )}
                  {calibration.state.goalsAndActions.monthlyMilestone && (
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">30-Day Focus</p>
                      <p className="text-sm text-foreground">{calibration.state.goalsAndActions.monthlyMilestone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Help text */}
            <p className="text-xs text-muted-foreground text-center">
              Once setup is complete, your daily actions will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl font-semibold text-foreground">Goals & Actions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Focus and next steps.
        </p>
      </div>

      {isMobile ? (
        /* Mobile Layout - Stacked with collapsible goals */
        <div className="space-y-6">
          {/* Collapsible Goals Section */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <button
              onClick={() => setGoalsExpanded(!goalsExpanded)}
              className="w-full flex items-center justify-between p-4 touch-target"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-foreground">Your Goals</span>
                  <p className="text-xs text-muted-foreground">$180K yearly • $15K this month</p>
                </div>
              </div>
              {goalsExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {goalsExpanded && (
              <div className="px-4 pb-4 space-y-4 animate-fade-in">
                {/* Yearly Goal */}
                <div>
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Yearly Goal</h3>
                  <GoalCard
                    title="GCI Target"
                    value="$180,000"
                    subtitle="Jan 2025 - Dec 2025"
                    variant="yearly"
                    compact
                  />
                </div>

                {/* Monthly Goals */}
                <div>
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">January Goals</h3>
                  <div className="space-y-2">
                    <GoalCard title="Appointments" value={5} target={8} subtitle="3 more to go" compact />
                    <GoalCard title="Clients Signed" value={2} target={4} subtitle="On track" compact />
                    <GoalCard title="Closed Units" value={1} target={2} subtitle="1 pending" compact />
                    <GoalCard title="GCI This Month" value="$12,400" target="$15,000" compact />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Today's Actions (Stream 3 - Primary + Supporting) */}
          <div className="space-y-6">
            {/* Primary Action - Today's Focus */}
            {actionPlan?.primary ? (
              <div>
                <h2 className="text-xs font-medium text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Star className="w-3 h-3 text-primary" />
                  Today's Focus
                </h2>
                <div className="animate-fade-in-up">
                  <ActionCard
                    title={actionPlan.primary.title}
                    description={actionPlan.primary.description}
                    priority="high"
                    completed={false}
                    onComplete={() => handleComplete(actionPlan.primary!.id)}
                    compact
                  />
                  <p className="text-xs text-muted-foreground mt-2 ml-1">
                    {actionPlan.primary.milestoneConnection}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xs font-medium text-foreground uppercase tracking-wider mb-3">
                  Today's Actions
                </h2>
                <div className="space-y-3">
                  {actions.slice(0, 1).map((action, index) => (
                    <div
                      key={action.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <ActionCard
                        title={action.title}
                        description={action.description}
                        priority={action.priority}
                        completed={action.completed}
                        onComplete={() => handleComplete(action.id)}
                        compact
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supporting Actions - If Time Allows */}
            {actionPlan?.supporting && actionPlan.supporting.length > 0 ? (
              <div>
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  If Time Allows
                </h2>
                <div className="space-y-2">
                  {actionPlan.supporting.map((action, index) => (
                    <div
                      key={action.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${(index + 1) * 100}ms` }}
                    >
                      <ActionCard
                        title={action.title}
                        description={action.description}
                        priority="medium"
                        completed={false}
                        onComplete={() => handleComplete(action.id)}
                        compact
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : !actionPlan && (
              <div className="space-y-3">
                {actions.slice(1, 3).map((action, index) => (
                  <div
                    key={action.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${(index + 1) * 100}ms` }}
                  >
                    <ActionCard
                      title={action.title}
                      description={action.description}
                      priority={action.priority}
                      completed={action.completed}
                      onComplete={() => handleComplete(action.id)}
                      compact
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Actions */}
          {completed.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-foreground uppercase tracking-wider mb-3">
                Completed
              </h2>
              <div className="space-y-2">
                {completed.map((action) => (
                  <ActionCard
                    key={action.id}
                    title={action.title}
                    description={action.description}
                    priority={action.priority}
                    completed={true}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Desktop Layout - Side by side */
        <div className="grid grid-cols-12 gap-8">
          {/* Left column - Goals (context) */}
          <div className="col-span-4 space-y-6">
            {/* Yearly Goal */}
            <div>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Yearly Goal
              </h2>
              <GoalCard
                title="GCI Target"
                value="$180,000"
                subtitle="Jan 2025 - Dec 2025"
                variant="yearly"
              />
            </div>

            {/* Monthly Goals */}
            <div>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                January Goals
              </h2>
              <div className="space-y-3">
                <GoalCard
                  title="Appointments"
                  value={5}
                  target={8}
                  subtitle="3 more to reach goal"
                />
                <GoalCard
                  title="Clients Signed"
                  value={2}
                  target={4}
                  subtitle="On track"
                />
                <GoalCard
                  title="Closed Units"
                  value={1}
                  target={2}
                  subtitle="1 pending"
                />
                <GoalCard
                  title="GCI This Month"
                  value="$12,400"
                  target="$15,000"
                />
              </div>
            </div>
          </div>

          {/* Right column - Actions (behavior) (Stream 3) */}
          <div className="col-span-8 space-y-8">
            {/* Primary Action - Today's Focus */}
            {actionPlan?.primary ? (
              <div>
                <h2 className="text-xs font-medium text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Star className="w-3 h-3 text-primary" />
                  Today's Focus
                </h2>
                <div className="animate-fade-in-up">
                  <ActionCard
                    title={actionPlan.primary.title}
                    description={actionPlan.primary.description}
                    priority="high"
                    completed={false}
                    onComplete={() => handleComplete(actionPlan.primary!.id)}
                  />
                  <p className="text-sm text-muted-foreground mt-3 ml-1">
                    {actionPlan.primary.milestoneConnection}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xs font-medium text-foreground uppercase tracking-wider mb-3">
                  Today's Actions
                </h2>
                <div className="space-y-3">
                  {actions.slice(0, 1).map((action, index) => (
                    <div
                      key={action.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <ActionCard
                        title={action.title}
                        description={action.description}
                        priority={action.priority}
                        completed={action.completed}
                        onComplete={() => handleComplete(action.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supporting Actions - If Time Allows */}
            {actionPlan?.supporting && actionPlan.supporting.length > 0 ? (
              <div>
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  If Time Allows
                </h2>
                <div className="space-y-3">
                  {actionPlan.supporting.map((action, index) => (
                    <div
                      key={action.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${(index + 1) * 100}ms` }}
                    >
                      <ActionCard
                        title={action.title}
                        description={action.description}
                        priority="medium"
                        completed={false}
                        onComplete={() => handleComplete(action.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : !actionPlan && (
              <div className="space-y-3">
                {actions.slice(1, 3).map((action, index) => (
                  <div
                    key={action.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${(index + 1) * 100}ms` }}
                  >
                    <ActionCard
                      title={action.title}
                      description={action.description}
                      priority={action.priority}
                      completed={action.completed}
                      onComplete={() => handleComplete(action.id)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Completed actions */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-xs font-medium text-foreground uppercase tracking-wider mb-3">
                  Completed
                </h2>
                <div className="space-y-2">
                  {completed.map((action) => (
                    <ActionCard
                      key={action.id}
                      title={action.title}
                      description={action.description}
                      priority={action.priority}
                      completed={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
