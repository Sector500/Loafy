import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  useGetCat,
  useListVetAppointments,
  useCreateVetAppointment,
  useUpdateVetAppointment,
  useDeleteVetAppointment,
  getListVetAppointmentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Trash2, Calendar, CheckCircle2, Circle, Clock } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, isBefore, isToday, isTomorrow, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

function appointmentWhen(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return { label: "Today", urgent: true };
  if (isTomorrow(d)) return { label: "Tomorrow", urgent: true };
  const days = differenceInDays(d, new Date());
  if (days <= 7) return { label: `In ${days} days`, urgent: false };
  return { label: format(d, "MMM d"), urgent: false };
}

export default function CatAppointments() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data: cat } = useGetCat(id, { query: { enabled: !!id } });
  const { data: appointments, isLoading } = useListVetAppointments(id, { query: { enabled: !!id } });
  const updateAppointment = useUpdateVetAppointment();
  const deleteAppointment = useDeleteVetAppointment();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const now = new Date();
  const upcoming = appointments?.filter(
    (a) => !a.completed && !isBefore(new Date(a.date), now)
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) ?? [];

  const nextAppointment = upcoming[0] ?? null;

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
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Appointment for {cat?.name}</DialogTitle>
            </DialogHeader>
            <AddAppointmentForm catId={id} onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h1 className="text-3xl font-serif text-primary tracking-tight flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary/80" />
          Vet Appointments
        </h1>
        <p className="text-muted-foreground mt-1">
          Medical visits and vaccinations for {cat?.name}.
        </p>
      </div>

      {/* Next appointment widget */}
      {!isLoading && nextAppointment && (() => {
        const when = appointmentWhen(nextAppointment.date);
        return (
          <div
            className={cn(
              "flex items-center gap-4 px-4 py-3 rounded-xl border",
              when.urgent
                ? "bg-amber-50 border-amber-200"
                : "bg-card border-border/60"
            )}
          >
            <div className={cn(
              "p-2 rounded-full shrink-0",
              when.urgent ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
            )}>
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-foreground">
                {nextAppointment.type}
                {nextAppointment.vetName ? ` with ${nextAppointment.vetName}` : ""}
              </span>
              <div className={cn(
                "text-sm mt-0.5",
                when.urgent ? "text-amber-700 font-medium" : "text-muted-foreground"
              )}>
                {when.label} · {format(new Date(nextAppointment.date), "h:mm a")}
              </div>
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
        );
      })()}

      {!isLoading && !nextAppointment && !isLoading && (
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground">
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-sm">No upcoming appointments.</span>
          <Button size="sm" variant="outline" onClick={() => setIsAddOpen(true)}>
            Book one
          </Button>
        </div>
      )}

      {/* Full appointment list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : appointments && appointments.length > 0 ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {appointments.map((apt) => (
            <Card
              key={apt.id}
              className={cn(
                "transition-colors group",
                apt.completed ? "opacity-60 bg-muted/50" : "hover:border-primary/50"
              )}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => {
                      updateAppointment.mutate(
                        { id: apt.id, data: { completed: !apt.completed } },
                        {
                          onSuccess: () => {
                            queryClient.invalidateQueries({
                              queryKey: getListVetAppointmentsQueryKey(id),
                            });
                          },
                        }
                      );
                    }}
                    className="mt-1 text-primary hover:text-primary/80 transition-colors"
                  >
                    {apt.completed ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Circle className="h-6 w-6" />
                    )}
                  </button>
                  <div className={apt.completed ? "line-through text-muted-foreground" : ""}>
                    <h3 className="font-medium text-foreground">
                      {apt.type} {apt.vetName ? `with ${apt.vetName}` : ""}
                    </h3>
                    <p
                      className={cn(
                        "text-sm",
                        apt.completed ? "text-muted-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {format(new Date(apt.date), "MMMM d, yyyy · h:mm a")}
                    </p>
                    {apt.notes && (
                      <p
                        className={cn(
                          "text-sm mt-2 italic border-l-2 pl-2",
                          apt.completed
                            ? "border-muted-foreground/20 text-muted-foreground/70"
                            : "border-primary/20 text-muted-foreground"
                        )}
                      >
                        {apt.notes}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    deleteAppointment.mutate(
                      { id: apt.id },
                      {
                        onSuccess: () => {
                          queryClient.invalidateQueries({
                            queryKey: getListVetAppointmentsQueryKey(id),
                          });
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

function AddAppointmentForm({ catId, onSuccess }: { catId: number; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createAppointment = useCreateVetAppointment();

  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
    return tomorrow.toISOString().slice(0, 16);
  });
  const [type, setType] = useState("checkup");
  const [vetName, setVetName] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAppointment.mutate(
      {
        catId,
        data: {
          date: new Date(date).toISOString(),
          type,
          vetName: vetName || null,
          notes: notes || null,
          completed: false,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVetAppointmentsQueryKey(catId) });
          onSuccess();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="date">Date & Time *</Label>
        <Input id="date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="checkup">Checkup</SelectItem>
            <SelectItem value="vaccination">Vaccination</SelectItem>
            <SelectItem value="surgery">Surgery</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="vetName">Vet / Clinic</Label>
        <Input id="vetName" value={vetName} onChange={(e) => setVetName(e.target.value)} placeholder="e.g. Dr. Smith" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for visit, questions to ask..." />
      </div>
      <div className="pt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={createAppointment.isPending}>
          {createAppointment.isPending ? "Scheduling..." : "Schedule"}
        </Button>
      </div>
    </form>
  );
}
