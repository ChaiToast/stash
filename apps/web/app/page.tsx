import Link from "next/link";
import { ArrowRight, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <span className="text-lg font-bold text-primary">STASH</span>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/login">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-16">
        <section className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Instagram saves → life OS
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Your saved posts are not bookmarks.
            <span className="block text-primary">
              They&apos;re unfinished intentions.
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            STASH turns your Instagram saves into a searchable library of
            recipes, workouts, books, travel ideas, and more — classified by AI
            and ready to act on.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button size="lg">
                Open Your Library
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noreferrer"
            >
              <Button size="lg" variant="secondary">
                <Chrome className="h-4 w-4" />
                Install STASH Extension
              </Button>
            </a>
          </div>
        </section>

        <section className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Sync your saves",
              body: "Install the Chrome extension, open Instagram Saved, and sync in one click.",
            },
            {
              title: "AI classification",
              body: "Every save gets a category, title, and structured data — recipes, workouts, books, and more.",
            },
            {
              title: "Your Library",
              body: "Search, mark done, track streaks, and export your curated life plans.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-card p-6"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
