import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface EmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
}

export function EmbedDialog({ open, onOpenChange, code }: EmbedDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Embed this alert</DialogTitle>
          <DialogDescription>
            Paste this into any page. The embed shows the map focused on the
            alert.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          readOnly
          rows={4}
          value={code}
          className="text-[11px] text-canopy"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleCopy}>{copied ? "Copied ✓" : "Copy code"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}