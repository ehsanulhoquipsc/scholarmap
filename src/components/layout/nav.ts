import {
  BookOpen,
  CalendarDays,
  FileText,
  Building2,
  Columns3,
  Compass,
  Flag,
  GraduationCap,
  LayoutGrid,
  ListChecks,
  NotebookPen,
  Settings,
} from "lucide-react";

export const NAV = [
  {
    group: "Discover",
    items: [
      { href: "/", label: "Overview", icon: LayoutGrid },
      { href: "/explore", label: "Explore World", icon: Compass },
      { href: "/countries", label: "Countries", icon: Flag },
      { href: "/universities", label: "Universities", icon: Building2 },
      { href: "/programs", label: "Programs", icon: BookOpen },
      { href: "/scholarships", label: "Scholarships", icon: GraduationCap },
    ],
  },
  {
    group: "Organise",
    items: [
      { href: "/compare", label: "Compare", icon: Columns3 },
      { href: "/applications", label: "My Applications", icon: ListChecks },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/documents", label: "Documents", icon: FileText },
      { href: "/notes", label: "Research Notes", icon: NotebookPen },
    ],
  },
] as const;

export const SETTINGS_NAV = { href: "/settings", label: "Settings", icon: Settings } as const;

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
