import { useState } from "react";
import { Link } from "wouter";
import { useListCats, useCreateCat, getListCatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Cat, LogIn, Sparkles, BarChart2, Image, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/react";
import { useSubscription } from "@/hooks/use-subscription";
import { UpgradeModal } from "@/components/upgrade-modal";

export default function CatsIndex() {
  const { isSignedIn, isLoaded } = useUser();
  const { data: cats, isLoading } = useListCats({ query: { enabled: isLoaded && !!isSignedIn } });
  const { isPlus } = useSubscription();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string | undefined>();

  const showUpgrade = (feature: string) => {
    setUpgradeFeature(feature);
    setUpgradeOpen(true);
  };

  if (isLoaded && !isSignedIn) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-serif text-primary tracking-tight">My Cats</h1>
          <p className="text-muted-foreground mt-1">Manage your furry family members.</p>
        </div>
        <div className="text-center py-24 border-2 border-dashed border-border rounded-xl bg-background/50 space-y-5">
          <Cat className="h-14 w-14 text-muted-foreground mx-auto opacity-40" />
          <div>
            <h3 className="text-xl font-serif font-medium text-foreground mb-2">Sign in to see your cats</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Create a free account to start tracking your cat's life — from meals to milestones.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link href="/sign-in">
              <Button variant="outline" className="gap-2">
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="gap-2">Get started free</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const LOCKED_PLUS_CARDS = [
    {
      icon: Cat,
      title: "Multiple cats",
      desc: "Add every cat in your home under one account.",
      feature: "Multiple cat profiles",
    },
    {
      icon: Image,
      title: "Unlimited memories",
      desc: "Store unlimited milestones and photo memories.",
      feature: "Unlimited memories",
    },
    {
      icon: BarChart2,
      title: "Full health charts",
      desc: "Complete weight history and trends over any time.",
      feature: "Full health charts",
    },
    {
      icon: FileDown,
      title: "PDF keepsake export",
      desc: "Print or share your cat's baby book as a PDF.",
      feature: "PDF keepsake export",
    },
  ];

  return (
    <div className="space-y-8">
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature={upgradeFeature} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-primary tracking-tight">My Cats</h1>
          <p className="text-muted-foreground mt-1">Manage your furry family members.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Cat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a New Cat</DialogTitle>
            </DialogHeader>
            <AddCatForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full rounded-none" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : cats && cats.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cats.map((cat) => (
              <Link key={cat.id} href={`/cats/${cat.id}`}>
                <Card className="overflow-hidden hover-elevate transition-all cursor-pointer group">
                  <div className="h-48 bg-muted relative border-b border-border">
                    {cat.photoUrl ? (
                      <img src={cat.photoUrl} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/50 group-hover:bg-secondary/70 transition-colors">
                        <Cat className="h-16 w-16 opacity-50" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-xl font-serif font-medium text-foreground">{cat.name}</h3>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      {cat.breed && <span>{cat.breed}</span>}
                      {cat.breed && cat.weightKg && <span>•</span>}
                      {cat.weightKg && <span>{cat.weightKg} kg</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Locked Plus cards for free users */}
          {!isPlus && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Unlock with Loafing Plus
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LOCKED_PLUS_CARDS.map(({ icon: Icon, title, desc, feature }) => (
                  <button
                    key={title}
                    onClick={() => showUpgrade(feature)}
                    className="text-left rounded-xl border border-dashed border-border bg-card/40 p-5 flex gap-3 items-start hover:bg-card/80 hover:border-primary/30 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <Icon className="w-4 h-4 text-primary/60" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground/70 group-hover:text-foreground transition-colors">{title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="text-center py-20 border-2 border-dashed border-border rounded-xl bg-background/50">
            <Cat className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-serif font-medium text-foreground mb-2">No cats yet</h3>
            <p className="text-muted-foreground mb-6">Add your first furry friend to get started.</p>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Cat
            </Button>
          </div>

          {/* Teaser for Plus features even before first cat */}
          {!isPlus && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Unlock with Loafing Plus
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LOCKED_PLUS_CARDS.map(({ icon: Icon, title, desc, feature }) => (
                  <button
                    key={title}
                    onClick={() => showUpgrade(feature)}
                    className="text-left rounded-xl border border-dashed border-border bg-card/40 p-5 flex gap-3 items-start hover:bg-card/80 hover:border-primary/30 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <Icon className="w-4 h-4 text-primary/60" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground/70 group-hover:text-foreground transition-colors">{title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddCatForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createCat = useCreateCat();
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createCat.mutate(
      {
        data: {
          name,
          breed: breed || null,
          weightKg: weightKg ? parseFloat(weightKg) : null,
          photoUrl: photoUrl || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCatsQueryKey() });
          onSuccess();
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          if (msg) setError(msg);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}{" "}
          <Link href="/pricing" className="underline font-medium">
            Upgrade to Plus
          </Link>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="breed">Breed</Label>
        <Input id="breed" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="e.g. Maine Coon" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="weightKg">Weight (kg)</Label>
        <Input id="weightKg" type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="photoUrl">Photo URL</Label>
        <Input id="photoUrl" type="url" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div className="pt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={createCat.isPending || !name}>
          {createCat.isPending ? "Adding..." : "Add Cat"}
        </Button>
      </div>
    </form>
  );
}
