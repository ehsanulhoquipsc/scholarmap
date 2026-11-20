"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Bell, CalendarDays, Compass, LayoutGrid, ListChecks, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react";
import { PeekProvider } from "@/components/views/Peek";
import { NAV, SETTINGS_NAV, isActive } from "./nav";
import { GlobalSearch } from "./GlobalSearch";
import { Dropdown, IconButton, MenuItem, Toasts } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import { cn, formatDate, relativeDeadline, daysUntil } from "@/lib/utils";
import { useRouter } from "next/navigation";

function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 text-[15px] font-medium tracking-[-0.02em]">
      <span className="relative flex size-[22px] items-center justify-center rounded-full border-[1.5px] border-fg">
        <span className="absolute h-full w-[9px] rounded-[50%] border-[1.5px] border-fg" />
        <span className="absolute h-[1.5px] w-full bg-fg" />
        <span className="absolute right-[2px] top-[2px] size-[5px] rounded-full bg-accent" />
      </span>
      {!compact && (
        <span>
          Scholar<span className="text-fg-muted">Map</span>
        </span>
      )}
    </Link>
  );
}

function NavLinks({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { applications } = useStore();
  const activeApps = applications.filter((a) => !["Accepted", "Rejected"].includes(a.status)).length;

  const link = (item: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) => {
    const active = isActive(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group flex h-8 items-center gap-2.5 rounded-md text-[13.5px] transition-colors",
          collapsed ? "justify-center px-0" : "px-2.5",
          active ? "bg-muted text-fg" : "text-fg-muted hover:bg-muted/60 hover:text-fg",
        )}
      >
        <Icon className={cn("size-[16px] shrink-0", active ? "text-accent" : "text-fg-faint group-hover:text-fg-muted")} />
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!collapsed && item.href === "/applications" && activeApps > 0 && (
          <span className="tabular text-[11.5px] text-fg-faint">{activeApps}</span>
        )}
      </Link>
    );
  };

  return (
    <nav className="flex flex-1 flex-col">
      {NAV.map((g) => (
        <div key={g.group} className="mb-5">
          {!collapsed && <div className="t-eyebrow mb-1.5 px-2.5 !text-[10.5px] !text-fg-faint">{g.group}</div>}
          <div className="flex flex-col gap-0.5">{g.items.map(link)}</div>
        </div>
      ))}
      <div className="mt-auto flex flex-col gap-0.5">{link(SETTINGS_NAV)}</div>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { toasts, dismissToast, hydrated } = useStore();
  const pathname = usePathname();

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem("scholarmap:sidebar") === "collapsed");
    } catch {}
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("scholarmap:sidebar", c ? "expanded" : "collapsed");
      } catch {}
      return !c;
    });
  };

  const fullBleed = pathname === "/explore";

  return (
    <PeekProvider>
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-subtle/60 px-3 pb-4 pt-4 transition-[width] duration-200 lg:flex",
          collapsed ? "w-[60px]" : "w-[232px]",
        )}
      >
        <div className={cn("mb-7 flex h-8 items-center", collapsed ? "justify-center" : "justify-between pl-2.5")}>
          {!collapsed && <Logo />}
          <IconButton label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={toggleCollapsed} className="size-7">
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </IconButton>
        </div>
        <NavLinks collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="anim-fade absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <aside className="anim-fade absolute inset-y-0 left-0 flex w-[280px] flex-col bg-bg px-3 pb-5 pt-4 shadow-pop">
            <div className="mb-6 flex h-8 items-center justify-between pl-2.5">
              <Logo />
              <IconButton label="Close menu" onClick={() => setMobileOpen(false)}>
                <X />
              </IconButton>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onSearch={() => setSearchOpen(true)} />
        <main className={cn("flex-1 pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0", fullBleed ? "" : "px-4 pt-6 sm:px-8 sm:pt-10 lg:pb-20 xl:px-12")}>
          {/* Content waits for saved data (a few ms) so you never see sample data flash before yours */}
          <Suspense fallback={<PageSkeleton fullBleed={fullBleed} />}>
            <PageFrame fullBleed={fullBleed} ready={hydrated}>
              {children}
            </PageFrame>
          </Suspense>
        </main>
      </div>

      <MobileTabBar onMore={() => setMobileOpen(true)} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
    </PeekProvider>
  );
}

/** Re-mounts the page when the path or query changes (e.g. "View saved" → ?saved=1 on the same page). */
function PageFrame({ fullBleed, ready, children }: { fullBleed: boolean; ready: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams();
  return (
    <div key={pathname + "?" + search.toString()} className={cn(ready && "anim-fade", fullBleed ? "h-full" : "mx-auto max-w-[1180px] pb-16 lg:pb-0")}>
      {ready ? children : <PageSkeleton fullBleed={fullBleed} />}
    </div>
  );
}

/** Placeholder layout shown for the first frame, before saved data is read. */
function PageSkeleton({ fullBleed }: { fullBleed: boolean }) {
  if (fullBleed) return <div className="skeleton m-4 h-[calc(100%-32px)] rounded-xl opacity-60" />;
  return (
    <div aria-hidden className="opacity-70">
      <div className="skeleton h-8 w-72" />
      <div className="skeleton mt-3 h-4 w-96 max-w-full" />
      <div className="skeleton mt-8 aspect-[1000/600] w-full rounded-xl sm:aspect-[1000/520]" />
      <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i}>
            <div className="skeleton h-6 w-10" />
            <div className="skeleton mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/applications", label: "Applications", icon: ListChecks },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

/** Phone navigation: thumb-reachable tabs, everything else under More. */
function MobileTabBar({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  const inTabs = TABS.some((t) => isActive(pathname, t.href));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-bg/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      {TABS.map((t) => {
        const active = isActive(pathname, t.href);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[10.5px] transition-colors", active ? "text-accent" : "text-fg-muted")}
          >
            <Icon className="size-[21px]" strokeWidth={active ? 2.1 : 1.8} />
            {t.label}
          </Link>
        );
      })}
      <button onClick={onMore} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[10.5px]", !inTabs ? "text-accent" : "text-fg-muted")}>
        <MoreHorizontal className="size-[21px]" />
        More
      </button>
    </nav>
  );
}

function TopBar({ onSearch }: { onSearch: () => void }) {
  const { applications, scholarships, saved } = useStore();
  const router = useRouter();
  const [read, setRead] = useState(false);

  // Notifications: upcoming deadlines among tracked applications + saved scholarships
  const upcoming = [
    ...applications
      .filter((a) => !["Applied", "Under review", "Accepted", "Rejected"].includes(a.status))
      .map((a) => ({ id: a.id, title: a.title, deadline: a.deadline, href: "/applications" })),
    ...scholarships
      .filter((s) => saved.scholarships.includes(s.id))
      .map((s) => ({ id: s.id, title: s.name, deadline: s.deadline, href: `/scholarships/${s.id}` })),
  ]
    .filter((n) => daysUntil(n.deadline) >= 0 && daysUntil(n.deadline) <= 45)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .filter((n, i, arr) => arr.findIndex((x) => x.title === n.title) === i)
    .slice(0, 6);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur-md sm:px-6">
      <div className="lg:hidden">
        <Logo />
      </div>

      <button
        onClick={onSearch}
        className="ml-auto flex h-8 items-center gap-2 rounded-md border border-line bg-subtle px-2.5 text-[13px] text-fg-faint transition-colors hover:border-line-strong sm:w-[300px] lg:ml-0"
      >
        <Search className="size-[15px]" />
        <span className="hidden flex-1 truncate text-left sm:inline">Search everything…</span>
        <kbd className="hidden rounded border border-line bg-bg px-1.5 font-sans text-[10.5px] text-fg-muted md:inline">Ctrl K</kbd>
      </button>

      <div className="flex items-center gap-1 lg:ml-auto">
        <Dropdown
          width={340}
          trigger={({ toggle }) => (
            <IconButton
              label="Notifications"
              onClick={() => {
                toggle();
                setRead(true);
              }}
              className="relative"
            >
              <Bell />
              {!read && upcoming.length > 0 && <span className="absolute right-[7px] top-[7px] size-[7px] rounded-full border-[1.5px] border-bg bg-accent" />}
            </IconButton>
          )}
        >
          {(close) => (
            <div>
              <div className="flex items-center justify-between px-2.5 pb-1.5 pt-2">
                <span className="text-[13px] font-medium">Upcoming deadlines</span>
                <span className="text-[11.5px] text-fg-faint">Next 45 days</span>
              </div>
              {upcoming.length === 0 && <p className="px-2.5 py-6 text-center text-[13px] text-fg-muted">Nothing due soon.</p>}
              {upcoming.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    close();
                    router.push(n.href);
                  }}
                  className="flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-left hover:bg-muted"
                >
                  <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", daysUntil(n.deadline) <= 14 ? "bg-danger" : "bg-warning")} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">{n.title}</span>
                    <span className="text-[12px] text-fg-muted">
                      {formatDate(n.deadline)} · {relativeDeadline(n.deadline)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </Dropdown>

        <Dropdown
          width={220}
          trigger={({ toggle }) => (
            <button
              onClick={toggle}
              aria-label="Profile"
              className="ml-1 flex size-8 items-center justify-center rounded-full bg-fg text-[11px] font-medium tracking-wide text-bg transition-opacity hover:opacity-85"
            >
              YO
            </button>
          )}
        >
          {(close) => (
            <div>
              <div className="px-2.5 pb-2 pt-2">
                <div className="text-[13px] font-medium">You</div>
                <div className="text-[12px] text-fg-muted">Personal workspace</div>
              </div>
              <div className="my-1 h-px bg-line" />
              <MenuItem
                onClick={() => {
                  close();
                  router.push("/documents");
                }}
              >
                Documents
              </MenuItem>
              <MenuItem
                onClick={() => {
                  close();
                  router.push("/settings");
                }}
              >
                Settings
              </MenuItem>
            </div>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
