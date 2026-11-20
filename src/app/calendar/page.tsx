"use client";

import Link from "next/link";
import { PeekLink } from "@/components/views/Peek";
import { useMemo, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button, Flag, IconButton, PageHeader, Segmented } from "@/components/ui/primitives";
import { DEADLINE_KINDS, type DeadlineEvent, type DeadlineKind, toCalendarEvent, useDeadlineEvents } from "@/lib/derived";
import { exportICS, slug } from "@/lib/export";
import { useStore } from "@/lib/store";
import { cn, daysUntil, formatDate, relativeDeadline } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dotFor = (k: DeadlineKind) => DEADLINE_KINDS.find((x) => x.kind === k)!.dot;

export default function CalendarPage() {
  const { toast } = useStore();
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [hidden, setHidden] = useState<Set<DeadlineKind>>(new Set());
  const today = iso(new Date());
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string>(today);

  const all = useDeadlineEvents(scope);
  const events = useMemo(() => all.filter((e) => !hidden.has(e.kind)), [all, hidden]);
  const byDate = useMemo(() => {
    const m: Record<string, DeadlineEvent[]> = {};
    events.forEach((e) => (m[e.date] ??= []).push(e));
    return m;
  }, [events]);

  // Monday-first grid covering the month
  const cells = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const count = Math.ceil((offset + daysInMonth) / 7) * 7;
    return Array.from({ length: count }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [month]);

  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const goToday = () => {
    const d = new Date();
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelected(today);
  };

  const dayEvents = byDate[selected] ?? [];
  const upcoming = events.filter((e) => e.date >= (selected > today ? selected : today) && e.date !== selected).slice(0, 12);
  const monthLabel = month.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const exportAll = () => {
    const future = events.filter((e) => daysUntil(e.date) >= 0);
    if (!future.length) return toast("No upcoming dates to export.");
    exportICS(`scholarmap-${scope === "mine" ? "my-deadlines" : "all-deadlines"}.ics`, future.map(toCalendarEvent));
    toast(`Exported ${future.length} dates — open the file to add them to your calendar`);
  };

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Every deadline and application window in one place. Export to Google Calendar, Outlook or Apple Calendar."
        actions={
          <>
            <Segmented
              value={scope}
              onChange={setScope}
              options={[
                { value: "mine", label: "My shortlist" },
                { value: "all", label: "Everything" },
              ]}
            />
            <Button onClick={exportAll}>
              <Download /> Export .ics
            </Button>
          </>
        }
      />

      {/* Legend doubles as a filter */}
      <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2">
        {DEADLINE_KINDS.map((k) => {
          const off = hidden.has(k.kind);
          return (
            <button
              key={k.kind}
              onClick={() =>
                setHidden((h) => {
                  const n = new Set(h);
                  if (off) n.delete(k.kind);
                  else n.add(k.kind);
                  return n;
                })
              }
              aria-pressed={!off}
              className={cn("flex items-center gap-2 text-[12.5px] transition-opacity", off ? "text-fg-faint opacity-60 line-through" : "text-fg-muted hover:text-fg")}
            >
              <span className={cn("size-2 rounded-full", k.dot)} /> {k.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        {/* Month grid */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="t-h2">{monthLabel}</h2>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={goToday}>
                Today
              </Button>
              <IconButton label="Previous month" onClick={() => shift(-1)}>
                <ChevronLeft />
              </IconButton>
              <IconButton label="Next month" onClick={() => shift(1)}>
                <ChevronRight />
              </IconButton>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="grid grid-cols-7 border-b border-line bg-subtle">
              {WEEKDAYS.map((d) => (
                <div key={d} className="px-2 py-2 text-[11.5px] text-fg-muted">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-line">
              {cells.map((d) => {
                const key = iso(d);
                const list = byDate[key] ?? [];
                const inMonth = d.getMonth() === month.getMonth();
                const isToday = key === today;
                const isSel = key === selected;
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className={cn(
                      "flex min-h-[64px] flex-col gap-1 p-1.5 text-left transition-colors sm:min-h-[104px]",
                      inMonth ? "bg-bg hover:bg-subtle" : "bg-subtle/60 text-fg-faint",
                      isSel && "!bg-accent-soft/60",
                    )}
                  >
                    <span
                      className={cn(
                        "tabular flex size-6 items-center justify-center rounded-full text-[12px]",
                        isToday && "bg-accent font-medium text-white",
                        !isToday && isSel && "font-medium text-accent",
                      )}
                    >
                      {d.getDate()}
                    </span>
                    {/* Phones: dots only */}
                    <span className="flex flex-wrap gap-0.5 px-1 sm:hidden">
                      {list.slice(0, 4).map((e) => (
                        <span key={e.id} className={cn("size-1.5 rounded-full", dotFor(e.kind))} />
                      ))}
                    </span>
                    <span className="hidden flex-col gap-0.5 sm:flex">
                      {list.slice(0, 3).map((e) => (
                        <span key={e.id} className="flex items-center gap-1.5 truncate rounded px-1 py-0.5 text-[11.5px] leading-tight text-fg">
                          <span className={cn("size-1.5 shrink-0 rounded-full", dotFor(e.kind))} />
                          <span className="truncate">{e.title}</span>
                        </span>
                      ))}
                      {list.length > 3 && <span className="px-1 text-[11px] text-fg-muted">+{list.length - 3} more</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Agenda */}
        <aside>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="t-h2">{selected === today ? "Today" : formatDate(selected)}</h2>
            {selected !== today && <span className="text-[12.5px] text-fg-muted">{relativeDeadline(selected).replace(" left", " away")}</span>}
          </div>
          {dayEvents.length === 0 ? (
            <p className="border-y border-line py-5 text-[13px] text-fg-muted">Nothing due this day.</p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {dayEvents.map((e) => (
                <AgendaItem key={e.id} e={e} />
              ))}
            </ul>
          )}

          <h3 className="t-eyebrow mb-2 mt-8">Coming up</h3>
          {upcoming.length === 0 ? (
            <p className="text-[13px] text-fg-muted">No later dates.</p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {upcoming.map((e) => (
                <AgendaItem key={e.id} e={e} showDate />
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

function AgendaItem({ e, showDate }: { e: DeadlineEvent; showDate?: boolean }) {
  const { toast } = useStore();
  const d = daysUntil(e.date);
  return (
    <li className="group flex items-start gap-3 py-3">
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", dotFor(e.kind))} />
      <EventLink e={e} className="min-w-0 flex-1">
        <span className="block text-[13px] leading-snug group-hover:text-accent">{e.title}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-fg-muted">
          {e.countryCode && <Flag code={e.countryCode} size={13} />}
          <span className="truncate">{showDate ? `${formatDate(e.date, { year: false })} · ${e.sub}` : e.sub}</span>
        </span>
        {showDate && e.kind !== "opens" && d >= 0 && d <= 14 && <span className="text-[11.5px] text-danger">{relativeDeadline(e.date)}</span>}
      </EventLink>
      <IconButton
        label="Add to calendar"
        className="size-7 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100"
        onClick={() => {
          exportICS(`${slug(e.title)}.ics`, [toCalendarEvent(e)]);
          toast("Calendar file downloaded");
        }}
      >
        <CalendarPlus />
      </IconButton>
    </li>
  );
}

/** Scholarship and program dates open in the side panel; applications go to the tracker. */
function EventLink({ e, className, children }: { e: DeadlineEvent; className?: string; children: React.ReactNode }) {
  const id = e.href.split("/").pop() ?? "";
  if (e.kind === "scholarship" || e.kind === "opens")
    return (
      <PeekLink kind="scholarship" id={id} className={className}>
        {children}
      </PeekLink>
    );
  if (e.kind === "program")
    return (
      <PeekLink kind="program" id={id} className={className}>
        {children}
      </PeekLink>
    );
  return (
    <Link href={e.kind === "application" ? `/applications?id=${e.id.replace(/^app-/, "")}` : e.href} className={className}>
      {children}
    </Link>
  );
}
