import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SupportFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportFormModal({ open, onOpenChange }: SupportFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[85vh] max-h-[800px] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-base font-medium">Report an issue</DialogTitle>
        </DialogHeader>
        <div className="flex-1 h-full overflow-auto p-4 pt-2">
          <iframe
            src="https://link.solai.systems/widget/form/JOBnjPktfrKiL4tykBYX"
            className="w-full h-full min-h-[700px] border-none rounded-md"
            id="inline-JOBnjPktfrKiL4tykBYX"
            data-layout="{'id':'INLINE'}"
            data-trigger-type="alwaysShow"
            data-trigger-value=""
            data-activation-type="alwaysActivated"
            data-activation-value=""
            data-deactivation-type="neverDeactivate"
            data-deactivation-value=""
            data-form-name="RCAI | SUPPORT INTAKE"
            data-height="777"
            data-layout-iframe-id="inline-JOBnjPktfrKiL4tykBYX"
            data-form-id="JOBnjPktfrKiL4tykBYX"
            title="RCAI | SUPPORT INTAKE"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
