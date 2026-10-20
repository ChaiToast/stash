import type { PostCategory } from "@stash/types";
import {
  BookOpen,
  Dumbbell,
  Film,
  Heart,
  MapPin,
  Package,
  Palette,
  Sparkles,
  Tv,
  UtensilsCrossed,
} from "lucide-react";

export type CategoryMeta = {
  slug: string;
  label: string;
  vaultLabel: string;
  icon: typeof UtensilsCrossed;
  description: string;
};

export const CATEGORY_META: Record<PostCategory, CategoryMeta> = {
  RECIPE: {
    slug: "recipes",
    label: "Recipes",
    vaultLabel: "Your Recipe Vault",
    icon: UtensilsCrossed,
    description: "Meals worth making",
  },
  WORKOUT: {
    slug: "workouts",
    label: "Workouts",
    vaultLabel: "Your Training Stack",
    icon: Dumbbell,
    description: "Move your body",
  },
  BOOK: {
    slug: "books",
    label: "Books",
    vaultLabel: "Your Reading List",
    icon: BookOpen,
    description: "Stories to read",
  },
  MOVIE: {
    slug: "movies",
    label: "Movies",
    vaultLabel: "Your Watchlist",
    icon: Film,
    description: "Films to watch",
  },
  SHOW: {
    slug: "shows",
    label: "Shows",
    vaultLabel: "Your Series Queue",
    icon: Tv,
    description: "Series to binge",
  },
  LIFE_ADVICE: {
    slug: "life-advice",
    label: "Life Advice",
    vaultLabel: "Your Wisdom Shelf",
    icon: Heart,
    description: "Ideas to live by",
  },
  PRODUCT: {
    slug: "products",
    label: "Products",
    vaultLabel: "Your Product Radar",
    icon: Package,
    description: "Things to buy",
  },
  TRAVEL: {
    slug: "travel",
    label: "Travel",
    vaultLabel: "Your Trip Ideas",
    icon: MapPin,
    description: "Places to go",
  },
  AESTHETIC: {
    slug: "aesthetic",
    label: "Aesthetic",
    vaultLabel: "Your Mood Board",
    icon: Palette,
    description: "Style inspiration",
  },
  UNCATEGORIZED: {
    slug: "unsorted",
    label: "Unsorted",
    vaultLabel: "Your Unsorted Saves",
    icon: Sparkles,
    description: "Waiting to be sorted",
  },
};

export const DASHBOARD_CATEGORIES = (
  Object.keys(CATEGORY_META) as PostCategory[]
).filter((category) => category !== "UNCATEGORIZED");

export function categoryFromSlug(slug: string): PostCategory | null {
  const entry = Object.entries(CATEGORY_META).find(([, meta]) => meta.slug === slug);
  return (entry?.[0] as PostCategory) ?? null;
}

export function getCategoryMeta(category: PostCategory): CategoryMeta {
  return CATEGORY_META[category];
}
