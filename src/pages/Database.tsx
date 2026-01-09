import { useState, useEffect } from "react";
import { ContactModal } from "@/components/database/ContactModal";
import { CreateContactModal } from "@/components/database/CreateContactModal";
import { AddToPipelineModal } from "@/components/database/AddToPipelineModal";
import { useDatabaseContext } from "@/contexts/DatabaseContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ArrowRight, Check, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContactNote {
  date: string;
  content: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  lastContacted: string;
  leadSource?: string;
  address?: string;
  tags?: string[];
  notes?: ContactNote[];
  dealHistory?: string;
  pipelineStage?: number;
  isInPipeline?: boolean;
  isDemo?: boolean;
}

const demoContacts: Contact[] = [
  {
    id: "demo-1",
    firstName: "Jake",
    lastName: "Robinson",
    phone: "(555) 987-1234",
    email: "jake.robinson@email.com",
    lastContacted: "Jan 9",
    leadSource: "Referral",
    address: "123 Oak Street, Springfield, IL 62704",
    tags: ["Buyer", "Hot Lead"],
    dealHistory: "Pre-approved up to $500k. Looking to close by summer.",
    pipelineStage: 3,
    isInPipeline: true,
    isDemo: true,
    notes: [
      { date: "Jan 9", content: "Had a great call with Jake. He's very interested in finding a new home ASAP and is pre-approved up to $500k." },
      { date: "Dec 24", content: "Jake mentioned that his family will be moving to the area this summer due to job relocation. Wants a 4-bedroom house in a good school district." },
      { date: "Dec 15", content: "Got a new lead for Jake from a past client referral. Connected on Facebook — saw they recently posted about wanting to move. Gave him a call and he was receptive." },
    ],
  },
  { id: "demo-2", firstName: "Sarah", lastName: "Mitchell", phone: "(555) 234-5678", email: "sarah.m@email.com", lastContacted: "Jan 8", leadSource: "Open House", address: "456 Maple Ave, Springfield, IL 62705", tags: ["Buyer"], pipelineStage: 2, isInPipeline: true, isDemo: true, notes: [{ date: "Jan 8", content: "Met at open house on Elm Street. Interested in 3BR homes under $350k." }] },
  { id: "demo-3", firstName: "Michael", lastName: "Roberts", phone: "(555) 345-6789", email: "m.roberts@email.com", lastContacted: "Jan 5", leadSource: "Expired Listing", tags: ["Seller", "Expired Listing"], pipelineStage: 1, isInPipeline: true, isDemo: true, notes: [{ date: "Jan 5", content: "Listing expired after 90 days. Open to re-listing with new approach." }] },
  { id: "demo-4", firstName: "Jennifer", lastName: "Wu", phone: "(555) 456-7890", email: "jennifer.wu@email.com", lastContacted: "Jan 4", leadSource: "Website", pipelineStage: 0, isInPipeline: true, isDemo: true },
  { id: "demo-5", firstName: "David", lastName: "Chen", phone: "(555) 567-8901", email: "d.chen@email.com", lastContacted: "Jan 2", leadSource: "Past Client", tags: ["Past Client"], dealHistory: "Closed 2023. 4BR Colonial, $425k.", pipelineStage: 6, isInPipeline: true, isDemo: true, notes: [{ date: "Jan 2", content: "Checking in for annual follow-up. Happy in new home, may have referrals." }] },
  { id: "demo-6", firstName: "Robert", lastName: "Johnson", phone: "(555) 678-9012", email: "r.johnson@email.com", lastContacted: "Dec 28", leadSource: "Sphere", tags: ["Seller"], pipelineStage: 5, isInPipeline: true, isDemo: true },
  // New contacts NOT in pipeline
  { id: "demo-7", firstName: "Amanda", lastName: "Torres", phone: "(555) 111-2233", email: "amanda.torres@email.com", lastContacted: "Dec 20", leadSource: "Facebook Ad", isInPipeline: false, isDemo: true },
  { id: "demo-8", firstName: "Kevin", lastName: "Park", phone: "(555) 222-3344", email: "kevin.park@email.com", lastContacted: "Dec 18", leadSource: "Zillow", isInPipeline: false, isDemo: true },
  { id: "demo-9", firstName: "Lisa", lastName: "Martinez", phone: "(555) 333-4455", email: "lisa.martinez@email.com", lastContacted: "Dec 15", leadSource: "Cold Call", tags: ["Investor"], isInPipeline: false, isDemo: true },
  { id: "demo-10", firstName: "Thomas", lastName: "Wright", phone: "(555) 444-5566", email: "t.wright@email.com", lastContacted: "Dec 12", leadSource: "Networking Event", isInPipeline: false, isDemo: true },
  { id: "demo-11", firstName: "Rachel", lastName: "Kim", phone: "(555) 555-6677", email: "rachel.kim@email.com", lastContacted: "Dec 10", leadSource: "Referral", tags: ["First-Time Buyer"], isInPipeline: false, isDemo: true },
];

export default function Database() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>(demoContacts);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pipelineContact, setPipelineContact] = useState<Contact | null>(null);
  const [pipelineNames, setPipelineNames] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { setIsContactOpen } = useDatabaseContext();
  const isMobile = useIsMobile();

  // Update contact handler
  const handleUpdateContact = async (updatedContact: Contact) => {
    if (updatedContact.isDemo) {
      toast({
        title: "Demo contact",
        description: "Demo contacts cannot be edited. Create a real contact to test editing.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("contacts")
        .update({
          first_name: updatedContact.firstName,
          last_name: updatedContact.lastName,
          phone: updatedContact.phone || null,
          email: updatedContact.email || null,
          address: updatedContact.address || null,
          lead_source: updatedContact.leadSource || null,
          tags: updatedContact.tags || [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", updatedContact.id);

      if (error) throw error;

      toast({
        title: "Contact updated",
        description: `${updatedContact.firstName} ${updatedContact.lastName} has been updated.`,
      });

      // Update local state
      setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
      setSelectedContact(updatedContact);
    } catch (error: any) {
      console.error("Error updating contact:", error);
      toast({
        title: "Error updating contact",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  // Delete contact handler
  const handleDeleteContact = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact?.isDemo) {
      toast({
        title: "Demo contact",
        description: "Demo contacts cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;

      toast({
        title: "Contact deleted",
        description: "The contact has been removed.",
      });

      setSelectedContact(null);
      setContacts(prev => prev.filter(c => c.id !== contactId));
    } catch (error: any) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Error deleting contact",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    return (
      fullName.includes(query) ||
      contact.firstName.toLowerCase().includes(query) ||
      contact.lastName.toLowerCase().includes(query) ||
      contact.phone.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query)
    );
  });

  const fetchPipelineContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("opportunities")
        .select("contact_name");

      if (error) {
        console.error("Error fetching pipeline contacts:", error);
        return;
      }

      if (data) {
        const names = new Set(data.map((o) => o.contact_name.toLowerCase()));
        setPipelineNames(names);
      }
    } catch (error) {
      console.error("Error fetching pipeline contacts:", error);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Show demo data for unauthenticated users
        setContacts(demoContacts);
        return;
      }

      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("last_contacted", { ascending: false });

      if (error) {
        console.error("Error fetching contacts:", error);
        return;
      }

      // For authenticated users, show only real data (no demo mixing)
      if (data && data.length > 0) {
        const formattedContacts: Contact[] = data.map((c) => ({
          id: c.id,
          firstName: c.first_name,
          lastName: c.last_name,
          phone: c.phone || "",
          email: c.email || "",
          lastContacted: new Date(c.last_contacted || c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          leadSource: c.lead_source || undefined,
          address: c.address || undefined,
          tags: c.tags || undefined,
          dealHistory: c.deal_history || undefined,
          pipelineStage: c.pipeline_stage || 0,
          isInPipeline: false,
          isDemo: false,
        }));
        setContacts(formattedContacts);
      } else {
        // Authenticated but no contacts yet - show empty state
        setContacts([]);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchPipelineContacts();
  }, []);

  useEffect(() => {
    setIsContactOpen(selectedContact !== null);
    return () => setIsContactOpen(false);
  }, [selectedContact, setIsContactOpen]);

  const isContactInPipeline = (contact: Contact): boolean => {
    if (contact.isInPipeline) return true;
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    return pipelineNames.has(fullName);
  };

  const handleAddToPipeline = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isContactInPipeline(contact)) {
      setPipelineContact(contact);
    }
  };

  const handlePipelineSuccess = () => {
    fetchPipelineContacts();
  };

  return (
    <div className="animate-fade-in min-h-screen">
      <div className="mb-6 md:mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-medium text-foreground/90">Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground/50">Everyone you know.</p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-black font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Contact
          </Button>
        </div>
      </div>

      {/* Mobile: Stacked cards */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredContacts.map((contact) => {
            const inPipeline = isContactInPipeline(contact);
            return (
              <div
                key={contact.id}
                className="mobile-data-card tap-highlight"
                onClick={() => setSelectedContact(contact)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium contact-name-gradient">{contact.firstName} {contact.lastName}</h3>
                    <p className="text-sm text-muted-foreground/70">{contact.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground/50">{contact.lastContacted}</span>
                </div>
                <p className="text-sm text-muted-foreground/60">{contact.phone}</p>
                <div className="flex items-center justify-between mt-3">
                  {contact.tags ? (
                    <div className="flex flex-wrap gap-1.5">
                      {contact.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary/70">{tag}</span>
                      ))}
                    </div>
                  ) : (
                    <div />
                  )}
                  {inPipeline ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/20 text-primary text-xs font-medium">
                      <Check className="w-3 h-3" />
                      Active in Pipeline
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={(e) => handleAddToPipeline(contact, e)}
                      className="bg-primary hover:bg-primary/90 text-black text-xs font-medium h-7 px-2"
                    >
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Pipeline
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop: Table view */
        <div className="rounded-lg border border-border/30 overflow-hidden bg-background/50">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30 bg-secondary/20">
                <th className="px-4 py-3 text-left text-xs font-normal text-muted-foreground/50 uppercase tracking-wider">First Name</th>
                <th className="px-4 py-3 text-left text-xs font-normal text-muted-foreground/50 uppercase tracking-wider">Last Name</th>
                <th className="px-4 py-3 text-left text-xs font-normal text-muted-foreground/50 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-normal text-muted-foreground/50 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-normal text-muted-foreground/50 uppercase tracking-wider">Last Contacted</th>
                <th className="px-4 py-3 text-left text-xs font-normal text-muted-foreground/50 uppercase tracking-wider">Add to Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => {
                const inPipeline = isContactInPipeline(contact);
                return (
                  <tr key={contact.id} className="border-b border-border/30 cursor-pointer transition-colors duration-200 hover:bg-secondary/20" onClick={() => setSelectedContact(contact)}>
                    <td className="px-4 py-4 text-sm font-medium contact-name-gradient">{contact.firstName}</td>
                    <td className="px-4 py-4 text-sm contact-name-gradient">{contact.lastName}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground/70">{contact.phone}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground/70">{contact.email}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground/60">{contact.lastContacted}</td>
                    <td className="px-4 py-4">
                      {inPipeline ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/20 text-primary text-xs font-medium whitespace-nowrap">
                          <Check className="w-3.5 h-3.5 flex-shrink-0" />
                          Active in Pipeline
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => handleAddToPipeline(contact, e)}
                          className="bg-primary hover:bg-primary/90 text-black text-xs font-medium h-8"
                        >
                          <ArrowRight className="w-3 h-3 mr-1" />
                          Add to Pipeline
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ContactModal
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onUpdate={handleUpdateContact}
        onDelete={handleDeleteContact}
      />
      <CreateContactModal 
        open={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onContactCreated={fetchContacts}
      />
      <AddToPipelineModal
        open={pipelineContact !== null}
        onClose={() => setPipelineContact(null)}
        contactName={pipelineContact ? `${pipelineContact.firstName} ${pipelineContact.lastName}` : ""}
        onSuccess={handlePipelineSuccess}
      />
    </div>
  );
}