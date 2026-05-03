import { useState } from "react";
import { Link, useParams } from "wouter";
import { 
  useGetCat, 
  getGetCatQueryKey,
  useListMedications,
  useCreateMedication,
  useUpdateMedication,
  useDeleteMedication,
  useMarkMedicationGiven,
  getListMedicationsQueryKey,
  getGetMedicationsDueQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, isBefore, isAfter, addHours } from "date-fns";
import { ChevronLeft, Plus, Edit, Trash2, Pill, Check, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function CatMedications() {
  const params = useParams();
  const catId = parseInt(params.id || "0", 10);
  
  const { data: cat, isLoading: isLoadingCat } = useGetCat(catId, { 
    query: { enabled: !!catId, queryKey: getGetCatQueryKey(catId) } 
  });
  
  const { data: medications, isLoading: isLoadingMeds } = useListMedications(catId, {
    query: { enabled: !!catId, queryKey: getListMedicationsQueryKey(catId) }
  });

  const [isAddOpen, setIsAddOpen] = useState(false);

  if (isLoadingCat || isLoadingMeds) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!cat) return <div>Cat not found</div>;

  const activeMeds = medications?.filter(m => m.isActive) || [];
  const inactiveMeds = medications?.filter(m => !m.isActive) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/cats/${cat.id}`}>
            <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Profile
            </Button>
          </Link>
          <h1 className="text-3xl font-serif font-medium text-foreground">{cat.name}'s Medications</h1>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Medication</DialogTitle>
            </DialogHeader>
            <MedicationForm catId={catId} onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {activeMeds.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-medium text-foreground flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" /> Active Treatments
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {activeMeds.map(med => (
              <MedicationCard key={med.id} med={med} catId={catId} />
            ))}
          </div>
        </div>
      ) : (
        <Card className="bg-card/50 border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Pill className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">No active medications</p>
            <p className="text-muted-foreground">Keep track of prescriptions, doses, and schedules here.</p>
          </CardContent>
        </Card>
      )}

      {inactiveMeds.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-border/50">
          <h2 className="text-lg font-medium text-muted-foreground">Past Medications</h2>
          <div className="grid grid-cols-1 gap-3 opacity-75">
            {inactiveMeds.map(med => (
              <MedicationCard key={med.id} med={med} catId={catId} isPast />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MedicationCard({ med, catId, isPast = false }: { med: any, catId: number, isPast?: boolean }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const deleteMed = useDeleteMedication();
  const queryClient = useQueryClient();
  const now = new Date();
  const nextDose = new Date(med.nextDoseAt);
  const isOverdue = !isPast && isBefore(nextDose, now);
  const isSoon = !isPast && isAfter(nextDose, now) && isBefore(nextDose, addHours(now, 2));

  const handleDelete = () => {
    deleteMed.mutate({ id: med.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMedicationsQueryKey(catId) });
        queryClient.invalidateQueries({ queryKey: getGetMedicationsDueQueryKey() });
      }
    });
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      isPast ? "bg-muted/30" : "bg-card hover:shadow-md border-border/50"
    )}>
      <CardContent className="p-0 flex flex-col sm:flex-row">
        <div className={cn(
          "p-4 sm:p-6 flex-1 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-border/50",
          isOverdue ? "bg-destructive/5" : ""
        )}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-serif font-medium text-foreground">{med.name}</h3>
              <Badge variant="outline" className={cn(
                "font-medium", 
                isPast ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary border-primary/20"
              )}>
                {med.dose}
              </Badge>
            </div>
            <div className="flex items-center gap-1 sm:hidden">
              <EditButton med={med} catId={catId} />
              <DeleteButton med={med} onDelete={handleDelete} isDeleting={deleteMed.isPending} />
            </div>
          </div>
          
          <p className="text-muted-foreground text-sm mb-4">{med.frequencyLabel}</p>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground/80 block text-xs uppercase tracking-wider mb-0.5">Started</span>
              <span className="font-medium">{format(new Date(med.startDate), "MMM d, yyyy")}</span>
            </div>
            <div>
              <span className="text-muted-foreground/80 block text-xs uppercase tracking-wider mb-0.5">Ends</span>
              <span className="font-medium">{med.endDate ? format(new Date(med.endDate), "MMM d, yyyy") : "Ongoing"}</span>
            </div>
          </div>
          
          {med.notes && (
            <div className="mt-4 pt-3 border-t border-border/50 text-sm text-muted-foreground italic">
              {med.notes}
            </div>
          )}
        </div>

        <div className={cn(
          "p-4 sm:p-6 sm:w-64 flex flex-col justify-center bg-card/30",
          isOverdue ? "bg-destructive/5" : ""
        )}>
          <div className="hidden sm:flex justify-end gap-1 mb-auto -mt-2 -mr-2">
             <EditButton med={med} catId={catId} />
             <DeleteButton med={med} onDelete={handleDelete} isDeleting={deleteMed.isPending} />
          </div>

          {!isPast && (
            <div className="mt-auto pt-4 sm:pt-0">
              <div className="mb-3">
                <span className="text-xs uppercase tracking-wider font-semibold flex items-center gap-1 mb-1 text-muted-foreground">
                  <Clock className="w-3 h-3" /> Next Dose
                </span>
                <div className={cn(
                  "font-medium text-lg",
                  isOverdue ? "text-destructive" : isSoon ? "text-primary" : "text-foreground"
                )}>
                  {format(nextDose, "MMM d, h:mm a")}
                </div>
                {isOverdue && (
                  <div className="text-xs text-destructive font-medium mt-0.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Overdue
                  </div>
                )}
              </div>
              <MarkGivenButton med={med} catId={catId} />
            </div>
          )}
          {isPast && (
            <div className="mt-auto text-center text-sm font-medium text-muted-foreground py-4">
              Completed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EditButton({ med, catId }: { med: any, catId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit {med.name}</DialogTitle>
        </DialogHeader>
        <MedicationForm catId={catId} initialData={med} onSuccess={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function DeleteButton({ med, onDelete, isDeleting }: { med: any, onDelete: () => void, isDeleting: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {med.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will remove the medication from {med.catName}'s records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MarkGivenButton({ med, catId }: { med: any, catId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nextDoseAt, setNextDoseAt] = useState("");
  const queryClient = useQueryClient();
  const markGiven = useMarkMedicationGiven();

  const handleOpen = () => {
    const tmrw = addHours(new Date(), 24);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${tmrw.getFullYear()}-${pad(tmrw.getMonth()+1)}-${pad(tmrw.getDate())}T${pad(tmrw.getHours())}:${pad(tmrw.getMinutes())}`;
    setNextDoseAt(formatted);
    setIsOpen(true);
  };

  const handleSave = () => {
    markGiven.mutate({
      data: {
        id: med.id,
        nextDoseAt: new Date(nextDoseAt).toISOString()
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMedicationsQueryKey(catId) });
        queryClient.invalidateQueries({ queryKey: getGetMedicationsDueQueryKey() });
        setIsOpen(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" onClick={handleOpen}>
          <Check className="w-4 h-4 mr-2" /> Mark as Given
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mark Dose Given</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nextDoseAt">When is the next dose due?</Label>
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

function MedicationForm({ catId, initialData, onSuccess }: { catId: number, initialData?: any, onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createMed = useCreateMedication();
  const updateMed = useUpdateMedication();
  
  const isEditing = !!initialData;
  const isPending = createMed.isPending || updateMed.isPending;

  const [name, setName] = useState(initialData?.name || "");
  const [dose, setDose] = useState(initialData?.dose || "");
  const [frequencyLabel, setFrequencyLabel] = useState(initialData?.frequencyLabel || "");
  const [startDate, setStartDate] = useState(initialData ? format(new Date(initialData.startDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(initialData?.endDate ? format(new Date(initialData.endDate), "yyyy-MM-dd") : "");
  
  // For datetime-local we need YYYY-MM-DDTHH:mm format
  const getDefaultNextDose = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getInitialNextDose = () => {
    if (!initialData?.nextDoseAt) return getDefaultNextDose();
    const d = new Date(initialData.nextDoseAt);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [nextDoseAt, setNextDoseAt] = useState(getInitialNextDose());
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      catId,
      name,
      dose,
      frequencyLabel,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
      nextDoseAt: new Date(nextDoseAt).toISOString(),
      notes: notes || null,
      isActive
    };

    if (isEditing) {
      updateMed.mutate(
        { id: initialData.id, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListMedicationsQueryKey(catId) });
            queryClient.invalidateQueries({ queryKey: getGetMedicationsDueQueryKey() });
            onSuccess();
          }
        }
      );
    } else {
      createMed.mutate(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListMedicationsQueryKey(catId) });
            queryClient.invalidateQueries({ queryKey: getGetMedicationsDueQueryKey() });
            onSuccess();
          }
        }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="name">Medication Name *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Felimazole" required />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dose">Dose</Label>
          <Input id="dose" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 2.5mg" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Input id="frequency" value={frequencyLabel} onChange={(e) => setFrequencyLabel(e.target.value)} placeholder="e.g. Twice daily" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date (optional)</Label>
          <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextDoseAt">Next Dose At *</Label>
        <Input id="nextDoseAt" type="datetime-local" value={nextDoseAt} onChange={(e) => setNextDoseAt(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="With food, on empty stomach, etc." className="resize-none" />
      </div>

      <div className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
        <div className="space-y-0.5">
          <Label className="text-base">Active Medication</Label>
          <p className="text-sm text-muted-foreground">Turn off if treatment is completed</p>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending || !name || !startDate || !nextDoseAt}>
          {isPending ? "Saving..." : "Save Medication"}
        </Button>
      </div>
    </form>
  );
}
