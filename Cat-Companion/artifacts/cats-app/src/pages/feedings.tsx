import { Link } from "wouter";
import {
  useListCats,
  useListFeedings,
} from "@workspace/api-client-react";
import { Utensils, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CatAvatar } from "@/components/cat-avatar";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { cn } from "@/lib/utils";

export default function FeedingsOverview() {
  const { data: cats, isLoading } = useListCats();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-serif font-medium text-foreground tracking-tight">Feedings</h1>
        <p className="text-muted-foreground mt-1">A quick look at who's been fed and who's waiting.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : !cats || cats.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-card/50">
          <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">No cats yet</h3>
          <p className="text-muted-foreground mb-6">Add your first cat to track their feeding.</p>
          <Link href="/">
            <Button>Go to My Cats</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cats.map((cat) => (
            <CatFeedingRow key={cat.id} cat={cat} />
          ))}
        </div>
      )}
    </div>
  );
}

function CatFeedingRow({ cat }: { cat: any }) {
  const { data: feedings, isLoading } = useListFeedings(cat.id, {
    query: { enabled: !!cat.id },
  });

  const lastFeeding = feedings && feedings.length > 0
    ? feedings.reduce((latest: any, f: any) =>
        new Date(f.fedAt) > new Date(latest.fedAt) ? f : latest
      )
    : null;

  const hoursSince = lastFeeding
    ? differenceInHours(new Date(), new Date(lastFeeding.fedAt))
    : null;

  const status = (() => {
    if (hoursSince === null) return { label: "Never fed", color: "text-rose-600", bg: "bg-rose-50 border-rose-200" };
    if (hoursSince < 4)  return { label: "Fed recently", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
    if (hoursSince < 8)  return { label: "Due soon", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" };
    return                      { label: "Overdue",    color: "text-rose-600",  bg: "bg-rose-50 border-rose-200" };
  })();

  return (
    <div className={cn("flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors", status.bg)}>
      {isLoading ? (
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      ) : (
        <CatAvatar photoUrl={cat.photoUrl} name={cat.name} className="h-10 w-10 shrink-0 ring-2 ring-white" />
      )}

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">{cat.name}</p>
        <p className={cn("text-sm font-medium", status.color)}>
          {status.label}
          {lastFeeding && (
            <span className="font-normal text-muted-foreground ml-1.5">
              · {formatDistanceToNow(new Date(lastFeeding.fedAt), { addSuffix: true })}
              {lastFeeding.foodType ? ` · ${lastFeeding.foodType}` : ""}
              {lastFeeding.amountGrams ? ` (${lastFeeding.amountGrams}g)` : ""}
            </span>
          )}
        </p>
      </div>

      <Link href={`/cats/${cat.id}/feedings`}>
        <Button size="sm" variant="outline" className="shrink-0 border-current bg-white/60 hover:bg-white/90 gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Log
        </Button>
      </Link>
    </div>
  );
}
