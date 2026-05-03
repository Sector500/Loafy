import { useState, useRef, useCallback } from "react";
import { Link, useParams } from "wouter";
import {
  useGetCat,
  useUpdateCat,
  getGetCatQueryKey,
  useListMilestones,
  useCreateMilestone,
  useDeleteMilestone,
  getListMilestonesQueryKey,
  useListAlbum,
  useCreateAlbumEntry,
  useDeleteAlbumEntry,
  getListAlbumQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ChevronLeft, Edit, Trash2, Heart, MousePointer2, Utensils,
  Camera, Plus, Image as ImageIcon, Upload, X, Star, Trophy,
  Music, MapPin, User, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────────── */

interface TraitScores {
  playfulness: number;
  cuddliness: number;
  chattiness: number;
  mischief: number;
  bravery: number;
}

interface Award {
  id: string;
  title: string;
  reason: string;
}

const DEFAULT_TRAITS: TraitScores = {
  playfulness: 3,
  cuddliness: 3,
  chattiness: 3,
  mischief: 3,
  bravery: 3,
};

const PRESET_AWARDS = [
  "World's Best Napper",
  "Most Dramatic",
  "Biscuit-Making Champion",
  "Chief Chaos Officer",
  "Professional Box Inspector",
  "Head of Security",
  "Most Vocal Complainer",
  "Snack Supervisor",
  "Certified Lap Warmer",
  "Champion Zoomie Runner",
];

/* ─── Star sign helper ───────────────────────────────────────── */

function getStarSign(birthdate: string): { sign: string; dates: string; blurb: string; symbol: string } {
  const d = new Date(birthdate);
  const month = d.getMonth() + 1;
  const day = d.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19))
    return { sign: "Aries", dates: "Mar 21 – Apr 19", symbol: "♈", blurb: "Bold, energetic, and always first to the food bowl. An Aries cat charges headfirst into everything — including your ankles at 3am." };
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20))
    return { sign: "Taurus", dates: "Apr 20 – May 20", symbol: "♉", blurb: "Luxury-loving and deeply attached to their favourite blanket. A Taurus cat will not move. Not for anything. Don't even try." };
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20))
    return { sign: "Gemini", dates: "May 21 – Jun 20", symbol: "♊", blurb: "Curious, chatty, and full of surprises. One minute purring angel, next minute gremlin. A Gemini cat contains multitudes." };
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22))
    return { sign: "Cancer", dates: "Jun 21 – Jul 22", symbol: "♋", blurb: "Deeply devoted and a little clingy — in the best way. A Cancer cat has claimed one human as theirs and will not share." };
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22))
    return { sign: "Leo", dates: "Jul 23 – Aug 22", symbol: "♌", blurb: "The star of every room they walk into. A Leo cat demands admiration and frankly deserves it. The sun revolves around them." };
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22))
    return { sign: "Virgo", dates: "Aug 23 – Sep 22", symbol: "♍", blurb: "Meticulous, observant, and deeply offended by a dirty litter tray. A Virgo cat has standards and isn't afraid to show it." };
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22))
    return { sign: "Libra", dates: "Sep 23 – Oct 22", symbol: "♎", blurb: "Charming, social, and deeply indecisive about which lap to choose. A Libra cat brings harmony — when they feel like it." };
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21))
    return { sign: "Scorpio", dates: "Oct 23 – Nov 21", symbol: "♏", blurb: "Intense, mysterious, and watching your every move. A Scorpio cat knows all your secrets and is deciding what to do with them." };
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21))
    return { sign: "Sagittarius", dates: "Nov 22 – Dec 21", symbol: "♐", blurb: "Adventurous, philosophical, and forever bolting for the door. A Sagittarius cat is always on a quest — usually for forbidden snacks." };
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19))
    return { sign: "Capricorn", dates: "Dec 22 – Jan 19", symbol: "♑", blurb: "Disciplined and goal-oriented. The goal is currently the top of the fridge. A Capricorn cat has ambitions and the patience to see them through." };
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18))
    return { sign: "Aquarius", dates: "Jan 20 – Feb 18", symbol: "♒", blurb: "Eccentric, independent, and deeply unimpressed by your attempts to understand them. An Aquarius cat walks to the beat of their own paw." };
  return { sign: "Pisces", dates: "Feb 19 – Mar 20", symbol: "♓", blurb: "Dreamy, sensitive, and perpetually gazing into the middle distance at something you definitely cannot see. A Pisces cat lives between worlds." };
}

/* ─── Photo helper ───────────────────────────────────────────── */

function photoSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("/objects/")) return `/api/storage${url}`;
  return url;
}

const tapeRotations = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-2", "rotate-0"];

/* ─── Main page ──────────────────────────────────────────────── */

export default function BabyBook() {
  const params = useParams();
  const catId = parseInt(params.id || "0", 10);

  const { data: cat, isLoading: isLoadingCat } = useGetCat(catId, {
    query: { enabled: !!catId, queryKey: getGetCatQueryKey(catId) },
  });
  const { data: milestones, isLoading: isLoadingMilestones } = useListMilestones(catId, {
    query: { enabled: !!catId, queryKey: getListMilestonesQueryKey(catId) },
  });
  const { data: albumEntries, isLoading: isLoadingAlbum } = useListAlbum(catId, {
    query: { enabled: !!catId, queryKey: getListAlbumQueryKey(catId) },
  });

  const [isPersonalityEditOpen, setIsPersonalityEditOpen] = useState(false);
  const [isFavouritesEditOpen, setIsFavouritesEditOpen] = useState(false);
  const [isTraitsEditOpen, setIsTraitsEditOpen] = useState(false);
  const [isAwardsEditOpen, setIsAwardsEditOpen] = useState(false);
  const [isMilestoneAddOpen, setIsMilestoneAddOpen] = useState(false);
  const [isPhotoAddOpen, setIsPhotoAddOpen] = useState(false);

  if (isLoadingCat) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!cat) return <div>Cat not found</div>;

  const traitScores: TraitScores = cat.traitScores
    ? { ...DEFAULT_TRAITS, ...JSON.parse(cat.traitScores) }
    : DEFAULT_TRAITS;

  const awards: Award[] = cat.awards ? JSON.parse(cat.awards) : [];

  const starSign = cat.birthdate ? getStarSign(cat.birthdate) : null;

  const sortedEntries = albumEntries
    ? [...albumEntries].sort((a: any, b: any) => new Date(b.capturedAt ?? b.date).getTime() - new Date(a.capturedAt ?? a.date).getTime())
    : [];

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/cats/${cat.id}`}>
          <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Profile
          </Button>
        </Link>
        <h1 className="text-3xl font-serif font-medium text-foreground">
          {cat.name}'s Baby Book
        </h1>
      </div>

      {/* ── Star sign ─────────────────────────────────────────── */}
      {starSign && (
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-violet-50/60 to-amber-50/40 p-6 relative overflow-hidden">
          <div className="absolute top-3 right-4 text-6xl opacity-10 select-none font-serif">
            {starSign.symbol}
          </div>
          <div className="flex items-start gap-5">
            <div className="shrink-0 w-14 h-14 rounded-full bg-white/80 border border-border/40 flex items-center justify-center text-3xl shadow-sm">
              {starSign.symbol}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                Star sign · {starSign.dates}
              </p>
              <h2 className="text-2xl font-serif text-foreground">{starSign.sign}</h2>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-lg">
                {starSign.blurb}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Favourite things board ────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif text-foreground">Favourite Things</h2>
          <Dialog open={isFavouritesEditOpen} onOpenChange={setIsFavouritesEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Favourite Things</DialogTitle>
              </DialogHeader>
              <EditFavouritesForm cat={cat} onSuccess={() => setIsFavouritesEditOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { icon: <MousePointer2 className="w-4 h-4" />, label: "Toy", value: cat.favouriteToy, color: "bg-amber-50 border-amber-200 text-amber-700" },
            { icon: <Utensils className="w-4 h-4" />, label: "Food", value: cat.favouriteFood, color: "bg-green-50 border-green-200 text-green-700" },
            { icon: <MapPin className="w-4 h-4" />, label: "Spot", value: cat.favouriteSpot, color: "bg-blue-50 border-blue-200 text-blue-700" },
            { icon: <Music className="w-4 h-4" />, label: "Sound", value: cat.favouriteSound, color: "bg-violet-50 border-violet-200 text-violet-700" },
            { icon: <User className="w-4 h-4" />, label: "Human", value: cat.favouriteHuman, color: "bg-rose-50 border-rose-200 text-rose-700" },
            { icon: <Heart className="w-4 h-4" />, label: "Activity", value: cat.personalityTraits?.split(",")[0]?.trim() || null, color: "bg-primary/5 border-primary/20 text-primary" },
          ].map(({ icon, label, value, color }) => (
            <div
              key={label}
              className={cn(
                "rounded-xl border px-4 py-3 flex items-start gap-3",
                value ? color : "bg-muted/30 border-border/40"
              )}
            >
              <span className={cn("shrink-0 mt-0.5", value ? "" : "text-muted-foreground/40")}>{icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest opacity-60 mb-0.5">{label}</p>
                {value
                  ? <p className="font-medium text-sm leading-snug">{value}</p>
                  : <p className="text-xs text-muted-foreground italic">Not set</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Personality trait bars ────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif text-foreground">Personality Profile</h2>
          <Dialog open={isTraitsEditOpen} onOpenChange={setIsTraitsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Personality Profile</DialogTitle>
              </DialogHeader>
              <EditTraitsForm cat={cat} traitScores={traitScores} onSuccess={() => setIsTraitsEditOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
          {(
            [
              { key: "playfulness", label: "Playfulness", low: "Dignified", high: "Chaotic", color: "bg-amber-400" },
              { key: "cuddliness", label: "Cuddliness", low: "Independent", high: "Velcro cat", color: "bg-rose-400" },
              { key: "chattiness", label: "Chattiness", low: "Silent", high: "Never stops", color: "bg-violet-400" },
              { key: "mischief", label: "Mischief", low: "Angel", high: "Gremlin", color: "bg-orange-400" },
              { key: "bravery", label: "Bravery", low: "Cautious", high: "Fearless", color: "bg-blue-400" },
            ] as const
          ).map(({ key, label, low, high, color }) => {
            const score = traitScores[key];
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground">
                    {score <= 1 ? low : score >= 5 ? high : `${score}/5`}
                  </span>
                </div>
                <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", color)}
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                  {/* Pip markers */}
                  <div className="absolute inset-0 flex items-center">
                    {[1, 2, 3, 4].map((pip) => (
                      <div
                        key={pip}
                        className="w-px h-2 bg-white/50"
                        style={{ marginLeft: `${pip * 20}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground/60">
                  <span>{low}</span>
                  <span>{high}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Silly awards ──────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif text-foreground">Awards & Honours</h2>
          <Dialog open={isAwardsEditOpen} onOpenChange={setIsAwardsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add award
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Give an Award</DialogTitle>
              </DialogHeader>
              <AddAwardForm cat={cat} awards={awards} onSuccess={() => setIsAwardsEditOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        {awards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {awards.map((award) => (
              <AwardCard key={award.id} award={award} cat={cat} awards={awards} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 py-10 text-center cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setIsAwardsEditOpen(true)}
          >
            <Trophy className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No awards yet — every cat deserves recognition.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tap to bestow your first honour.</p>
          </div>
        )}
      </div>

      {/* ── Legacy personality quirks ─────────────────────────── */}
      {cat.personalityTraits && cat.personalityTraits.split(",").filter(Boolean).length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif text-foreground">Quirks & Traits</h2>
            <Dialog open={isPersonalityEditOpen} onOpenChange={setIsPersonalityEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">Edit Quirks</DialogTitle>
                </DialogHeader>
                <EditPersonalityForm cat={cat} onSuccess={() => setIsPersonalityEditOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-wrap gap-2">
            {cat.personalityTraits.split(",").map((t: string) => t.trim()).filter(Boolean).map((trait: string, i: number) => (
              <Badge key={i} variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-normal text-sm">
                {trait}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* ── Milestones ────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-2xl font-serif text-foreground">Milestones</h2>
          <Dialog open={isMilestoneAddOpen} onOpenChange={setIsMilestoneAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Add a Milestone</DialogTitle>
              </DialogHeader>
              <AddMilestoneForm catId={catId} onSuccess={() => setIsMilestoneAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {isLoadingMilestones ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !milestones || milestones.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
            <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">No milestones yet</h3>
            <p className="text-muted-foreground mb-4">Capture your first special moment.</p>
            <Button variant="outline" onClick={() => setIsMilestoneAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Milestone
            </Button>
          </div>
        ) : (
          <div className="relative border-l-2 border-primary/20 ml-4 md:ml-6 pl-6 space-y-8 py-4">
            {[...milestones]
              .sort((a: any, b: any) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
              .map((milestone: any) => (
                <MilestoneCard key={milestone.id} milestone={milestone} catId={catId} />
              ))}
          </div>
        )}
      </div>

      {/* ── Photo Album ───────────────────────────────────────── */}
      <div className="space-y-6 pt-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-2xl font-serif text-foreground flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
            Photo Album
          </h2>
          <Dialog open={isPhotoAddOpen} onOpenChange={setIsPhotoAddOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Plus className="w-4 h-4 mr-2" />
                Add Photo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Add a Photo Memory</DialogTitle>
              </DialogHeader>
              <AddPhotoForm catId={catId} onSuccess={() => setIsPhotoAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {isLoadingAlbum ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          </div>
        ) : sortedEntries.length === 0 ? (
          <div
            className="aspect-[4/3] max-w-sm mx-auto bg-amber-50 border-2 border-dashed border-amber-200 rounded-xl flex flex-col items-center justify-center text-center p-8 cursor-pointer hover:bg-amber-100/50 transition-colors"
            onClick={() => setIsPhotoAddOpen(true)}
          >
            <Camera className="w-10 h-10 text-amber-300 mb-3" />
            <p className="font-serif italic text-amber-700">Your first photo will live here.</p>
            <p className="text-xs text-amber-500 mt-2">Tap to add one</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
            {sortedEntries.map((entry: any, i: number) => (
              <ScrapbookPhoto key={entry.id} entry={entry} catId={catId} rotation={tapeRotations[i % tapeRotations.length]} />
            ))}
            <div
              className="aspect-[4/3] bg-amber-50/60 border-2 border-dashed border-amber-200/70 rounded-lg flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-amber-100/40 transition-colors"
              onClick={() => setIsPhotoAddOpen(true)}
            >
              <Camera className="w-8 h-8 text-amber-300 mb-2" />
              <p className="font-serif italic text-amber-600 text-sm">Add another memory</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Award card ─────────────────────────────────────────────── */

const AWARD_COLORS = [
  "bg-amber-50 border-amber-200",
  "bg-rose-50 border-rose-200",
  "bg-violet-50 border-violet-200",
  "bg-blue-50 border-blue-200",
  "bg-green-50 border-green-200",
  "bg-orange-50 border-orange-200",
];

function AwardCard({ award, cat, awards }: { award: Award; cat: any; awards: Award[] }) {
  const queryClient = useQueryClient();
  const updateCat = useUpdateCat();
  const colorClass = AWARD_COLORS[awards.indexOf(award) % AWARD_COLORS.length];

  function handleDelete() {
    const next = awards.filter((a) => a.id !== award.id);
    updateCat.mutate(
      { id: cat.id, data: { awards: JSON.stringify(next) } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCatQueryKey(cat.id) }) }
    );
  }

  return (
    <div className={cn("rounded-xl border p-4 flex items-start gap-3 group relative", colorClass)}>
      <div className="shrink-0 w-10 h-10 rounded-full bg-white/70 flex items-center justify-center shadow-sm">
        <Trophy className="w-5 h-5 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm leading-tight">{award.title}</p>
        {award.reason && (
          <p className="text-xs text-muted-foreground mt-0.5 italic">{award.reason}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
        onClick={handleDelete}
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

/* ─── Edit favourites form ───────────────────────────────────── */

function EditFavouritesForm({ cat, onSuccess }: { cat: any; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const updateCat = useUpdateCat();
  const [toy, setToy] = useState(cat.favouriteToy ?? "");
  const [food, setFood] = useState(cat.favouriteFood ?? "");
  const [spot, setSpot] = useState(cat.favouriteSpot ?? "");
  const [sound, setSound] = useState(cat.favouriteSound ?? "");
  const [human, setHuman] = useState(cat.favouriteHuman ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateCat.mutate(
      {
        id: cat.id,
        data: {
          favouriteToy: toy || null,
          favouriteFood: food || null,
          favouriteSpot: spot || null,
          favouriteSound: sound || null,
          favouriteHuman: human || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCatQueryKey(cat.id) });
          onSuccess();
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {[
        { id: "toy", label: "Favourite toy", placeholder: "A feather wand, crinkle ball...", value: toy, set: setToy },
        { id: "food", label: "Favourite food", placeholder: "Tuna pâté, dreamies...", value: food, set: setFood },
        { id: "spot", label: "Favourite spot", placeholder: "Top of the wardrobe, sunny windowsill...", value: spot, set: setSpot },
        { id: "sound", label: "Favourite sound", placeholder: "Rain on the window, the fridge opening...", value: sound, set: setSound },
        { id: "human", label: "Favourite human", placeholder: "The one who gives the treats...", value: human, set: setHuman },
      ].map(({ id, label, placeholder, value, set }) => (
        <div key={id} className="space-y-1.5">
          <Label htmlFor={id}>{label}</Label>
          <Input id={id} value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={updateCat.isPending}>Save</Button>
      </div>
    </form>
  );
}

/* ─── Edit trait scores form ─────────────────────────────────── */

const TRAITS_META = [
  { key: "playfulness", label: "Playfulness", low: "Dignified", high: "Chaotic" },
  { key: "cuddliness", label: "Cuddliness", low: "Independent", high: "Velcro cat" },
  { key: "chattiness", label: "Chattiness", low: "Silent", high: "Never stops" },
  { key: "mischief", label: "Mischief", low: "Angel", high: "Gremlin" },
  { key: "bravery", label: "Bravery", low: "Cautious", high: "Fearless" },
] as const;

function EditTraitsForm({ cat, traitScores, onSuccess }: { cat: any; traitScores: TraitScores; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const updateCat = useUpdateCat();
  const [scores, setScores] = useState<TraitScores>({ ...traitScores });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateCat.mutate(
      { id: cat.id, data: { traitScores: JSON.stringify(scores) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCatQueryKey(cat.id) });
          onSuccess();
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
      {TRAITS_META.map(({ key, label, low, high }) => (
        <div key={key} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{label}</Label>
            <span className="text-xs text-muted-foreground">{scores[key]}/5</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 text-right shrink-0">{low}</span>
            <div className="flex gap-1.5 flex-1 justify-center">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setScores((s) => ({ ...s, [key]: v }))}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all text-sm font-medium",
                    scores[key] >= v
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground w-20 shrink-0">{high}</span>
          </div>
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={updateCat.isPending}>Save</Button>
      </div>
    </form>
  );
}

/* ─── Add award form ─────────────────────────────────────────── */

function AddAwardForm({ cat, awards, onSuccess }: { cat: any; awards: Award[]; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const updateCat = useUpdateCat();
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");

  function handleSave() {
    if (!title.trim()) return;
    const newAward: Award = { id: Date.now().toString(), title: title.trim(), reason: reason.trim() };
    const next = [...awards, newAward];
    updateCat.mutate(
      { id: cat.id, data: { awards: JSON.stringify(next) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCatQueryKey(cat.id) });
          onSuccess();
        },
      }
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label>Award title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Type your own or pick one below..."
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESET_AWARDS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setTitle(p)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full border transition-colors",
              title === p
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/40 border-border/60 hover:border-primary/40 text-muted-foreground"
            )}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label>Reason (optional)</Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="For extraordinary napping between 2pm and 6pm daily..."
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button onClick={handleSave} disabled={!title.trim() || updateCat.isPending}>
          <Trophy className="w-4 h-4 mr-1.5" />
          Bestow award
        </Button>
      </div>
    </div>
  );
}

/* ─── Edit personality form (legacy traits) ──────────────────── */

function EditPersonalityForm({ cat, onSuccess }: { cat: any; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const updateCat = useUpdateCat();
  const [traits, setTraits] = useState(cat.personalityTraits ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateCat.mutate(
      { id: cat.id, data: { personalityTraits: traits || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCatQueryKey(cat.id) });
          onSuccess();
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="traits">Traits (comma-separated)</Label>
        <Textarea
          id="traits"
          value={traits}
          onChange={(e) => setTraits(e.target.value)}
          placeholder="Curious, vocal, very dramatic, biscuit enthusiast..."
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={updateCat.isPending}>Save</Button>
      </div>
    </form>
  );
}

/* ─── Scrapbook photo ────────────────────────────────────────── */

function ScrapbookPhoto({ entry, catId, rotation }: { entry: any; catId: number; rotation: string }) {
  const queryClient = useQueryClient();
  const deleteAlbumEntry = useDeleteAlbumEntry();

  const handleDelete = () => {
    if (confirm("Remove this photo?")) {
      deleteAlbumEntry.mutate(
        { id: entry.id },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAlbumQueryKey(catId) }) }
      );
    }
  };

  const src = photoSrc(entry.photoUrl);

  return (
    <div className={cn("group relative", rotation)}>
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 bg-amber-100 opacity-70 rounded-sm z-10 shadow-sm rotate-1" />
      <div className="bg-white shadow-md rounded-sm p-3 pb-6 border border-amber-100">
        <div className="aspect-[4/3] bg-amber-50/50 overflow-hidden rounded-sm relative">
          {src ? (
            <img src={src} alt={entry.caption || "Photo memory"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-amber-300">
              <Camera className="w-8 h-8 mb-2" />
              <span className="text-xs">No image</span>
            </div>
          )}
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
            onClick={handleDelete}
            disabled={deleteAlbumEntry.isPending}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="mt-3 min-h-[2.5rem] px-1">
          {entry.caption && (
            <p className="font-serif italic text-foreground/80 text-sm leading-relaxed text-center">
              {entry.caption}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest text-center mt-1">
            {format(new Date(entry.capturedAt ?? entry.date), "MMMM d, yyyy")}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Add photo form ─────────────────────────────────────────── */

function AddPhotoForm({ catId, onSuccess }: { catId: number; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createAlbumEntry = useCreateAlbumEntry();
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [caption, setCaption] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let objectPath: string | null = null;
      if (selectedFile) {
        const urlRes = await fetch("/api/storage/uploads/request-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: selectedFile.name, size: selectedFile.size, contentType: selectedFile.type }),
        });
        if (!urlRes.ok) throw new Error("Failed to get upload URL");
        const { uploadURL, objectPath: path } = await urlRes.json();
        const uploadRes = await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": selectedFile.type }, body: selectedFile });
        if (!uploadRes.ok) throw new Error("Upload failed");
        objectPath = path;
      }
      createAlbumEntry.mutate(
        { data: { catId, photoUrl: objectPath ?? null, caption: caption || null, date: new Date(date).toISOString() } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAlbumQueryKey(catId) });
            toast({ title: "Photo memory saved" });
            onSuccess();
          },
          onError: () => toast({ title: "Something went wrong", variant: "destructive" }),
        }
      );
    } catch {
      toast({ title: "Upload failed. Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
      <div className="space-y-1.5">
        <Label>Photo</Label>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {preview ? (
          <div className="relative group rounded-lg overflow-hidden bg-amber-50 border border-amber-200">
            <img src={preview} alt="Preview" className="w-full aspect-[4/3] object-cover" />
            <button type="button" onClick={clearFile} className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 shadow-sm transition-colors">
              <X className="w-4 h-4 text-foreground/70" />
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 bg-white/80 hover:bg-white rounded-full px-2.5 py-1 text-xs text-foreground/70 shadow-sm transition-colors flex items-center gap-1">
              <Upload className="w-3 h-3" />
              Change
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "aspect-[4/3] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
              isDragging ? "border-primary/60 bg-primary/5" : "border-amber-200 bg-amber-50/60 hover:bg-amber-50 hover:border-amber-300"
            )}
          >
            <div className="p-3 rounded-full bg-amber-100">
              <Camera className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground/70">Tap to choose a photo</p>
              <p className="text-xs text-muted-foreground mt-0.5">or drag and drop it here</p>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="caption">Caption</Label>
        <Textarea id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="A moment worth remembering..." className="resize-none font-serif italic text-base" rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="photoDate">Date</Label>
        <Input id="photoDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onSuccess} disabled={isUploading}>Cancel</Button>
        <Button type="submit" disabled={isUploading || createAlbumEntry.isPending || !date}>
          {isUploading ? "Uploading..." : "Save Memory"}
        </Button>
      </div>
    </form>
  );
}

/* ─── Milestone card ─────────────────────────────────────────── */

function MilestoneCard({ milestone, catId }: { milestone: any; catId: number }) {
  const queryClient = useQueryClient();
  const deleteMilestone = useDeleteMilestone();

  const handleDelete = () => {
    if (confirm("Delete this milestone?")) {
      deleteMilestone.mutate(
        { id: milestone.id },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListMilestonesQueryKey(catId) }) }
      );
    }
  };

  const src = photoSrc(milestone.photoUrl);

  return (
    <div className="relative">
      <div className="absolute w-4 h-4 bg-primary rounded-full -left-[33px] top-5 border-4 border-background" />
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl font-serif text-foreground">{milestone.title}</CardTitle>
              {milestone.ageDescription && (
                <Badge variant="outline" className="bg-secondary/10 text-secondary-foreground border-secondary/20">
                  {milestone.ageDescription}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(milestone.capturedAt), "MMMM d, yyyy")}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive h-8 w-8" onClick={handleDelete} disabled={deleteMilestone.isPending}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        {(milestone.notes || src) && (
          <CardContent className="pt-0 space-y-4">
            {src && (
              <div className="rounded-lg overflow-hidden border border-border/50 aspect-video">
                <img src={src} alt={milestone.title} className="w-full h-full object-cover" />
              </div>
            )}
            {milestone.notes && (
              <p className="text-muted-foreground text-sm leading-relaxed italic border-l-2 border-primary/30 pl-4">{milestone.notes}</p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

/* ─── Add milestone form ─────────────────────────────────────── */

function AddMilestoneForm({ catId, onSuccess }: { catId: number; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createMilestone = useCreateMilestone();
  const [title, setTitle] = useState("");
  const [ageDescription, setAgeDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [capturedAt, setCapturedAt] = useState(format(new Date(), "yyyy-MM-dd"));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMilestone.mutate(
      { catId, data: { title, ageDescription: ageDescription || null, notes: notes || null, capturedAt: new Date(capturedAt).toISOString() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMilestonesQueryKey(catId) });
          onSuccess();
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="First time on the balcony..." required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="capturedAt">Date</Label>
          <Input id="capturedAt" type="date" value={capturedAt} onChange={(e) => setCapturedAt(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="age">Age / stage</Label>
          <Input id="age" value={ageDescription} onChange={(e) => setAgeDescription(e.target.value)} placeholder="3 months old" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What happened, how they reacted..." rows={3} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={createMilestone.isPending || !title}>
          {createMilestone.isPending ? "Saving..." : "Save Milestone"}
        </Button>
      </div>
    </form>
  );
}
