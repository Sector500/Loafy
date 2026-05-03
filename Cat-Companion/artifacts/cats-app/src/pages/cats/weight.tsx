import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  useGetCat,
  useListWeightLogs,
  useLogWeight,
  useDeleteWeightLog,
  getListWeightLogsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Trash2, Scale, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

const chartConfig: ChartConfig = {
  weightKg: {
    label: "Weight (kg)",
    color: "hsl(var(--primary))",
  },
};

export default function CatWeight() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data: cat } = useGetCat(id, { query: { enabled: !!id } });
  const { data: weightLogs, isLoading } = useListWeightLogs(id, { query: { enabled: !!id } });
  const deleteWeightLog = useDeleteWeightLog();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const sortedLogs = [...(weightLogs ?? [])].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
  );

  const chartData = sortedLogs.map((l) => ({
    date: format(new Date(l.loggedAt), "MMM d"),
    weightKg: l.weightKg,
  }));

  const latestWeight = sortedLogs[sortedLogs.length - 1]?.weightKg ?? null;
  const prevWeight = sortedLogs[sortedLogs.length - 2]?.weightKg ?? null;
  const diff = latestWeight !== null && prevWeight !== null ? latestWeight - prevWeight : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Link href={`/cats/${id}`}>
          <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to {cat?.name || "Cat Profile"}
          </Button>
        </Link>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Log Weight
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Log weight for {cat?.name}</DialogTitle>
            </DialogHeader>
            <AddWeightForm catId={id} onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h1 className="text-4xl font-serif text-foreground tracking-tight">Weight Tracker</h1>
        <p className="text-muted-foreground mt-1">Monitor {cat?.name}'s weight changes over time.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-56 w-full rounded-xl" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : weightLogs && weightLogs.length > 0 ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/60 bg-card px-4 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Current</p>
              <p className="text-2xl font-serif font-medium text-foreground">
                {latestWeight?.toFixed(2)} <span className="text-sm font-sans text-muted-foreground">kg</span>
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card px-4 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Change</p>
              {diff !== null ? (
                <p className={cn(
                  "text-2xl font-serif font-medium",
                  diff > 0 ? "text-rose-500" : diff < 0 ? "text-primary" : "text-muted-foreground"
                )}>
                  {diff > 0 ? "+" : ""}{diff.toFixed(2)} <span className="text-sm font-sans">kg</span>
                </p>
              ) : (
                <p className="text-2xl font-serif font-medium text-muted-foreground">—</p>
              )}
            </div>
            <div className="rounded-xl border border-border/60 bg-card px-4 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Logs</p>
              <p className="text-2xl font-serif font-medium text-foreground">{weightLogs.length}</p>
            </div>
          </div>

          {/* Chart */}
          {sortedLogs.length >= 2 && (
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Weight over time</p>
              <ChartContainer config={chartConfig} className="h-52 w-full">
                <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 4, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => `${v}kg`}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(v) => [`${v} kg`, "Weight"]} />}
                  />
                  {latestWeight && (
                    <ReferenceLine
                      y={latestWeight}
                      stroke="hsl(var(--primary))"
                      strokeDasharray="4 4"
                      strokeOpacity={0.4}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="weightKg"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          )}

          {/* Log list */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">History</p>
            {[...sortedLogs].reverse().map((log, index, arr) => {
              const nextLog = arr[index + 1];
              const weightDiff = nextLog ? log.weightKg - nextLog.weightKg : 0;
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-4 rounded-xl border border-border/60 bg-card px-4 py-3 group transition-all hover:shadow-sm"
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    weightDiff > 0 ? "bg-rose-50 text-rose-500" :
                    weightDiff < 0 ? "bg-primary/10 text-primary" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {weightDiff > 0 ? <TrendingUp className="h-4 w-4" /> :
                     weightDiff < 0 ? <TrendingDown className="h-4 w-4" /> :
                     <Minus className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-serif font-medium text-foreground">
                        {log.weightKg} <span className="text-sm font-sans text-muted-foreground">kg</span>
                      </span>
                      {nextLog && (
                        <span className={cn(
                          "text-xs font-medium",
                          weightDiff > 0 ? "text-rose-500" :
                          weightDiff < 0 ? "text-primary" :
                          "text-muted-foreground"
                        )}>
                          {weightDiff > 0 ? "+" : ""}{weightDiff.toFixed(2)} kg
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(log.loggedAt), "MMMM d, yyyy")}
                    </p>
                    {log.notes && (
                      <p className="text-xs text-muted-foreground/70 italic mt-1 border-l-2 border-primary/20 pl-2">
                        {log.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={() => {
                      deleteWeightLog.mutate(
                        { id: log.id },
                        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListWeightLogsQueryKey(id) }) }
                      );
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-card/30">
          <Scale className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground font-medium">No weight logs yet.</p>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
            Start tracking {cat?.name}'s weight to see trends over time.
          </p>
          <Button variant="outline" onClick={() => setIsAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Log first weight
          </Button>
        </div>
      )}
    </div>
  );
}

function AddWeightForm({ catId, onSuccess }: { catId: number; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const logWeight = useLogWeight();

  const [loggedAt, setLoggedAt] = useState(() => new Date().toISOString().split("T")[0]);
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logWeight.mutate(
      { catId, data: { loggedAt: new Date(loggedAt).toISOString(), weightKg: parseFloat(weightKg), notes: notes || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWeightLogsQueryKey(catId) });
          onSuccess();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="loggedAt">Date</Label>
        <Input id="loggedAt" type="date" value={loggedAt} onChange={(e) => setLoggedAt(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="weightKg">Weight (kg)</Label>
        <Input
          id="weightKg"
          type="number"
          step="0.01"
          min="0"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          placeholder="4.20"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Before breakfast, after vet visit..."
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={logWeight.isPending || !weightKg}>
          {logWeight.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
