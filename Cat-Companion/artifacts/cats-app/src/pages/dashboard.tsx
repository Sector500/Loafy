import {
  useGetRecentFeedings,
  useGetUpcomingAppointments,
  useGetRecentMilestones,
  useGetMedicationsDue,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronRight, Pill, BookHeart, Stethoscope, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CatAvatar } from "@/components/cat-avatar";
import { format, isBefore, isToday, isTomorrow, differenceInDays } from "date-fns";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning.";
  if (h < 18) return "Good afternoon.";
  return "Good evening.";
}

function appointmentWhen(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return { label: "Today", urgent: true };
  if (isTomorrow(d)) return { label: "Tomorrow", urgent: true };
  const days = differenceInDays(d, new Date());
  if (days <= 7) return { label: `In ${days} days`, urgent: false };
  return { label: format(d, "MMM d"), urgent: false };
}

export default function Dashboard() {
  const { data: feedings, isLoading: isLoadingFeedings } = useGetRecentFeedings();
  const { data: appointments, isLoading: isLoadingAppointments } = useGetUpcomingAppointments();
  const { data: milestones, isLoading: isLoadingMilestones } = useGetRecentMilestones();
  const { data: medicationsDue, isLoading: isLoadingMedications } = useGetMedicationsDue();

  const now = new Date();
  const hasAlerts =
    !isLoadingMedications && medicationsDue && medicationsDue.length > 0;
  const thisWeekApts = appointments?.filter((a) => {
    const days = differenceInDays(new Date(a.date), now);
    return days <= 7;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-4xl font-serif text-foreground tracking-tight">{greeting()}</h1>
      </div>

      {/* Medication alerts — only shown when needed */}
      {hasAlerts && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Needs attention
          </p>
          {medicationsDue!.map((med) => {
            const dueDate = new Date(med.nextDoseAt!);
            const isOverdue = isBefore(dueDate, now);
            return (
              <Link key={med.id} href={`/cats/${med.catId}/medications`}>
                <div
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm",
                    isOverdue
                      ? "bg-rose-50 border-rose-200"
                      : "bg-amber-50 border-amber-200"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-full shrink-0",
                    isOverdue ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700"
                  )}>
                    <Pill className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-foreground">{med.catName}</span>
                    <span className="text-muted-foreground mx-2">·</span>
                    <span className="text-foreground">{med.name}</span>
                    {med.dose && (
                      <span className="text-sm text-muted-foreground ml-1">{med.dose}</span>
                    )}
                    <div className={cn(
                      "text-sm mt-0.5 font-medium",
                      isOverdue ? "text-rose-600" : "text-amber-700"
                    )}>
                      {isOverdue
                        ? `Overdue since ${format(dueDate, "h:mm a")}`
                        : `Due at ${format(dueDate, "h:mm a")}`}
                    </div>
                  </div>
                  <AlertCircle className={cn(
                    "w-4 h-4 shrink-0",
                    isOverdue ? "text-rose-400" : "text-amber-500"
                  )} />
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {/* Upcoming vet visits — only this week, only if they exist */}
      {!isLoadingAppointments && thisWeekApts && thisWeekApts.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Vet visits this week
          </p>
          {thisWeekApts.map((apt) => {
            const when = appointmentWhen(apt.date);
            return (
              <Link key={apt.id} href={`/cats/${apt.catId}/appointments`}>
                <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border/60 bg-card hover:shadow-sm transition-all cursor-pointer">
                  <CatAvatar photoUrl={apt.catPhotoUrl} name={apt.catName} className="h-10 w-10 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{apt.catName}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {apt.type}{apt.vetName ? ` with ${apt.vetName}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 font-normal",
                      when.urgent
                        ? "border-amber-300 text-amber-700 bg-amber-50"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {when.label}
                  </Badge>
                </div>
              </Link>
            );
          })}
          {(appointments?.length ?? 0) > (thisWeekApts?.length ?? 0) && (
            <Link href="/cats">
              <p className="text-sm text-primary/70 px-1 hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5" />
                {(appointments!.length - thisWeekApts!.length)} more upcoming
                <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </Link>
          )}
        </section>
      )}

      {/* Recent Memories — the heart of the app */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Recent memories
          </p>
          <Link href="/baby-books">
            <Button variant="ghost" size="sm" className="text-primary/70 hover:text-primary h-7 px-2 text-xs">
              All baby books
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          </Link>
        </div>

        {isLoadingMilestones ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : milestones && milestones.length > 0 ? (
          <div className="space-y-5">
            {milestones.slice(0, 6).map((milestone) => (
              <Link key={milestone.id} href={`/cats/${milestone.catId}/baby-book`}>
                <div className="flex gap-3 group cursor-pointer">
                  <CatAvatar
                    photoUrl={milestone.catPhotoUrl}
                    name={milestone.catName}
                    className="h-9 w-9 shrink-0 mt-0.5 ring-2 ring-background"
                  />
                  <div className="flex-1 min-w-0 pb-5 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {milestone.catName}
                      </span>
                      {milestone.ageDescription && (
                        <Badge
                          variant="outline"
                          className="bg-primary/5 text-primary border-primary/20 font-normal text-xs px-1.5 py-0"
                        >
                          {milestone.ageDescription}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground/60 ml-auto shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(milestone.capturedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="font-serif text-lg text-foreground leading-snug group-hover:text-primary/80 transition-colors">
                      {milestone.title}
                    </p>
                    {milestone.notes && (
                      <p className="text-sm text-muted-foreground italic mt-1 line-clamp-2">
                        "{milestone.notes}"
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-card/30">
            <BookHeart className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground text-sm">No memories yet.</p>
            <Link href="/baby-books">
              <Button variant="ghost" size="sm" className="mt-2 text-primary/70">
                Start a baby book
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Recent feedings — small, contextual, no drama */}
      {!isLoadingFeedings && feedings && feedings.length > 0 && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Last fed
          </p>
          <div className="flex flex-wrap gap-3">
            {feedings.slice(0, 4).map((feeding) => (
              <div
                key={feeding.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border/40 text-sm"
              >
                <CatAvatar
                  photoUrl={feeding.catPhotoUrl}
                  name={feeding.catName}
                  className="h-6 w-6"
                />
                <span className="font-medium text-foreground">{feeding.catName}</span>
                <span className="text-muted-foreground">
                  {format(new Date(feeding.fedAt), "h:mm a")}
                </span>
                {feeding.foodType && (
                  <span className="text-muted-foreground/60 text-xs">· {feeding.foodType}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
