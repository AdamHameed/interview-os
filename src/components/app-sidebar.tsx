"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bot,
  Braces,
  FilePlus2,
  LayoutDashboard,
  Library,
  ListChecks,
  Swords,
  Terminal,
  Timer,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Train",
    items: [
      { title: "Problems", href: "/problems", icon: ListChecks },
      { title: "Practice", href: "/practice", icon: Timer },
      { title: "Mock Interviews", href: "/interviews", icon: Swords },
      { title: "AI Usage", href: "/ai-usage", icon: Bot },
    ],
  },
  {
    label: "Library",
    items: [{ title: "Resources", href: "/resources", icon: Library }],
  },
  {
    label: "Manage",
    items: [
      { title: "New Problem", href: "/admin/problems/new", icon: FilePlus2 },
      { title: "Import", href: "/admin/import", icon: Braces },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Terminal className="size-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">Interview OS</span>
            <span className="text-[10px] text-muted-foreground">
              serious technical prep
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={
                        pathname === item.href ||
                        pathname.startsWith(item.href + "/")
                      }
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 rounded-md border border-dashed px-2 py-1.5 text-[11px] text-muted-foreground">
          <BookOpen className="size-3.5 shrink-0" />
          <span>Local-first MVP. Your attempts stay on this machine.</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
