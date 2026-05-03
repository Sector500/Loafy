import { useState } from "react";
import { Link, useParams } from "wouter";
import { useGetCat, useDeleteCat, useUpdateCat, getGetCatQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Edit, Trash2, Utensils, Calendar, Scale, Cat, Heart, Pill, Syringe, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CatProfile() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data: cat, isLoading } = useGetCat(id, { query: { enabled: !!id } });
  const deleteCat = useDeleteCat();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-32" />
        <Card>
          <div className="h-64 bg-muted"></div>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <Skeleton className="h-4 w-1/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!cat) {
    return <div>Cat not found</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/cats">
          <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Cats
          </Button>
        </Link>
        <div className="flex gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit {cat.name}</DialogTitle>
              </DialogHeader>
              <EditCatForm cat={cat} onSuccess={() => setIsEditOpen(false)} />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {cat.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete {cat.name}'s profile and all associated records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    deleteCat.mutate({ id }, {
                      onSuccess: () => {
                        window.location.href = "/cats";
                      }
                    });
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="overflow-hidden">
            <div className="aspect-square relative bg-muted border-b border-border">
              {cat.photoUrl ? (
                <img src={cat.photoUrl} alt={cat.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/50">
                  <Cat className="h-24 w-24 opacity-50" />
                </div>
              )}
            </div>
            <CardContent className="p-6">
              <h1 className="text-3xl font-serif font-medium text-foreground mb-2">{cat.name}</h1>
              <div className="space-y-2 text-sm text-muted-foreground">
                {cat.breed && <div className="flex justify-between"><span>Breed</span><span className="font-medium text-foreground">{cat.breed}</span></div>}
                {cat.weightKg && <div className="flex justify-between"><span>Weight</span><span className="font-medium text-foreground">{cat.weightKg} kg</span></div>}
                {cat.birthdate && <div className="flex justify-between"><span>Birthdate</span><span className="font-medium text-foreground">{new Date(cat.birthdate).toLocaleDateString()}</span></div>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4">
          <Link href={`/cats/${cat.id}/feedings`}>
            <Card className="hover-elevate cursor-pointer transition-all">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <Utensils className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-serif">Feeding Log</CardTitle>
                  <p className="text-sm text-muted-foreground">Track meals, treats, and food preferences.</p>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href={`/cats/${cat.id}/appointments`}>
            <Card className="hover-elevate cursor-pointer transition-all">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-serif">Vet Appointments</CardTitle>
                  <p className="text-sm text-muted-foreground">Manage upcoming visits and vaccination history.</p>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href={`/cats/${cat.id}/weight`}>
            <Card className="hover-elevate cursor-pointer transition-all">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <Scale className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-serif">Weight Tracker</CardTitle>
                  <p className="text-sm text-muted-foreground">Monitor weight changes over time.</p>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href={`/cats/${cat.id}/baby-book`}>
            <Card className="hover-elevate cursor-pointer transition-all">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <Heart className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-serif">Baby Book</CardTitle>
                  <p className="text-sm text-muted-foreground">Scrapbook and personality quirks.</p>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href={`/cats/${cat.id}/medications`}>
            <Card className="hover-elevate cursor-pointer transition-all">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <Pill className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-serif">Medications</CardTitle>
                  <p className="text-sm text-muted-foreground">Active treatments and schedules.</p>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href={`/cats/${cat.id}/health-records`}>
            <Card className="hover-elevate cursor-pointer transition-all">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <Syringe className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-serif">Health Records</CardTitle>
                  <p className="text-sm text-muted-foreground">Vaccinations, treatments, and tests.</p>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href={`/cats/${cat.id}/vet-summary`}>
            <Card className="hover-elevate cursor-pointer transition-all">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-serif">Vet Visit Summary</CardTitle>
                  <p className="text-sm text-muted-foreground">Printable overview of all records.</p>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

function EditCatForm({ cat, onSuccess }: { cat: any, onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const updateCat = useUpdateCat();
  const [name, setName] = useState(cat.name);
  const [breed, setBreed] = useState(cat.breed || "");
  const [weightKg, setWeightKg] = useState(cat.weightKg?.toString() || "");
  const [photoUrl, setPhotoUrl] = useState(cat.photoUrl || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCat.mutate(
      {
        id: cat.id,
        data: {
          name,
          breed: breed || null,
          weightKg: weightKg ? parseFloat(weightKg) : null,
          photoUrl: photoUrl || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCatQueryKey(cat.id) });
          onSuccess();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
        <Button type="submit" disabled={updateCat.isPending || !name}>
          {updateCat.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
