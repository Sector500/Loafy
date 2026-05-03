import { useState } from "react";
import { Link } from "wouter";
import {
  useListCats,
  useListMedications,
  useMarkMedicationGiven,
  useGetMedicationsDue,
  getListMedicationsQueryKey,
  getGetMedicationsDueQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, isBefore, isAfter, addHours } from "date-fns";
import { Pill, Check, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CatAvatar } from "@/components/cat-avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function MedicationsOverview() {
  const { data: cats, isLoading: isLoadingCats } = useListCats();
  const { data: medicationsDue, isLoading: isLoadingDue } = useGetMedicationsDue();
  const queryClient = useQueryClient();
  const markGiven = useMarkMedicationGiven();
  const now = new Date();

  const overdue = medicationsDue?.filter((m) => isBefore(new Date(m.nextDoseAt!), now)) ?? [];
  const dueSoon = medicationsDue?.filter(
    (m) => !isBefore(new Date(m.nextDoseAt!), now) && isBefore(new Date(m.nextDoseAt!), addHours(now, 4))
  ) ?? [];
  const hasAlerts = overdue.length > 0 || dueSoon.length > 0;

  if (isLoadingCats) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-serif font-medium text-foreground tracking-tight">
          Medications
        </h1>
        <p className="text-muted-foreground mt-1">Active treatments and upcoming doses.</p>
      </div>

      {/* Due now / overdue widget */}
      {!isLoadingDue && hasAlerts && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Needs attention
          </p>
          {[...overdue, ...dueSoon].map((med) => {
            const dueDate = new Date(med.nextDoseAt!);
            const isOverdue = isBefore(dueDate, now);
            return (
              <div
                key={med.id}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl border",
                  isOverdue ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-full shrink-0",
                    isOverdue ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700"
                  )}
                >
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-foreground">{med.catName}</span>
                  <span className="text-muted-foreground mx-2">·</span>
                  <span className="text-foreground">{med.name}</span>
                  {med.dose && (
                    <span className="text-sm text-muted-foreground ml-1">{med.dose}</span>
                  )}
                  <div
                    className={cn(
                      "text-sm mt-0.5 font-medium",
                      isOverdue ? "text-rose-600" : "text-amber-700"
                    )}
                  >
                    {isOverdue
                      ? `Overdue since ${format(dueDate, "h:mm a")}`
                      : `Due at ${format(dueDate, "h:mm a")}`}
                  </div>
                </div>
                <QuickGiveButton med={med} queryClient={queryClient} markGiven={markGiven} />
              </div>
            );
          })}
        </div>
      )}

      {/* Per-cat medication lists */}
      {!cats || cats.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-card/50">
          <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">No cats found</h3>
          <p className="text-muted-foreground mb-6">Add your first cat to manage their medications.</p>
          <Link href="/">
            <Button>Go to My Cats</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {cats.map((cat) => (
            <CatMedicationsSection key={cat.id} cat={cat} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuickGiveButton({ med, queryClient, markGiven }: { med: any; queryClient: any; markGiven: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nextDoseAt, setNextDoseAt] = useState("");

  const handleOpen = () => {
    const tmrw = addHours(new Date(), 24);
    const pad = (n: number) => n.toString().padStart(2, "0");
    setNextDoseAt(
      `${tmrw.getFullYear()}-${pad(tmrw.getMonth() + 1)}-${pad(tmrw.getDate())}T${pad(tmrw.getHours())}:${pad(tmrw.getMinutes())}`
    );
    setIsOpen(true);
  };

  const handleSave = () => {
    markGiven.mutate(
      { data: { id: med.id, nextDoseAt: new Date(nextDoseAt).toISOString() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMedicationsQueryKey(med.catId) });
          queryClient.invalidateQueries({ queryKey: getGetMedicationsDueQueryKey() });
          setIsOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" onClick={handleOpen} className="shrink-0">
          <Check className="w-4 h-4 mr-1" /> Give
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark {med.name} as given</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">When is the next dose due?</p>
          <div className="space-y-2">
            <Label htmlFor="nextDoseAt">Next dose</Label>
            <Input
              id="nextDoseAt"
              type="datetime-local"
              value={nextDoseAt}
              onChange={(e) => setNextDoseAt(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={markGiven.isPending || !nextDoseAt}>
            {markGiven.isPending ? "Saving..." : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CatMedicationsSection({ cat }: { cat: any }) {
  const { data: medications, isLoading } = useListMedications(cat.id, {
    query: { enabled: !!cat.id, queryKey: getListMedicationsQueryKey(cat.id) },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const activeMeds = medications?.filter((m) => m.isActive) || [];
  if (activeMeds.length === 0) return null;

  const now = new Date();

  return (
    <Card className="overflow-hidden bg-card/50">
      <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CatAvatar photoUrl={cat.photoUrl} name={cat.name} className="h-10 w-10 ring-2 ring-background" />
            <CardTitle className="text-xl font-serif">{cat.name}</CardTitle>
          </div>
          <Link href={`/cats/${cat.id}/medications`}>
            <Button variant="outline" size="sm">Manage</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-border/50">
        {activeMeds.map((med) => {
          const nextDose = new Date(med.nextDoseAt!);
          const isOverdue = isBefore(nextDose, now);
          const isSoon = isAfter(nextDose, now) && isBefore(nextDose, addHours(now, 2));

          return (
            <div key={med.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-muted/30 transition-colors">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground text-lg">{med.name}</h4>
                  <span className="text-sm px-2 py-0.5 bg-secondary/20 text-secondary-foreground rounded-md font-medium">
                    {med.dose}
                  </span>
                  <span className="text-sm text-muted-foreground italic">{med.frequencyLabel}</span>
                </div>
                {med.notes && <p className="text-sm text-muted-foreground mt-1">{med.notes}</p>}
              </div>
              <div
                className={cn(
                  "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border font-medium self-start md:self-auto",
                  isOverdue
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : isSoon
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-muted text-muted-foreground border-transparent"
                )}
              >
                <Clock className="w-4 h-4" />
                {isOverdue ? "Overdue" : "Due"}: {format(nextDose, "MMM d, h:mm a")}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
