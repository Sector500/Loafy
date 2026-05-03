import { useParams, Link } from "wouter";
import {
  useGetCat,
  useListVetAppointments,
  useListMedications,
  useListWeightLogs,
  useListHealthRecords,
  useListVetContacts,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Printer, Syringe, Pill, Scale, Calendar, Phone } from "lucide-react";
import { format, isBefore } from "date-fns";
import { cn } from "@/lib/utils";

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3 print:break-inside-avoid">
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="font-semibold text-foreground text-sm uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-muted-foreground w-36 shrink-0">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

export default function CatVetSummary() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);

  const { data: cat, isLoading: loadingCat } = useGetCat(id, { query: { enabled: !!id } });
  const { data: appointments } = useListVetAppointments(id, { query: { enabled: !!id } });
  const { data: medications } = useListMedications(id, { query: { enabled: !!id } });
  const { data: weightLogs } = useListWeightLogs(id, { query: { enabled: !!id } });
  const { data: healthRecords } = useListHealthRecords(id, { query: { enabled: !!id } });
  const { data: vetContacts } = useListVetContacts();

  const today = new Date();
  const printDate = format(today, "MMMM d, yyyy");

  const sortedWeights = [...(weightLogs ?? [])].sort(
    (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
  );
  const latestWeight = sortedWeights[0];

  const activeMeds = medications?.filter((m) => m.isActive) ?? [];
  const pastMeds = medications?.filter((m) => !m.isActive) ?? [];

  const pastAppts = [...(appointments ?? [])]
    .filter((a) => a.completed === "true" || isBefore(new Date(a.date), today))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const sortedRecords = [...(healthRecords ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (loadingCat) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Toolbar — hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/cats/${id}`}>
          <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to {cat?.name || "Cat Profile"}
          </Button>
        </Link>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" />
          Print summary
        </Button>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-6 print:border-0 print:p-0 print:shadow-none">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Vet Visit Summary
            </p>
            <h1 className="text-3xl font-serif text-foreground">{cat?.name}</h1>
            {cat?.breed && <p className="text-muted-foreground text-sm mt-0.5">{cat.breed}</p>}
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Prepared {printDate}</p>
            {cat?.birthdate && (
              <p className="mt-0.5">
                Born {format(new Date(cat.birthdate), "MMMM d, yyyy")}
              </p>
            )}
            {latestWeight && (
              <p className="mt-0.5 font-semibold text-foreground">
                {latestWeight.weightKg} kg
              </p>
            )}
          </div>
        </div>

        {/* Profile */}
        {(cat?.breed || cat?.birthdate || cat?.notes) && (
          <Section title="Profile" icon={<span className="text-base">Cat</span>}>
            <div className="space-y-1.5">
              <Row label="Breed" value={cat.breed} />
              <Row label="Born" value={cat.birthdate ? format(new Date(cat.birthdate), "MMMM d, yyyy") : null} />
              <Row
                label="Current weight"
                value={latestWeight
                  ? `${latestWeight.weightKg} kg (logged ${format(new Date(latestWeight.loggedAt), "MMM d, yyyy")})`
                  : null}
              />
              {cat.notes && (
                <p className="text-sm text-muted-foreground italic mt-1 border-l-2 border-border/60 pl-3">
                  {cat.notes}
                </p>
              )}
            </div>
          </Section>
        )}

        {/* Active medications */}
        {activeMeds.length > 0 && (
          <Section title="Current Medications" icon={<Pill className="w-4 h-4" />}>
            <div className="space-y-2">
              {activeMeds.map((m) => (
                <div key={m.id} className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-sm text-foreground">{m.name}</span>
                    {m.dose && <span className="text-xs text-muted-foreground">{m.dose}</span>}
                  </div>
                  {m.frequencyLabel && (
                    <p className="text-xs text-muted-foreground mt-0.5">{m.frequencyLabel}</p>
                  )}
                  {m.notes && (
                    <p className="text-xs text-muted-foreground/70 italic mt-1">{m.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Health records */}
        {sortedRecords.length > 0 && (
          <Section title="Health Records" icon={<Syringe className="w-4 h-4" />}>
            <div className="space-y-2">
              {sortedRecords.map((r) => {
                const isOverdue = r.nextDueDate && isBefore(new Date(r.nextDueDate), today);
                return (
                  <div key={r.id} className="flex items-start gap-3 text-sm">
                    <div className="w-28 shrink-0 text-muted-foreground text-xs mt-0.5">
                      {format(new Date(r.date), "MMM d, yyyy")}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-foreground">{r.name}</span>
                      <span className="text-muted-foreground ml-1.5">({r.type})</span>
                      {r.administeredBy && (
                        <span className="text-muted-foreground ml-1.5">· {r.administeredBy}</span>
                      )}
                      {r.nextDueDate && (
                        <p className={cn(
                          "text-xs mt-0.5",
                          isOverdue ? "text-rose-600 font-medium" : "text-muted-foreground"
                        )}>
                          {isOverdue ? "Overdue — " : "Next due: "}
                          {format(new Date(r.nextDueDate), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Recent appointments */}
        {pastAppts.length > 0 && (
          <Section title="Recent Appointments" icon={<Calendar className="w-4 h-4" />}>
            <div className="space-y-2">
              {pastAppts.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <div className="w-28 shrink-0 text-muted-foreground text-xs mt-0.5">
                    {format(new Date(a.date), "MMM d, yyyy")}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{a.type}</span>
                    {a.vetName && (
                      <span className="text-muted-foreground ml-1.5">with {a.vetName}</span>
                    )}
                    {a.notes && (
                      <p className="text-xs text-muted-foreground/70 italic mt-0.5">{a.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Weight history */}
        {sortedWeights.length > 0 && (
          <Section title="Weight History" icon={<Scale className="w-4 h-4" />}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {sortedWeights.slice(0, 9).map((w) => (
                <div key={w.id} className="text-sm border border-border/40 rounded-lg px-3 py-2 bg-muted/10">
                  <span className="font-medium text-foreground">{w.weightKg} kg</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {format(new Date(w.loggedAt), "MMM d, yyyy")}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Past medications */}
        {pastMeds.length > 0 && (
          <Section title="Previous Medications" icon={<Pill className="w-4 h-4" />}>
            <div className="space-y-1">
              {pastMeds.map((m) => (
                <div key={m.id} className="flex items-baseline gap-2 text-sm">
                  <span className="text-foreground">{m.name}</span>
                  {m.dose && <span className="text-muted-foreground text-xs">· {m.dose}</span>}
                  <span className="text-muted-foreground text-xs">
                    · started {format(new Date(m.startDate), "MMM d, yyyy")}
                    {m.endDate ? `, ended ${format(new Date(m.endDate), "MMM d, yyyy")}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Vet contacts */}
        {vetContacts && vetContacts.length > 0 && (
          <Section title="Vet Contacts" icon={<Phone className="w-4 h-4" />}>
            <div className="space-y-2">
              {vetContacts.map((c) => (
                <div key={c.id} className="flex items-start gap-3 text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{c.clinicName}</span>
                    {c.isEmergency && (
                      <span className="ml-2 text-xs text-rose-600 font-medium">Emergency</span>
                    )}
                    {c.vetName && <span className="text-muted-foreground ml-1.5">· {c.vetName}</span>}
                    {c.phone && <span className="text-muted-foreground ml-1.5">· {c.phone}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Print footer */}
        <div className="hidden print:block border-t border-border/40 pt-4 text-xs text-muted-foreground">
          Generated by Loafing · {printDate}
        </div>
      </div>
    </div>
  );
}
