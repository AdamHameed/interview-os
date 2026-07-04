"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandMenu, type CommandIndexItem } from "@/components/command-menu";

const SECTION_TITLES: [string, string][] = [
  ["/dashboard", "Dashboard"],
  ["/paths", "Learning Paths"],
  ["/modules", "Modules"],
  ["/lessons", "Lessons"],
  ["/problems", "Problems"],
  ["/practice", "Practice"],
  ["/interviews", "Mock Interviews"],
  ["/ai-usage", "AI Usage"],
  ["/resources", "Resources"],
  ["/admin/problems", "New Problem"],
  ["/admin/import", "Import"],
];

export function TopBar({ problems }: { problems: CommandIndexItem[] }) {
  const pathname = usePathname();
  const title =
    SECTION_TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Interview OS";

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 !h-4" />
      <h1 className="text-sm font-medium">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <CommandMenu problems={problems} />
        <ThemeToggle />
      </div>
    </header>
  );
}
