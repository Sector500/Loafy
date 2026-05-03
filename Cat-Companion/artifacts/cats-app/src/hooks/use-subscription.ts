import { useUser } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

export interface UserPlan {
  id: string;
  subscriptionTier: "free" | "plus";
  isPlus: boolean;
  isPremium: boolean;
  limits: {
    cats: number | null;
    milestones: number | null;
    photos: number | null;
    weightHistoryDays: number | null;
  };
}

export function useSubscription() {
  const { isSignedIn, isLoaded } = useUser();

  const { data, isLoading } = useQuery<UserPlan>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: isLoaded && !!isSignedIn,
    staleTime: 1000 * 60 * 5,
  });

  return {
    isPlus: data?.isPlus ?? false,
    isPremium: data?.isPlus ?? false,
    subscriptionTier: data?.subscriptionTier ?? "free",
    limits: data?.limits ?? { cats: 1, milestones: 5, photos: 20, weightHistoryDays: 30 },
    isLoading: !isLoaded || isLoading,
  };
}
