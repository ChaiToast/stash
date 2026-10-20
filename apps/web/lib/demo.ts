export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const DEMO_USER = {
  email: "demo@stash.app",
  password: "stashdemo123",
  username: "demo",
} as const;

export const DEMO_PUBLIC_COLLECTION = {
  username: "demo",
  slug: "weeknight-recipes",
} as const;
