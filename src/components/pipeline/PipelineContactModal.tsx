import { useEffect } from "react";
import { X, Mail, Upload, RefreshCw, Calendar, Trophy } from "lucide-react";
import { StageTracker } from "../database/StageTracker";
import { ActivityTimeline } from "../database/ActivityTimeline";
import { useIsMobile } from "@/hooks/use-mobile";

interface PipelineLead {
  id: string;
  name: string;
  dealAmount: number;
  gci: number;
  estClose: string;
  status: string;
  dealType: "Buy" | "Sell";
  source: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: { date: string; content: string }[];
  pipelineStage?: number;
}

interface PipelineContactModalProps {
  lead: PipelineLead | null;
  onClose: () => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const actionButtons = [
  { label: "MailChimp", fullLabel: "Generate MailChimp Message", icon: Mail, variant: "primary" as const },
  { label: "Upload", fullLabel: "Upload Files", icon: Upload, variant: "secondary" as const },
  { label: "Update", fullLabel: "Update Opportunity", icon: RefreshCw, variant: "secondary" as const },
  { label: "Schedule", fullLabel: "Schedule Meeting", icon: Calendar, variant: "secondary" as const },
  { label: "Won", fullLabel: "Closed & Won", icon: Trophy, variant: "primary" as const },
];

export function PipelineContactModal({ lead, onClose }: PipelineContactModalProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (lead) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [lead, onClose]);

  if (!lead) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 transition-opacity duration-300" />
      
      <div 
        className={`relative w-full md:w-[65vw] md:max-w-4xl mx-0 md:mx-4 ${isMobile ? 'animate-slide-in-up' : 'animate-fade-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Matrix green glow - reduced on mobile */}
        <div className="absolute -inset-2 md:-inset-3 rounded-t-2xl md:rounded-2xl bg-primary/15 md:bg-primary/20 blur-xl md:blur-2xl opacity-50 pointer-events-none" />
        
        <div className={`relative bg-background border border-border/40 shadow-2xl overflow-hidden h-[80vh] overflow-y-auto scrollbar-none ${isMobile ? 'rounded-t-2xl' : 'rounded-lg'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Mobile drag handle */}
          {isMobile && (
            <div className="flex justify-center py-3 border-b border-border/20">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors duration-200 z-10 touch-target"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="px-5 md:px-6 pt-4 md:pt-6 pb-4">
            <div className="pr-10">
              <h2 className="text-xl font-medium contact-name-gradient">{lead.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary/70">{lead.dealType}</span>
                <span className="px-2 py-0.5 text-xs rounded bg-accent/10 text-accent/70">{lead.status}</span>
              </div>
            </div>
          </div>

          {/* Core details */}
          <div className="px-5 md:px-6 pb-4 space-y-3">
            {lead.address && (
              <p className="text-sm text-foreground/80 leading-relaxed">{lead.address}</p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5">
                {lead.phone && (
                  <p className="text-sm text-foreground/70">
                    <span className="text-muted-foreground/50">Phone:</span> {lead.phone}
                  </p>
                )}
                {lead.email && (
                  <p className="text-sm text-foreground/70">
                    <span className="text-muted-foreground/50">Email:</span> {lead.email}
                  </p>
                )}
                <p className="text-sm text-foreground/70">
                  <span className="text-muted-foreground/50">Source:</span> {lead.source}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-foreground/70">
                  <span className="text-muted-foreground/50">Deal Amount:</span> {formatCurrency(lead.dealAmount)}
                </p>
                <p className="text-sm text-foreground/70">
                  <span className="text-muted-foreground/50">GCI:</span>{" "}
                  <span className="text-primary font-medium">{formatCurrency(lead.gci)}</span>
                </p>
                <p className="text-sm text-foreground/70">
                  <span className="text-muted-foreground/50">Est Close:</span> {lead.estClose}
                </p>
              </div>
            </div>
          </div>

          <StageTracker currentStage={lead.pipelineStage ?? 0} />

          <ActivityTimeline contactId={lead.id} />

          {lead.notes && lead.notes.length > 0 && (
            <div className="px-5 md:px-6 py-4 border-t border-border/20">
              <h3 className="text-xs text-primary/80 uppercase tracking-wider mb-3">Notes</h3>
              <div className="space-y-3">
                {lead.notes.map((note, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="text-xs text-muted-foreground/50">{note.date}</p>
                    <p className="text-sm text-foreground/70 leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons - Compact on mobile */}
          <div className="px-5 md:px-6 py-4 md:py-5 border-t border-border/20 bg-secondary/20 safe-area-bottom">
            {isMobile ? (
              /* Mobile: Wrapped buttons */
              <div className="flex flex-wrap gap-2">
                {actionButtons.map((action, index) => {
                  const Icon = action.icon;
                  const isPrimary = action.variant === "primary";
                  
                  return (
                    <button
                      key={action.label}
                      className={`
                        flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
                        transition-all duration-300 ease-out touch-target
                        ${isPrimary 
                          ? index === 0
                            ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                            : "bg-accent text-accent-foreground shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                          : "bg-secondary/50 text-foreground/80 border border-border/40"
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Desktop: Wrapped buttons */
              <div className="flex flex-wrap gap-3">
                {actionButtons.map((action, index) => {
                  const Icon = action.icon;
                  const isPrimary = action.variant === "primary";
                  
                  return (
                    <button
                      key={action.fullLabel}
                      className={`
                        group relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                        transition-all duration-300 ease-out
                        ${isPrimary 
                          ? index === 0
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
                            : "bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)]"
                          : "bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30"
                        }
                      `}
                    >
                      {isPrimary && (
                        <div className={`absolute inset-0 rounded-lg blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300 ${index === 0 ? "bg-primary" : "bg-accent"}`} />
                      )}
                      <Icon className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">{action.fullLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
