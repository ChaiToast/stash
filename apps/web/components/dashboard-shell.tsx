import Link from "next/link";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Your Library" },
  { href: "/sync", label: "Sync" },
  { href: "/dashboard/search", label: "Search" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/export", label: "Export" },
  { href: "/dashboard/collections", label: "Collections" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function DashboardNav({ active }: { active?: string }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active === link.href
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function DashboardShell({
  title,
  subtitle,
  active,
  children,
}: {
  title: string;
  subtitle?: string;
  active?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link href="/dashboard" className="text-sm text-primary">
                STASH
              </Link>
              <h1 className="mt-1 text-2xl font-bold">{title}</h1>
              {subtitle ? (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <DashboardNav active={active} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
