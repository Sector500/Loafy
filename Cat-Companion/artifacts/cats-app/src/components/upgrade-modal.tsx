import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

const PLUS_HIGHLIGHTS = [
  "Unlimited cats",
  "Unlimited milestones & memories",
  "Full weight history & charts",
  "Recurring medication schedules",
  "Export cat baby book PDF",
  "Premium care guides",
];

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

export function UpgradeModal({ open, onClose, feature }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
        <div className="bg-primary/8 px-6 pt-6 pb-5 border-b border-border">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <DialogTitle className="font-serif text-xl">Unlock Loafing Plus</DialogTitle>
            </div>
            {feature && (
              <p className="text-sm text-muted-foreground ml-10">
                {feature} is a Loafing Plus feature.
              </p>
            )}
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          <ul className="space-y-2.5">
            {PLUS_HIGHLIGHTS.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <div className="rounded-xl bg-muted/50 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Loafing Plus</p>
              <p className="text-xs text-muted-foreground">Billed annually</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-serif font-medium text-foreground">£25</p>
              <p className="text-xs text-muted-foreground">per year</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Maybe later
            </Button>
            <Link href="/pricing" className="flex-1">
              <Button className="w-full gap-2" onClick={onClose}>
                <Sparkles className="w-4 h-4" />
                Start Plus — £25/yr
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
