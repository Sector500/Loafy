import { Link } from "wouter";
import { Check, ChevronLeft, Sparkles, Cat, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/use-subscription";
import { useUser } from "@clerk/react";

const FREE_FEATURES = [
  "1 cat profile",
  "Store vet details",
  "Basic medication reminders",
  "Food tracker",
  "Weight tracker (30-day history)",
  "5 milestones per cat",
  "20 photo memories per cat",
  "Access to basic care guides",
];

const PLUS_FEATURES = [
  "Unlimited cat profiles",
  "Unlimited food logs",
  "Unlimited milestones",
  "Unlimited photo memories",
  "Full weight history & charts",
  "Recurring medication schedules",
  "Vaccine, flea & worm reminders",
  "Memory timeline",
  "Export cat baby book as PDF",
  "Shared family access",
  "Premium care guides",
  "Backup & sync",
];

export default function Pricing() {
  const { isPlus } = useSubscription();
  const { isSignedIn } = useUser();

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-16 max-w-3xl mx-auto">
      <div>
        <Link href="/">
          <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-4xl font-serif font-medium text-foreground">Simple, honest pricing</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Free for one cat. Plus for the whole clowder.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Free tier */}
        <div className="rounded-2xl border border-border bg-card p-8 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cat className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold text-foreground">Loafing Free</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-serif font-medium text-foreground">£0</span>
              <span className="text-muted-foreground mb-1">/ forever</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Perfect for one cat and everyday basics.
            </p>
          </div>

          <ul className="space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {!isSignedIn ? (
            <Link href="/sign-up">
              <Button variant="outline" className="w-full">Get started free</Button>
            </Link>
          ) : !isPlus ? (
            <Button variant="outline" className="w-full" disabled>
              Your current plan
            </Button>
          ) : null}
        </div>

        {/* Plus tier */}
        <div className="rounded-2xl border-2 border-primary bg-card p-8 space-y-6 relative">
          <div className="absolute top-4 right-4">
            <Badge className="bg-primary text-primary-foreground font-medium">Most popular</Badge>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold text-primary">Loafing Plus</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-serif font-medium text-foreground">£25</span>
              <span className="text-muted-foreground mb-1">/ year</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Your cat's health, routines and memories in one place.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Everything in Free, plus:
            </p>
            <ul className="space-y-3">
              {PLUS_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {isPlus ? (
            <Button className="w-full" disabled>
              You're on Loafing Plus
            </Button>
          ) : !isSignedIn ? (
            <Link href="/sign-up">
              <Button className="w-full gap-2">
                <Sparkles className="w-4 h-4" />
                Start Plus
              </Button>
            </Link>
          ) : (
            <UpgradeButton />
          )}
        </div>
      </div>

      {/* Upgrade trigger cards */}
      <div className="pt-4 space-y-4">
        <h2 className="text-xl font-serif font-medium text-foreground">What you unlock</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: "Unlimited memories", desc: "Store every milestone and photo — no limits, forever." },
            { title: "Full health charts", desc: "Complete weight history and trends over any time period." },
            { title: "Multi-cat support", desc: "Add every cat in your home with one shared account." },
            { title: "PDF keepsake export", desc: "Print or share your cat's baby book as a beautiful PDF." },
          ].map(({ title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-card/60 p-5 flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center space-y-2 text-sm text-muted-foreground pt-2 border-t border-border">
        <p className="pt-4">Payments powered by Stripe. Cancel any time. Annual renewal.</p>
      </div>
    </div>
  );
}

function UpgradeButton() {
  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        alert("Checkout is not yet available — Stripe is not connected. Please check back soon.");
        return;
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      alert("Checkout is not yet available. Please connect Stripe to enable payments.");
    }
  };

  return (
    <Button className="w-full gap-2" onClick={handleUpgrade}>
      <Sparkles className="w-4 h-4" />
      Start Plus — £25/yr
    </Button>
  );
}
