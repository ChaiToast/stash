import type { UserPlan } from "@stash/types";

export type PlanLimits = {
  maxPosts: number | null;
  maxCategories: number | null;
  exports: boolean;
  collections: boolean;
  apiAccess: boolean;
  customCategories: boolean;
};

export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  free: {
    maxPosts: 300,
    maxCategories: 5,
    exports: false,
    collections: false,
    apiAccess: false,
    customCategories: false,
  },
  lifetime_solo: {
    maxPosts: null,
    maxCategories: null,
    exports: true,
    collections: true,
    apiAccess: false,
    customCategories: false,
  },
  pro: {
    maxPosts: null,
    maxCategories: null,
    exports: true,
    collections: true,
    apiAccess: true,
    customCategories: true,
  },
};

export const PLAN_PRICING = {
  lifetime_solo: { earlyBird: 19, standard: 39 },
  pro: { standard: 49 },
} as const;

export function getPlanLimits(plan: UserPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function canAccessCategory(
  plan: UserPlan,
  categoryIndex: number,
): boolean {
  const limits = getPlanLimits(plan);
  if (limits.maxCategories === null) return true;
  return categoryIndex < limits.maxCategories;
}

export function isAtPostLimit(plan: UserPlan, currentCount: number): boolean {
  const limits = getPlanLimits(plan);
  if (limits.maxPosts === null) return false;
  return currentCount >= limits.maxPosts;
}

export function planLabel(plan: UserPlan): string {
  switch (plan) {
    case "free":
      return "Free";
    case "lifetime_solo":
      return "Lifetime Solo";
    case "pro":
      return "Pro";
  }
}
