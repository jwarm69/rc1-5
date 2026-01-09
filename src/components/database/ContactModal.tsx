import { useEffect, useState } from "react";
import { X, Mail, Upload, RefreshCw, Calendar, CheckSquare, Pencil, Trash2, Save } from "lucide-react";
import { StageTracker } from "./StageTracker";
import { ActivityTimeline } from "./ActivityTimeline";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  notes?: { date: string; content: string }[];
  dealHistory?: string;
  pipelineStage?: number;
  isDemo?: boolean;
}

interface ContactModalProps {
  contact: Contact | null;
  onClose: () => void;
  onUpdate?: (contact: Contact) => Promise<void>;
  onDelete?: (contactId: string) => Promise<void>;
}

const actionButtons = [
  { label: "Email", fullLabel: "Send to Mailchimp", icon: Mail, variant: "secondary" as const },
  { label: "Upload", fullLabel: "Upload", icon: Upload, variant: "secondary" as const },
  { label: "Schedule", fullLabel: "Schedule", icon: Calendar, variant: "secondary" as const },
  { label: "Close", fullLabel: "Mark Closed", icon: CheckSquare, variant: "secondary" as const },
];

export function ContactModal({ contact, onClose, onUpdate, onDelete }: ContactModalProps) {
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editedContact, setEditedContact] = useState<Contact | null>(null);

  // Reset edit state when contact changes
  useEffect(() => {
    setIsEditing(false);
    setEditedContact(contact);
  }, [contact]);

  const handleEdit = () => {
    if (contact?.isDemo) return;
    setEditedContact(contact);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContact(contact);
  };

  const handleSave = async () => {
    if (!editedContact || !onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(editedContact);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!contact || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(contact.id);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = (field: keyof Contact, value: string) => {
    if (!editedContact) return;
    setEditedContact({ ...editedContact, [field]: value });
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (contact) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [contact, onClose]);

  if (!contact) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 transition-opacity duration-300" />
      
      <div 
        className={`relative w-full md:w-[85vw] md:max-w-5xl mx-0 md:mx-auto my-auto ${isMobile ? 'animate-slide-in-up' : 'animate-fade-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Matrix green glow - reduced on mobile */}
        <div className="absolute -inset-2 md:-inset-3 rounded-t-2xl md:rounded-2xl bg-primary/15 md:bg-primary/20 blur-xl md:blur-2xl opacity-50 pointer-events-none" />
        
        <div className={`relative bg-background border border-border/40 shadow-2xl overflow-hidden max-h-[80vh] md:max-h-[75vh] overflow-y-auto scrollbar-none ${isMobile ? 'rounded-t-2xl' : 'rounded-lg'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Mobile drag handle */}
          {isMobile && (
            <div className="flex justify-center py-3 border-b border-border/20">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors duration-200 touch-target z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="px-5 md:px-8 pt-5 md:pt-8 pb-4">
            <div className="pr-10">
              {isEditing && editedContact ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={editedContact.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      placeholder="First name"
                      className="bg-secondary/50 border-border text-lg font-medium"
                    />
                    <Input
                      value={editedContact.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      placeholder="Last name"
                      className="bg-secondary/50 border-border text-lg font-medium"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary/90 text-black font-medium"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl md:text-2xl font-medium contact-name-gradient">
                      {contact.firstName} {contact.lastName}
                    </h2>
                    {contact.tags && contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {contact.tags.map((tag) => (
                          <span key={tag} className="px-2.5 py-1 text-xs rounded-md bg-primary/10 text-primary/70 font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Edit/Delete buttons - only show for non-demo contacts */}
                  {!contact.isDemo && onUpdate && onDelete && (
                    <div className="flex gap-2 mr-8">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEdit}
                        className="h-8"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="px-5 md:px-8 pb-5 border-b border-border/20">
            {isMobile ? (
              <div className="flex flex-wrap gap-2">
                {actionButtons.map((action) => {
                  const Icon = action.icon;
                  
                  return (
                    <button
                      key={action.label}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ease-out touch-target bg-secondary/50 text-foreground/80 border border-border/40"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {actionButtons.map((action) => {
                  const Icon = action.icon;
                  
                  return (
                    <button
                      key={action.fullLabel}
                      className="group relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ease-out bg-secondary/50 text-foreground/80 border border-border/40 hover:bg-secondary hover:border-primary/30"
                    >
                      <Icon className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">{action.fullLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div className="px-5 md:px-8 py-5 space-y-4">
            {isEditing && editedContact ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground/50 uppercase tracking-wider">Address</label>
                  <Input
                    value={editedContact.address || ""}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Address"
                    className="mt-1 bg-secondary/50 border-border"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground/50 uppercase tracking-wider">Phone</label>
                    <Input
                      value={editedContact.phone || ""}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="Phone"
                      className="mt-1 bg-secondary/50 border-border"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground/50 uppercase tracking-wider">Email</label>
                    <Input
                      value={editedContact.email || ""}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="Email"
                      className="mt-1 bg-secondary/50 border-border"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground/50 uppercase tracking-wider">Lead Source</label>
                    <Input
                      value={editedContact.leadSource || ""}
                      onChange={(e) => updateField("leadSource", e.target.value)}
                      placeholder="Lead Source"
                      className="mt-1 bg-secondary/50 border-border"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {contact.address && (
                  <p className="text-sm text-foreground/80 leading-relaxed">{contact.address}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-foreground/70">
                      <span className="text-muted-foreground/50">Phone:</span> {contact.phone}
                    </p>
                    <p className="text-sm text-foreground/70">
                      <span className="text-muted-foreground/50">Email:</span> {contact.email}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {contact.leadSource && (
                      <p className="text-sm text-foreground/70">
                        <span className="text-muted-foreground/50">Lead Source:</span> {contact.leadSource}
                      </p>
                    )}
                    <p className="text-sm text-foreground/70">
                      <span className="text-muted-foreground/50">Last Contacted:</span> {contact.lastContacted}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <StageTracker currentStage={contact.pipelineStage ?? 0} />

          <ActivityTimeline contactId={contact.id} />

          {contact.dealHistory && (
            <div className="px-5 md:px-8 py-5 border-t border-border/20">
              <h3 className="text-xs text-primary/80 uppercase tracking-wider mb-3 font-medium">Deal History</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">{contact.dealHistory}</p>
            </div>
          )}

          {contact.notes && contact.notes.length > 0 && (
            <div className="px-5 md:px-8 py-5 border-t border-border/20">
              <h3 className="text-xs text-primary/80 uppercase tracking-wider mb-4 font-medium">Notes</h3>
              <div className="space-y-4">
                {contact.notes.map((note, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-xs text-muted-foreground/50 font-medium">{note.date}</p>
                    <p className="text-sm text-foreground/70 leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom safe area padding */}
          <div className="h-4 md:h-6 safe-area-bottom" />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {contact.firstName} {contact.lastName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}