import { useState } from "react";
import { Link } from "wouter";
import {
  useListVetContacts,
  useCreateVetContact,
  useUpdateVetContact,
  useDeleteVetContact,
  useGetUpcomingAppointments,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Phone, Mail, MapPin, Pencil, Trash2, Plus,
  Stethoscope, AlertCircle, Calendar,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, differenceInDays, isBefore } from "date-fns";
import { CatAvatar } from "@/components/cat-avatar";

interface ContactFormData {
  clinicName: string;
  vetName: string;
  phone: string;
  email: string;
  address: string;
  isEmergency: boolean;
  notes: string;
}

const emptyForm = (): ContactFormData => ({
  clinicName: "",
  vetName: "",
  phone: "",
  email: "",
  address: "",
  isEmergency: false,
  notes: "",
});

function appointmentWhen(dateStr: string, now: Date) {
  const d = new Date(dateStr);
  if (isToday(d)) return { label: "Today", urgent: true };
  if (isTomorrow(d)) return { label: "Tomorrow", urgent: true };
  const days = differenceInDays(d, now);
  if (days <= 7) return { label: `In ${days} days`, urgent: false };
  return { label: format(d, "MMM d"), urgent: false };
}

export default function Vets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: contacts, isLoading: isLoadingContacts } = useListVetContacts();
  const { data: allUpcoming, isLoading: isLoadingAppts } = useGetUpcomingAppointments();
  const createContact = useCreateVetContact();
  const updateContact = useUpdateVetContact();
  const deleteContact = useDeleteVetContact();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<ContactFormData>(emptyForm());

  const now = new Date();
  const upcoming = allUpcoming
    ?.filter((a) => !a.completed && !isBefore(new Date(a.date), now))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) ?? [];

  const emergency = contacts?.filter((c) => c.isEmergency) ?? [];
  const regular = contacts?.filter((c) => !c.isEmergency) ?? [];

  function openNew() {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(contact: NonNullable<typeof contacts>[number]) {
    setEditingId(contact.id);
    setForm({
      clinicName: contact.clinicName,
      vetName: contact.vetName ?? "",
      phone: contact.phone ?? "",
      email: contact.email ?? "",
      address: contact.address ?? "",
      isEmergency: contact.isEmergency,
      notes: contact.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.clinicName.trim()) return;
    const payload = {
      clinicName: form.clinicName,
      vetName: form.vetName || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      isEmergency: form.isEmergency,
      notes: form.notes || undefined,
    };
    try {
      if (editingId !== null) {
        await updateContact.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Contact updated" });
      } else {
        await createContact.mutateAsync({ data: payload });
        toast({ title: "Contact added" });
      }
      queryClient.invalidateQueries({ queryKey: ["/vet-contacts"] });
      setDialogOpen(false);
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    try {
      await deleteContact.mutateAsync({ id: deleteId });
      queryClient.invalidateQueries({ queryKey: ["/vet-contacts"] });
      toast({ title: "Contact removed" });
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
    setDeleteId(null);
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-2xl">
      <div>
        <h1 className="text-4xl font-serif text-foreground tracking-tight">Vets</h1>
        <p className="text-muted-foreground mt-1">Appointments, contacts and everything vet-related.</p>
      </div>

      {/* ── Upcoming appointments ─────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            Upcoming appointments
          </p>
        </div>

        {isLoadingAppts ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : upcoming.length > 0 ? (
          <div className="space-y-2">
            {upcoming.map((apt) => {
              const when = appointmentWhen(apt.date, now);
              return (
                <Link key={apt.id} href={`/cats/${apt.catId}/appointments`}>
                  <div className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl border cursor-pointer transition-colors hover:brightness-95",
                    when.urgent ? "bg-amber-50 border-amber-200" : "bg-card border-border/60"
                  )}>
                    <CatAvatar
                      photoUrl={apt.catPhotoUrl ?? null}
                      name={apt.catName}
                      className="h-9 w-9 shrink-0 ring-2 ring-background"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">
                        {apt.catName}
                        <span className="font-normal text-muted-foreground mx-1.5">·</span>
                        {apt.type}
                        {apt.vetName ? ` with ${apt.vetName}` : ""}
                      </p>
                      <p className={cn(
                        "text-xs mt-0.5",
                        when.urgent ? "text-amber-700 font-medium" : "text-muted-foreground"
                      )}>
                        {format(new Date(apt.date), "MMMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 font-normal text-xs",
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
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground text-sm">
            <Calendar className="w-4 h-4 shrink-0" />
            No upcoming appointments scheduled.
          </div>
        )}
      </section>

      {/* ── Contacts ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Stethoscope className="w-3.5 h-3.5" />
            Contacts
          </p>
          <Button onClick={openNew} size="sm" className="gap-1.5 h-8 text-xs">
            <Plus className="w-3.5 h-3.5" />
            Add contact
          </Button>
        </div>

        {isLoadingContacts ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
        ) : contacts && contacts.length > 0 ? (
          <div className="space-y-6">
            {emergency.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-rose-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" /> Emergency
                </p>
                {emergency.map((c) => (
                  <ContactCard key={c.id} contact={c} onEdit={() => openEdit(c)} onDelete={() => setDeleteId(c.id)} />
                ))}
              </div>
            )}
            {regular.length > 0 && (
              <div className="space-y-2">
                {emergency.length > 0 && (
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Stethoscope className="w-3 h-3" /> Vets & Clinics
                  </p>
                )}
                {regular.map((c) => (
                  <ContactCard key={c.id} contact={c} onEdit={() => openEdit(c)} onDelete={() => setDeleteId(c.id)} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-card/30">
            <Stethoscope className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground font-medium text-sm">No contacts yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1 mb-4">
              Add your vet's number so it's here when you need it.
            </p>
            <Button variant="outline" onClick={openNew} className="gap-2" size="sm">
              <Plus className="w-4 h-4" />
              Add first contact
            </Button>
          </div>
        )}
      </section>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingId !== null ? "Edit contact" : "Add a vet contact"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="clinicName">Clinic name <span className="text-destructive">*</span></Label>
              <Input
                id="clinicName"
                value={form.clinicName}
                onChange={(e) => setForm((f) => ({ ...f, clinicName: e.target.value }))}
                placeholder="City Vet Clinic"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vetName">Vet's name</Label>
              <Input
                id="vetName"
                value={form.vetName}
                onChange={(e) => setForm((f) => ({ ...f, vetName: e.target.value }))}
                placeholder="Dr. Sarah Chen"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+44 20 1234 5678"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="hello@cityvet.co.uk"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="12 Maple Street, London"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Out-of-hours line, parking info, Luna's notes..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="isEmergency"
                checked={form.isEmergency}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isEmergency: v }))}
              />
              <Label htmlFor="isEmergency" className="cursor-pointer">
                Emergency contact
                <span className="block text-xs text-muted-foreground font-normal">
                  Pinned at the top for quick access
                </span>
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.clinicName.trim() || createContact.isPending || updateContact.isPending}
            >
              {editingId !== null ? "Save changes" : "Add contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this contact?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ContactCard({
  contact,
  onEdit,
  onDelete,
}: {
  contact: {
    id: number;
    clinicName: string;
    vetName?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    isEmergency: boolean;
    notes?: string | null;
  };
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={cn(
      "rounded-xl border p-4 bg-card group transition-all hover:shadow-sm",
      contact.isEmergency ? "border-rose-200 bg-rose-50/30" : "border-border/60"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="font-semibold text-foreground text-base">{contact.clinicName}</h3>
            {contact.isEmergency && (
              <Badge className="bg-rose-100 text-rose-700 border-rose-200 font-normal text-xs px-1.5">
                Emergency
              </Badge>
            )}
          </div>
          {contact.vetName && (
            <p className="text-sm text-muted-foreground">{contact.vetName}</p>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            {contact.phone}
          </a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors truncate">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            {contact.email}
          </a>
        )}
        {contact.address && (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {contact.address}
          </p>
        )}
        {contact.notes && (
          <p className="text-xs text-muted-foreground/70 italic mt-2 pt-2 border-t border-border/40">
            {contact.notes}
          </p>
        )}
      </div>
    </div>
  );
}
