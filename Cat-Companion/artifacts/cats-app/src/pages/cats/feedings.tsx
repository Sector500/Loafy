import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  useGetCat,
  useListFeedings,
  useLogFeeding,
  useDeleteFeeding,
  getListFeedingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Trash2, Utensils, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, formatDistanceToNow, differenceInHours } from "date-fns";
import { cn } from "@/lib/utils";

export default function CatFeedings() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data: cat } = useGetCat(id, { query: { enabled: !!id } });
  const { data: feedings, isLoading } = useListFeedings(id, { query: { enabled: !!id } });
  const deleteFeeding = useDeleteFeeding();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const lastFeeding = feedings && feedings.length > 0
    ? feedings.reduce((latest: any, f: any) =>
        new Date(f.fedAt) > new Date(latest.fedAt) ? f : latest
      )
    : null;

  const hoursSinceFed = lastFeeding
    ? differenceInHours(new Date(), new Date(lastFeeding.fedAt))
    : null;

  const feedingStatus = () => {
    if (hoursSinceFed === null) return null;
    if (hoursSinceFed < 4) return { label: "Fed recently", color: "bg-emerald-50 border-emerald-200 text-emerald-700" };
    if (hoursSinceFed < 8) return { label: "Due soon", color: "bg-amber-50 border-amber-200 text-amber-700" };
    return { label: "Overdue for a meal", color: "bg-rose-50 border-rose-200 text-rose-700" };
  };

  const status = feedingStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/cats/${id}`}>
          <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to {cat?.name || "Cat Profile"}
          </Button>
        </Link>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Feeding
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Feeding for {cat?.name}</DialogTitle>
            </DialogHeader>
            <AddFeedingForm catId={id} onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h1 className="text-3xl font-serif text-primary tracking-tight flex items-center gap-3">
          <Utensils className="h-8 w-8 text-primary/80" />
          Feeding Log
        </h1>
        <p className="text-muted-foreground mt-1">Keep track of what and when {cat?.name} eats.</p>
      </div>

      {/* Last fed status widget */}
      {!isLoading && lastFeeding && status && (
        <div className={cn("flex items-center gap-4 px-4 py-3 rounded-xl border", status.color)}>
          <Clock className="w-4 h-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold">{status.label}</span>
            <span className="text-sm ml-2 opacity-80">
              Last fed {formatDistanceToNow(new Date(lastFeeding.fedAt), { addSuffix: true })}
              {lastFeeding.foodType ? ` · ${lastFeeding.foodType}` : ""}
              {lastFeeding.amountGrams ? ` (${lastFeeding.amountGrams}g)` : ""}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-current bg-white/60 hover:bg-white/90"
            onClick={() => setIsAddOpen(true)}
          >
            Log now
          </Button>
        </div>
      )}

      {!isLoading && !lastFeeding && (
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-700">
          <Clock className="w-4 h-4 shrink-0" />
          <span className="flex-1 font-medium">No feedings logged yet</span>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-amber-300 bg-white/60 hover:bg-white/90"
            onClick={() => setIsAddOpen(true)}
          >
            Log first meal
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : feedings && feedings.length > 0 ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {feedings.map((feeding) => (
            <Card key={feeding.id} className="hover:border-primary/50 transition-colors group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary mt-1">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {feeding.foodType || "Food"}
                      {feeding.amountGrams ? ` · ${feeding.amountGrams}g` : ""}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(feeding.fedAt), "MMMM d, yyyy · h:mm a")}
                    </p>
                    {feeding.notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic border-l-2 border-primary/20 pl-2">
                        {feeding.notes}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    deleteFeeding.mutate(
                      { id: feeding.id },
                      {
                        onSuccess: () => {
                          queryClient.invalidateQueries({ queryKey: getListFeedingsQueryKey(id) });
                        },
                      }
                    );
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AddFeedingForm({ catId, onSuccess }: { catId: number; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const logFeeding = useLogFeeding();

  const [fedAt, setFedAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [foodType, setFoodType] = useState("");
  const [amountGrams, setAmountGrams] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logFeeding.mutate(
      {
        catId,
        data: {
          fedAt: new Date(fedAt).toISOString(),
          foodType: foodType || null,
          amountGrams: amountGrams ? parseFloat(amountGrams) : null,
          notes: notes || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFeedingsQueryKey(catId) });
          onSuccess();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="fedAt">Time *</Label>
        <Input id="fedAt" type="datetime-local" value={fedAt} onChange={(e) => setFedAt(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="foodType">Food Type</Label>
        <Input id="foodType" value={foodType} onChange={(e) => setFoodType(e.target.value)} placeholder="e.g. Dry Kibble, Wet Chicken" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amountGrams">Amount (grams)</Label>
        <Input id="amountGrams" type="number" value={amountGrams} onChange={(e) => setAmountGrams(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Did they eat it all?" />
      </div>
      <div className="pt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={logFeeding.isPending}>
          {logFeeding.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
