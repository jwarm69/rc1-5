import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Check } from "lucide-react";

const PIPELINE_STAGES = [
  { value: "Initial Contact", label: "Initial Contact", description: "First reach out" },
  { value: "Follow Up", label: "Follow Up", description: "Following up on interest" },
  { value: "Showing", label: "Showing", description: "Showing properties" },
  { value: "Offer Submitted", label: "Offer Submitted", description: "Offer in progress" },
  { value: "Under Contract", label: "Under Contract", description: "Deal in progress" },
  { value: "Closed", label: "Closed", description: "Deal completed" },
];

interface AddToPipelineModalProps {
  open: boolean;
  onClose: () => void;
  contactName: string;
  contactId?: string;
  onSuccess?: () => void;
}

export function AddToPipelineModal({ open, onClose, contactName, contactId, onSuccess }: AddToPipelineModalProps) {
  const { user } = useAuth();
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    setSelectedStage("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedStage) {
      toast({
        title: "Please select a stage",
        description: "Choose a pipeline stage to add this contact.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to add contacts to the pipeline.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Convert stage label to index (0-5) for database storage
      const stageIndex = PIPELINE_STAGES.findIndex(s => s.value === selectedStage);

      const { error } = await supabase.from("opportunities").insert({
        user_id: user.id,
        contact_id: contactId || null,
        contact_name: contactName,
        stage: stageIndex >= 0 ? stageIndex : 0,
        deal_value: null,
        notes: `Added to pipeline from contacts on ${new Date().toLocaleDateString()}`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Added to Pipeline",
        description: `${contactName} has been added to the pipeline as "${selectedStage}".`,
      });

      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error("Error adding to pipeline:", error);
      toast({
        title: "Error adding to pipeline",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Add to Pipeline
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Select a pipeline stage for <span className="font-medium text-foreground">{contactName}</span>
          </p>

          <Label className="text-sm text-muted-foreground mb-3 block">
            Pipeline Stage
          </Label>
          
          <div className="grid gap-2">
            {PIPELINE_STAGES.map((stage) => (
              <button
                key={stage.value}
                type="button"
                onClick={() => setSelectedStage(stage.value)}
                className={`
                  flex items-center justify-between p-3 rounded-lg border transition-all duration-200
                  ${selectedStage === stage.value 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  }
                `}
              >
                <div className="text-left">
                  <p className={`text-sm font-medium ${selectedStage === stage.value ? 'text-primary' : 'text-foreground'}`}>
                    {stage.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{stage.description}</p>
                </div>
                {selectedStage === stage.value && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="border-border"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedStage}
            className="bg-primary hover:bg-primary/90 text-black font-medium"
          >
            {isSubmitting ? "Adding..." : "Add to Pipeline"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}