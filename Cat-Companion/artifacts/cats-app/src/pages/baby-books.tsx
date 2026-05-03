import { useState } from "react";
import { Link } from "wouter";
import { 
  useListCats, 
  useCreateMilestone,
  getListMilestonesQueryKey,
  getGetRecentMilestonesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, BookHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";

export default function BabyBooks() {
  const { data: cats, isLoading } = useListCats();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      </div>
    );
  }

  if (!cats || cats.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-serif font-medium text-foreground tracking-tight">Baby Books</h1>
          <p className="text-muted-foreground mt-2 text-lg">Memories, quirks, and special moments.</p>
        </div>
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-card/50">
          <BookHeart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">No baby books yet</h3>
          <p className="text-muted-foreground mb-6">Add your first cat to start their baby book.</p>
          <Link href="/cats">
            <Button>Go to My Cats</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-serif font-medium text-foreground tracking-tight">Baby Books</h1>
        <p className="text-muted-foreground mt-2 text-lg">Memories, quirks, and special moments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cats.map(cat => (
          <CatBabyBookCard key={cat.id} cat={cat} />
        ))}
      </div>
    </div>
  );
}

function CatBabyBookCard({ cat }: { cat: any }) {
  const [isMilestoneAddOpen, setIsMilestoneAddOpen] = useState(false);

  return (
    <Card className="hover-elevate transition-all overflow-hidden bg-card/50">
      <CardHeader className="text-center pb-2 pt-8">
        <div className="flex justify-center mb-4">
          <CatAvatar photoUrl={cat.photoUrl} name={cat.name} className="w-24 h-24 text-2xl border-4 border-background shadow-sm" />
        </div>
        <CardTitle className="text-2xl font-serif">{cat.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{cat.breed || "Beautiful Cat"}</p>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex justify-center">
          <Link href={`/cats/${cat.id}/baby-book`}>
            <Button variant="secondary" className="w-full bg-primary/10 text-primary hover:bg-primary/20">
              <BookHeart className="w-4 h-4 mr-2" />
              View Baby Book
            </Button>
          </Link>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 border-t border-border/50 py-3 flex justify-center">
        <Dialog open={isMilestoneAddOpen} onOpenChange={setIsMilestoneAddOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Plus className="w-4 h-4 mr-1" />
              Quick Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Milestone for {cat.name}</DialogTitle>
            </DialogHeader>
            <QuickAddMilestoneForm catId={cat.id} onSuccess={() => setIsMilestoneAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

function QuickAddMilestoneForm({ catId, onSuccess }: { catId: number, onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createMilestone = useCreateMilestone();
  
  const [title, setTitle] = useState("");
  const [ageDescription, setAgeDescription] = useState("");
  const [capturedAt, setCapturedAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMilestone.mutate(
      {
        data: {
          catId,
          title,
          ageDescription: ageDescription || null,
          capturedAt: new Date(capturedAt).toISOString(),
          notes: notes || null,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMilestonesQueryKey(catId) });
          queryClient.invalidateQueries({ queryKey: getGetRecentMilestonesQueryKey() });
          onSuccess();
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input 
          id="title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="e.g. First time using the litter box" 
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ageDescription">Age Description</Label>
        <Input 
          id="ageDescription" 
          value={ageDescription} 
          onChange={(e) => setAgeDescription(e.target.value)} 
          placeholder="e.g. 10 weeks" 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="capturedAt">Date *</Label>
        <Input 
          id="capturedAt" 
          type="date"
          value={capturedAt} 
          onChange={(e) => setCapturedAt(e.target.value)} 
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea 
          id="notes" 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          placeholder="Jot down a quick memory..."
          className="resize-none"
        />
      </div>
      <div className="pt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMilestone.isPending || !title || !capturedAt}>
          {createMilestone.isPending ? "Saving..." : "Add Milestone"}
        </Button>
      </div>
    </form>
  );
}
