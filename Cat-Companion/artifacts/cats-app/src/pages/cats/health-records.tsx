import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  useGetCat,
  useListHealthRecords,
  useCreateHealthRecord,
  useUpdateHealthRecord,
  useDeleteHealthRecord,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft, Plus, Pencil, Trash2, Syringe, Shield, FlaskConical, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format, isBefore } from "date-fns";
import { cn } from "@/lib/utils";

const RECORD_TYPES = ["Vaccination", "Treatment", "Test", "Surgery", "Other"] as const;
type RecordType = typeof RECORD_TYPES[number];

function typeIcon(type: string) {
  switch (type) {
    case "Vaccination": return <Syringe className="w-4 h-4" />;
    case "Treatment": return <Shield className="w-4 h-4" />;
    case "Test": return <FlaskConical className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
}

function typeColor(type: string) {
  switch (type) {
    case "Vaccination": return "bg-green-50 text-green-700 border-green-200";
    case "Treatment": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Test": return "bg-violet-50 text-violet-700 border-violet-200";
    case "Surgery": return "bg-rose-50 text-rose-700 border-rose-200";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

interface FormData {
  type: RecordType;
  name: string;
  date: string;
  nextDueDate: string;
  administeredBy: string;
  batchNumber: string;
  notes: string;
}

const emptyForm = (): FormData => ({
  type: "Vaccination",
  name: "",
  date: new Date().toISOString().split("T")[0],
  nextDueDate: "",
  administeredBy: "",
  batchNumber: "",
  notes: "",
});

export default function CatHealthRecords() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data: cat } = useGetCat(id, { query: { enabled: !!id } });
  const { data: records, isLoading } = useListHealthRecords(id, { query: { enabled: !!id } });
  const createRecord = useCreateHealthRecord();
  const updateRecord = useUpdateHealthRecord();
  const deleteRecord = useDeleteHealthRecord();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());

  const today = new Date();
  const sorted = [...(records ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const overdue = sorted.filter(
    (r) => r.nextDueDate && isBefore(new Date(r.nextDueDate), today)
  );
  const upToDate = sorted.filter(
    (r) => !r.nextDueDate || !isBefore(new Date(r.nextDueDate), today)
  );

  function openNew() {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(r: NonNullable<typeof records>[number]) {
    setEditingId(r.id);
    setForm({
      type: r.type as RecordType,
      name: r.name,
      date: r.date,
      nextDueDate: r.nextDueDate ?? "",
      administeredBy: r.administeredBy ?? "",
      batchNumber: r.batchNumber ?? "",
      notes: r.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.date) return;
    const payload = {
      type: form.type,
      name: form.name,
      date: form.date,
      nextDueDate: form.nextDueDate || null,
      administeredBy: form.administeredBy || null,
      batchNumber: form.batchNumber || null,
      notes: form.notes || null,
    };
    try {
      if (editingId !== null) {
        await updateRecord.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Record updated" });
      } else {
        await createRecord.mutateAsync({ catId: id, data: payload });
        toast({ title: "Record added" });
      }
      queryClient.invalidateQueries({ queryKey: ["/health-records"] });
      setDialogOpen(false);
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    try {
      await deleteRecord.mutateAsync({ id: deleteId });
      queryClient.invalidateQueries({ queryKey: ["/health-records"] });
      toast({ title: "Record removed" });
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
    setDeleteId(null);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Link href={`/cats/${id}`}>
          <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to {cat?.name || "Cat Profile"}
          </Button>
        </Link>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add record
        </Button>
      </div>

      <div>
        <h1 className="text-4xl font-serif text-foreground tracking-tight">Health Records</h1>
        <p className="text-muted-foreground mt-1">
          {cat?.name}'s vaccinations, treatments, and tests.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : records && records.length > 0 ? (
        <div className="space-y-8">
          {overdue.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-600">
                Due / Overdue
              </p>
              {overdue.map((r) => (
                <RecordCard key={r.id} record={r} onEdit={() => openEdit(r)} onDelete={() => setDeleteId(r.id)} today={today} />
              ))}
            </section>
          )}
          <section className="space-y-2">
            {overdue.length > 0 && (
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                All Records
              </p>
            )}
            {upToDate.map((r) => (
              <RecordCard key={r.id} record={r} onEdit={() => openEdit(r)} onDelete={() => setDeleteId(r.id)} today={today} />
            ))}
          </section>
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-card/30">
          <Syringe className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground font-medium">No health records yet.</p>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
            Log vaccinations, treatments, and tests to keep {cat?.name}'s history in one place.
          </p>
          <Button variant="outline" onClick={openNew} className="gap-2">
            <Plus className="w-4 h-4" />
            Add first record
          </Button>
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingId !== null ? "Edit record" : "Add health record"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v as RecordType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECORD_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date <span className="text-destructive">*</span></Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Rabies vaccine, Flea treatment, Blood panel..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nextDueDate">Next due date</Label>
              <Input
                id="nextDueDate"
                type="date"
                value={form.nextDueDate}
                onChange={(e) => setForm((f) => ({ ...f, nextDueDate: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="administeredBy">Administered by</Label>
                <Input
                  id="administeredBy"
                  value={form.administeredBy}
                  onChange={(e) => setForm((f) => ({ ...f, administeredBy: e.target.value }))}
                  placeholder="Dr. Chen"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="batchNumber">Batch / Lot no.</Label>
                <Input
                  id="batchNumber"
                  value={form.batchNumber}
                  onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))}
                  placeholder="ABC-12345"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any reactions, follow-up instructions..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.date || createRecord.isPending || updateRecord.isPending}
            >
              {editingId !== null ? "Save changes" : "Add record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this record?</AlertDialogTitle>
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

function RecordCard({
  record,
  onEdit,
  onDelete,
  today,
}: {
  record: {
    id: number;
    type: string;
    name: string;
    date: string;
    nextDueDate?: string | null;
    administeredBy?: string | null;
    batchNumber?: string | null;
    notes?: string | null;
  };
  onEdit: () => void;
  onDelete: () => void;
  today: Date;
}) {
  const isOverdue = record.nextDueDate && isBefore(new Date(record.nextDueDate), today);

  return (
    <div className={cn(
      "rounded-xl border bg-card px-4 py-3 group transition-all hover:shadow-sm",
      isOverdue ? "border-rose-200 bg-rose-50/20" : "border-border/60"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg shrink-0 border", typeColor(record.type))}>
          {typeIcon(record.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">{record.name}</span>
            <Badge variant="outline" className={cn("text-xs font-normal px-1.5", typeColor(record.type))}>
              {record.type}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(record.date), "MMMM d, yyyy")}
            {record.administeredBy ? ` · ${record.administeredBy}` : ""}
          </p>
          {record.nextDueDate && (
            <p className={cn(
              "text-xs mt-1 font-medium",
              isOverdue ? "text-rose-600" : "text-muted-foreground"
            )}>
              {isOverdue ? "Overdue — " : "Next due: "}
              {format(new Date(record.nextDueDate), "MMMM d, yyyy")}
            </p>
          )}
          {record.batchNumber && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">Batch: {record.batchNumber}</p>
          )}
          {record.notes && (
            <p className="text-xs text-muted-foreground/70 italic mt-1.5 border-l-2 border-border pl-2">
              {record.notes}
            </p>
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
    </div>
  );
}
