"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Braces,
  FilePlus2,
  GraduationCap,
  LayoutDashboard,
  Library,
  ListChecks,
  Search,
  Swords,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { TypeBadge } from "@/components/badges";
import type { ProblemType } from "@/lib/enums";

export type CommandIndexItem = {
  slug: string;
  title: string;
  type: ProblemType;
};

const PAGES = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Learning Paths", href: "/paths", icon: GraduationCap },
  { title: "Problems", href: "/problems", icon: ListChecks },
  { title: "Practice", href: "/practice", icon: Timer },
  { title: "Mock Interviews", href: "/interviews", icon: Swords },
  { title: "AI Usage", href: "/ai-usage", icon: Bot },
  { title: "Resources", href: "/resources", icon: Library },
  { title: "New Problem", href: "/admin/problems/new", icon: FilePlus2 },
  { title: "Import JSON", href: "/admin/import", icon: Braces },
];

export function CommandMenu({ problems }: { problems: CommandIndexItem[] }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Button
        variant="outline"
        className="h-8 w-full max-w-64 justify-between gap-2 text-muted-foreground sm:w-64"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-2 text-xs">
          <Search className="size-3.5" />
          Search problems…
        </span>
        <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search problems and pages…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {PAGES.map((page) => (
              <CommandItem key={page.href} onSelect={() => go(page.href)}>
                <page.icon className="size-4" />
                {page.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Problems">
            {problems.map((p) => (
              <CommandItem
                key={p.slug}
                value={`${p.title} ${p.slug}`}
                onSelect={() => go(`/problems/${p.slug}`)}
              >
                <span className="truncate">{p.title}</span>
                <span className="ml-auto">
                  <TypeBadge type={p.type} />
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
