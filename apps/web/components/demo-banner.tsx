import Link from "next/link";
import { isDemoMode, DEMO_PUBLIC_COLLECTION } from "@/lib/demo";

export function DemoBanner() {
  if (!isDemoMode) {
    return null;
  }

  return (
    <div className="border-b border-primary/30 bg-primary/10 px-4 py-3 text-center text-sm">
      <span className="font-semibold text-primary">Demo mode</span>
      <span className="text-muted-foreground">
        {" "}
        — pre-loaded library with 27 sample saves.{" "}
      </span>
      <Link
        href={`/u/${DEMO_PUBLIC_COLLECTION.username}/${DEMO_PUBLIC_COLLECTION.slug}`}
        className="font-semibold text-primary underline-offset-4 hover:underline"
      >
        View public collection
      </Link>
    </div>
  );
}
