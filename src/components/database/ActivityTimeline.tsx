import { useState, useEffect } from "react";
import { Phone, Mail, Calendar, FileText, CheckSquare, Plus, ChevronDown, ChevronUp, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Activity {
  id: string;
  type: "call" | "email" | "meeting" | "note" | "task";
  title: string;
  description?: string;
  created_at: string;
}

interface ActivityTimelineProps {
  contactId: string;
}

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  task: CheckSquare,
};

const activityColors = {
  call: "bg-primary/20 text-primary",
  email: "bg-accent/20 text-accent",
  meeting: "bg-purple-500/20 text-purple-400",
  note: "bg-amber-500/20 text-amber-400",
  task: "bg-blue-500/20 text-blue-400",
};

const activityLabels = {
  call: "Phone Call",
  email: "Email",
  meeting: "Meeting",
  note: "Note",
  task: "Task",
};

type ActivityType = keyof typeof activityIcons;

export function ActivityTimeline({ contactId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newActivity, setNewActivity] = useState<{ type: ActivityType; title: string; description: string }>({
    type: "note",
    title: "",
    description: "",
  });

  // Fetch activities
  useEffect(() => {
    fetchActivities();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('activities-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `contact_id=eq.${contactId}`,
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contactId]);

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
    } else {
      setActivities((data || []).map(item => ({
        ...item,
        type: item.type as Activity['type'],
        description: item.description ?? undefined,
      })));
    }
    setLoading(false);
  };

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAddActivity = async () => {
    if (!newActivity.title.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from('activities').insert({
      contact_id: contactId,
      type: newActivity.type,
      title: newActivity.title.trim(),
      description: newActivity.description.trim() || null,
    });

    if (error) {
      console.error('Error adding activity:', error);
      toast.error('Failed to add activity');
    } else {
      toast.success('Activity added');
      setNewActivity({ type: "note", title: "", description: "" });
      setShowAddForm(false);
    }
    setSubmitting(false);
  };

  const handleDeleteActivity = async (id: string) => {
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete activity');
    } else {
      toast.success('Activity deleted');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="px-5 md:px-8 py-5 border-t border-border/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs text-primary/80 uppercase tracking-wider font-medium">Recent Activity</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors"
        >
          {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{showAddForm ? "Cancel" : "Add Activity"}</span>
        </button>
      </div>

      {/* Add Activity Form */}
      {showAddForm && (
        <div className="mb-5 p-4 rounded-lg bg-secondary/30 border border-border/30 animate-fade-in">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(activityIcons) as ActivityType[]).map((type) => {
                const Icon = activityIcons[type];
                const isSelected = newActivity.type === type;
                return (
                  <button
                    key={type}
                    onClick={() => setNewActivity({ ...newActivity, type })}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      isSelected
                        ? `${activityColors[type]} ring-1 ring-current`
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="capitalize">{type}</span>
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={newActivity.title}
              onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
              placeholder="Activity title..."
              className="w-full px-3 py-2 text-sm bg-background/50 border border-border/40 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/40"
            />
            <textarea
              value={newActivity.description}
              onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
              placeholder="Additional details (optional)..."
              className="w-full px-3 py-2 text-sm bg-background/50 border border-border/40 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/40"
              rows={2}
            />
            <button
              onClick={handleAddActivity}
              disabled={!newActivity.title.trim() || submitting}
              className="w-full py-2 px-4 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Activity
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : activities.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border/30" />

          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type];
              const colorClass = activityColors[activity.type];
              const isExpanded = expandedId === activity.id;

              return (
                <div key={activity.id} className="relative">
                  <button
                    onClick={() => handleToggleExpand(activity.id)}
                    className="flex gap-3 w-full text-left group"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform ${colorClass} ${
                        isExpanded ? "scale-110" : "group-hover:scale-105"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-relaxed transition-colors ${
                            isExpanded ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
                          }`}
                        >
                          {activity.title}
                        </p>
                        <div className="shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground/50 mt-0.5">
                        {formatDate(activity.created_at)} at {formatTime(activity.created_at)}
                      </p>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="ml-9 mt-2 p-3 rounded-lg bg-secondary/20 border border-border/20 animate-fade-in">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
                            {activityLabels[activity.type]}
                          </span>
                        </div>
                        {activity.description ? (
                          <p className="text-sm text-foreground/70 leading-relaxed">{activity.description}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground/50 italic">No additional details recorded.</p>
                        )}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="text-xs text-destructive/70 hover:text-destructive transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/50 text-center py-4">No activity recorded.</p>
      )}
    </div>
  );
}
