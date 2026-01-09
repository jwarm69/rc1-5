import { useState, useEffect } from "react";
import { AwarenessBar } from "@/components/pipeline/AwarenessBar";
import { PipelineContactModal } from "@/components/pipeline/PipelineContactModal";
import { useDatabaseContext } from "@/contexts/DatabaseContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, X, Filter, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  isDemo?: boolean;
}

const PIPELINE_STATUSES = [
  "Initial Contact",
  "Follow Up",
  "Showing",
  "Offer Submitted",
  "Under Contract",
  "Closed",
];

const demoPipelineData: PipelineLead[] = [
  { id: "demo-1", name: "Sarah Mitchell", dealAmount: 450000, gci: 13500, estClose: "Feb 2025", status: "Showing", dealType: "Buy", source: "Referral", phone: "(555) 234-5678", email: "sarah.m@email.com", address: "456 Maple Ave, Springfield, IL 62705", pipelineStage: 3, isDemo: true, notes: [{ date: "Jan 8", content: "Met at open house on Elm Street. Interested in 3BR homes under $350k." }] },
  { id: "demo-2", name: "James & Lisa Henderson", dealAmount: 725000, gci: 21750, estClose: "Mar 2025", status: "Under Contract", dealType: "Buy", source: "SOI", phone: "(555) 345-6789", email: "henderson.family@email.com", address: "789 Pine Road, Springfield, IL 62706", pipelineStage: 5, isDemo: true, notes: [{ date: "Jan 10", content: "Offer accepted! Moving to inspection phase." }, { date: "Jan 5", content: "Submitted offer on Colonial at 789 Pine Road." }] },
  { id: "demo-3", name: "Michael Roberts", dealAmount: 380000, gci: 11400, estClose: "Feb 2025", status: "Follow Up", dealType: "Sell", source: "Expired", phone: "(555) 456-7890", email: "m.roberts@email.com", pipelineStage: 1, isDemo: true, notes: [{ date: "Jan 5", content: "Listing expired after 90 days. Open to re-listing with new approach." }] },
  { id: "demo-4", name: "Jennifer Wu", dealAmount: 520000, gci: 15600, estClose: "Apr 2025", status: "Initial Contact", dealType: "Buy", source: "Open House", phone: "(555) 567-8901", email: "jennifer.wu@email.com", pipelineStage: 0, isDemo: true },
  { id: "demo-5", name: "David & Amy Chen", dealAmount: 675000, gci: 20250, estClose: "Mar 2025", status: "Showing", dealType: "Buy", source: "Referral", phone: "(555) 678-9012", email: "chen.family@email.com", address: "321 Oak Lane, Springfield, IL 62707", pipelineStage: 3, isDemo: true, notes: [{ date: "Jan 9", content: "Showed 3 properties. Very interested in the Colonial on Oak Lane." }] },
  { id: "demo-6", name: "Robert Johnson", dealAmount: 295000, gci: 8850, estClose: "Feb 2025", status: "Offer Submitted", dealType: "Sell", source: "Past Client", phone: "(555) 789-0123", email: "r.johnson@email.com", pipelineStage: 4, isDemo: true, notes: [{ date: "Jan 7", content: "Received offer. Reviewing with seller." }] },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusColors: Record<string, string> = {
  "Initial Contact": "text-muted-foreground bg-muted/50",
  "Follow Up": "text-muted-foreground bg-muted/50",
  "Showing": "text-accent bg-accent/10",
  "Offer Submitted": "text-primary bg-primary/10",
  "Under Contract": "text-primary bg-primary/10",
  "Closed": "text-primary bg-primary/20",
};

export default function Pipeline() {
  const { user } = useAuth();
  const [pipelineData, setPipelineData] = useState<PipelineLead[]>(demoPipelineData);
  const [selectedLead, setSelectedLead] = useState<PipelineLead | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const { setIsContactOpen } = useDatabaseContext();
  const isMobile = useIsMobile();

  // Helper to check if a lead is demo data
  const isDemoLead = (id: string) => id.startsWith("demo-");

  // Fetch opportunities from Supabase
  const fetchOpportunities = async () => {
    if (!user) {
      setPipelineData(demoPipelineData);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching opportunities:", error);
        return;
      }

      if (data && data.length > 0) {
        const formattedOpportunities: PipelineLead[] = data.map((o) => ({
          id: o.id,
          name: o.contact_name,
          dealAmount: o.deal_amount || 0,
          gci: (o.deal_amount || 0) * 0.03, // 3% GCI estimate
          estClose: o.expected_close_date
            ? new Date(o.expected_close_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
            : "TBD",
          status: o.status || "Initial Contact",
          dealType: "Buy" as const, // Default, could be stored in DB
          source: "Database",
          notes: o.notes ? [{ date: new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }), content: o.notes }] : undefined,
          isDemo: false,
        }));
        // Combine real data with demo data
        setPipelineData([...formattedOpportunities, ...demoPipelineData]);
      } else {
        // No real data yet, show demo data
        setPipelineData(demoPipelineData);
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and when user changes
  useEffect(() => {
    fetchOpportunities();
  }, [user]);

  const filteredPipelineData = pipelineData.filter((lead) => {
    // Stage filter
    if (stageFilter !== "all" && lead.status !== stageFilter) {
      return false;
    }
    // Search filter
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(query) ||
      (lead.email?.toLowerCase().includes(query)) ||
      (lead.phone?.toLowerCase().includes(query)) ||
      lead.status.toLowerCase().includes(query)
    );
  });

  const totalGCI = pipelineData.reduce((sum, lead) => sum + lead.gci, 0);

  const allSelected = selectedIds.size === pipelineData.length && pipelineData.length > 0;
  const someSelected = selectedIds.size > 0 && selectedIds.size < pipelineData.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(pipelineData.map(lead => lead.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    // Optimistic update
    setPipelineData(prev =>
      prev.map(lead =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    );

    // Only persist to Supabase for non-demo leads
    if (!isDemoLead(leadId) && user) {
      try {
        const { error } = await supabase
          .from("opportunities")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", leadId);

        if (error) {
          console.error("Error updating opportunity status:", error);
          // Revert on error
          fetchOpportunities();
        }
      } catch (error) {
        console.error("Error updating opportunity status:", error);
        fetchOpportunities();
      }
    }
  };

  useEffect(() => {
    setIsContactOpen(selectedLead !== null);
    return () => setIsContactOpen(false);
  }, [selectedLead, setIsContactOpen]);

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="mb-4 md:mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Current conversations.
          </p>
        </div>
        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Stage Filter Dropdown */}
          <div className="relative">
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="h-9 px-3 bg-black/40 backdrop-blur-sm border-border/30 hover:border-primary/50 transition-colors min-w-[140px]">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <SelectValue placeholder="All Stages" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="all" className="text-foreground hover:bg-secondary">
                  All Stages
                </SelectItem>
                {PIPELINE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status} className="text-foreground hover:bg-secondary">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative">
            {isSearchOpen ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 backdrop-blur-sm border border-border/30">
                <Search className="w-4 h-4 text-primary" />
                <Input
                  type="text"
                  placeholder="Search name, phone, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 md:w-64 h-7 bg-transparent border-0 p-0 text-sm contact-name-gradient placeholder:text-muted-foreground/50 focus-visible:ring-0"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchOpen(false);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 backdrop-blur-sm border border-border/30 hover:border-primary/50 transition-colors"
              >
                <Search className="w-4 h-4 text-primary" />
                <span className="text-sm contact-name-gradient font-medium">Search</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Awareness Strip - Horizontal scrolling on mobile */}
      <div className="mb-6 md:mb-8 -mx-4 md:mx-0 px-4 md:px-0">
        <div className="overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          <div className="flex gap-4 md:gap-6 p-4 rounded-lg bg-card border border-border min-w-max md:min-w-0">
            <AwarenessBar 
              title="Appointments Held" 
              current={12} 
              target={20}
              subtitle="5 this month"
            />
            <AwarenessBar 
              title="Clients Signed" 
              current={4} 
              target={8}
              subtitle="2 this month"
            />
            <AwarenessBar 
              title="Closed Units" 
              current={3} 
              target={6}
              subtitle="1 this month"
            />
            <AwarenessBar 
              title="GCI" 
              current={formatCurrency(34800)} 
              subtitle={`${formatCurrency(totalGCI)} in pipeline`}
            />
          </div>
        </div>
        {/* Mobile scroll hint */}
        {isMobile && (
          <div className="flex justify-center mt-2">
            <div className="flex gap-1">
              <div className="w-6 h-1 rounded-full bg-primary/40" />
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            </div>
          </div>
        )}
      </div>

      {/* Bulk action bar when items selected */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-4">
          <span className="text-sm text-foreground font-medium">
            {selectedIds.size} selected
          </span>
          <Select onValueChange={(status) => {
            selectedIds.forEach(id => handleStatusChange(id, status));
            setSelectedIds(new Set());
          }}>
            <SelectTrigger className="w-40 h-8 text-sm bg-card border-border">
              <SelectValue placeholder="Bulk update status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              {PIPELINE_STATUSES.map(status => (
                <SelectItem key={status} value={status} className="text-foreground hover:bg-secondary">
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Pipeline Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : isMobile ? (
        /* Mobile: Stacked cards with checkboxes */
        <div className="space-y-3">
          {filteredPipelineData.map((lead, index) => (
            <div 
              key={lead.id}
              className="mobile-data-card tap-highlight animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex gap-3">
                {/* Checkbox */}
                <div className="flex-shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(lead.id)}
                    onCheckedChange={(checked) => handleSelectOne(lead.id, checked as boolean)}
                    className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </div>
                
                {/* Card content */}
                <div className="flex-1 min-w-0" onClick={() => setSelectedLead(lead)}>
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium contact-name-gradient truncate">{lead.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Select 
                          value={lead.status} 
                          onValueChange={(value) => handleStatusChange(lead.id, value)}
                        >
                          <SelectTrigger 
                            className={`h-6 px-2 text-xs border-0 ${statusColors[lead.status] || "text-foreground bg-secondary"}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border z-50">
                            {PIPELINE_STATUSES.map(status => (
                              <SelectItem key={status} value={status} className="text-foreground hover:bg-secondary text-xs">
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">{lead.dealType}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-medium contact-name-gradient">{formatCurrency(lead.gci)}</p>
                      <p className="text-xs text-muted-foreground">GCI</p>
                    </div>
                  </div>
                  
                  {/* Details row */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span className="contact-name-gradient font-medium">{formatCurrency(lead.dealAmount)}</span>
                      <span className="text-muted-foreground/50">•</span>
                      <span>{lead.source}</span>
                    </div>
                    <span className="text-xs text-muted-foreground/70">{lead.estClose}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop: Table view */
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50">
                <th className="px-4 py-3 text-left w-10">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) (el as any).indeterminate = someSelected;
                    }}
                    onCheckedChange={handleSelectAll}
                    className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Lead Name</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Deal Amount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">GCI</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Est Close</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredPipelineData.map((lead, index) => (
                <tr 
                  key={lead.id} 
                  className={`data-row animate-fade-in-up cursor-pointer hover:bg-secondary/30 transition-colors duration-200 ${selectedIds.has(lead.id) ? 'bg-primary/5' : ''}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(lead.id)}
                      onCheckedChange={(checked) => handleSelectOne(lead.id, checked as boolean)}
                      className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium contact-name-gradient" onClick={() => setSelectedLead(lead)}>{lead.name}</td>
                  <td className="px-4 py-3.5 text-sm text-right font-medium contact-name-gradient" onClick={() => setSelectedLead(lead)}>{formatCurrency(lead.dealAmount)}</td>
                  <td className="px-4 py-3.5 text-sm text-right font-medium contact-name-gradient" onClick={() => setSelectedLead(lead)}>{formatCurrency(lead.gci)}</td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground" onClick={() => setSelectedLead(lead)}>{lead.estClose}</td>
                  <td className="px-4 py-3.5 text-sm" onClick={(e) => e.stopPropagation()}>
                    <Select value={lead.status} onValueChange={(value) => handleStatusChange(lead.id, value)}>
                      <SelectTrigger className={`h-7 px-2 text-xs border-0 w-auto min-w-[120px] ${statusColors[lead.status] || "text-foreground bg-secondary"}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border z-50">
                        {PIPELINE_STATUSES.map(status => (
                          <SelectItem key={status} value={status} className="text-foreground hover:bg-secondary text-xs">
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground" onClick={() => setSelectedLead(lead)}>{lead.dealType}</td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground" onClick={() => setSelectedLead(lead)}>{lead.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pipeline Contact Modal */}
      <PipelineContactModal 
        lead={selectedLead} 
        onClose={() => setSelectedLead(null)} 
      />
    </div>
  );
}
