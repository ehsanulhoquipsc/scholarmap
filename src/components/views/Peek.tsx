"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, CalendarPlus, Check, Columns3, Maximize2, Plus } from "lucide-react";
import { Badge, Button, Flag, KeyValue, Modal, SaveToggle, StatusDot } from "@/components/ui/primitives";
import { Provenance } from "@/components/ui/Provenance";
import { ApplicationForm } from "@/components/forms/RecordForms";
import { useLookups, useStore } from "@/lib/store";
import { exportICS, slug } from "@/lib/export";
import type { Application } from "@/lib/types";
import { cn, countryName, daysUntil, formatDate, formatDuration, relativeDeadline, windowStatus } from "@/lib/utils";

export type PeekKind = "scholarship" | "program" | "university";
type Target = { kind: PeekKind; id: string };

const PeekContext = createContext<{ open: (t: Target) => void } | null>(null);

export function usePeek() {
  const ctx = useContext(PeekContext);
  if (!ctx) throw new Error("usePeek must be used within PeekProvider");
  return ctx;
}

const HREF: Record<PeekKind, string> = { scholarship: "/scholarships", program: "/programs", university: "/universities" };

/**
 * Props for a link that opens a record in the side panel on a plain click,
 * while Ctrl/⌘/middle-click still open the full page.
 */
export function usePeekLink(kind: PeekKind, id: string) {
  const { open } = usePeek();
  return {
    href: `${HREF[kind]}/${id}`,
    onClick: (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      open({ kind, id });
    },
  };
}

export function PeekLink({ kind, id, className, children }: { kind: PeekKind; id: string; className?: string; children: React.ReactNode }) {
  const props = usePeekLink(kind, id);
  return (
    <Link {...props} className={className}>
      {children}
    </Link>
  );
}

export function PeekProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<Target[]>([]);
  const pathname = usePathname();
  const open = useCallback((t: Target) => setStack((s) => [...s.slice(-4), t]), []);
  const close = useCallback(() => setStack([]), []);
  const back = useCallback(() => setStack((s) => s.slice(0, -1)), []);

  // Leaving the page closes the panel
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStack([]);
  }, [pathname]);

  const current = stack[stack.length - 1];
  return (
    <PeekContext.Provider value={{ open }}>
      {children}
      {current && <PeekPanel key={current.kind + current.id} target={current} onClose={close} onBack={stack.length > 1 ? back : undefined} />}
    </PeekContext.Provider>
  );
}

function PeekPanel({ target, onClose, onBack }: { target: Target; onClose: () => void; onBack?: () => void }) {
  const { scholarshipById, programById, uniById } = useLookups();
  const [tracking, setTracking] = useState<Partial<Application> | null>(null);
  const fullHref = `${HREF[target.kind]}/${target.id}`;

  const record = target.kind === "scholarship" ? scholarshipById[target.id] : target.kind === "program" ? programById[target.id] : uniById[target.id];
  if (!record) return null;

  return (
    <>
      <Modal
        open
        side
        width={480}
        onClose={onClose}
        title={record.name}
        description={target.kind === "scholarship" ? "Scholarship" : target.kind === "program" ? "Program" : "University"}
        header={
          <Link href={fullHref} title="Open full page" aria-label="Open full page" className="flex size-8 items-center justify-center rounded-md text-fg-muted hover:bg-muted hover:text-fg">
            <Maximize2 className="size-4" />
          </Link>
        }
        footer={
          <>
            {onBack && (
              <Button variant="ghost" className="mr-auto" onClick={onBack}>
                ← Back
              </Button>
            )}
            <Link href={fullHref}>
              <Button>Open full page</Button>
            </Link>
            <Button
              variant="primary"
              onClick={() => {
                if (target.kind === "scholarship") {
                  const s = scholarshipById[target.id];
                  setTracking({ scholarshipId: s.id, universityId: s.universityId, degree: s.degrees[0], deadline: s.deadline, title: s.name });
                } else if (target.kind === "program") {
                  const p = programById[target.id];
                  setTracking({ programId: p.id, universityId: p.universityId, degree: p.degree, deadline: p.deadline });
                } else setTracking({ universityId: target.id });
              }}
            >
              <Plus /> Track
            </Button>
          </>
        }
      >
        <div className="mb-5">
          <Provenance id={record.id} editedAt={record.editedAt} />
        </div>
        {target.kind === "scholarship" && <ScholarshipPeek id={target.id} />}
        {target.kind === "program" && <ProgramPeek id={target.id} />}
        {target.kind === "university" && <UniversityPeek id={target.id} />}
      </Modal>
      {tracking && <ApplicationForm open preset={tracking} onClose={() => setTracking(null)} />}
    </>
  );
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-center gap-2">{children}</div>;
}

function CompareButton({ kind, id }: { kind: "scholarship" | "program"; id: string }) {
  const { compare, toggleCompare } = useStore();
  const on = compare.some((c) => c.kind === kind && c.id === id);
  return (
    <Button size="sm" onClick={() => toggleCompare({ kind, id })} className={cn(on && "text-accent")}>
      {on ? <Check /> : <Columns3 />} {on ? "In comparison" : "Compare"}
    </Button>
  );
}

function ScholarshipPeek({ id }: { id: string }) {
  const { isSaved, toggleSaved, toast } = useStore();
  const s = useLookups().scholarshipById[id];
  const status = windowStatus(s.opens, s.deadline);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-fg-muted">
        <Flag code={s.countryCode} size={16} /> {countryName(s.countryCode)} · {s.provider}
      </div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        <Badge tone={s.coverage === "Fully funded" ? "accent" : "neutral"}>{s.coverage}</Badge>
        <Badge tone="outline">{s.source}</Badge>
        <Badge tone="outline">{s.degrees.join(" · ")}</Badge>
      </div>
      <Actions>
        <SaveToggle withLabel saved={isSaved("scholarships", s.id)} onToggle={() => toggleSaved("scholarships", s.id)} className="h-7 text-[12.5px]" />
        <CompareButton kind="scholarship" id={s.id} />
        {status !== "Closed" && (
          <Button
            size="sm"
            onClick={() => {
              exportICS(`${slug(s.name)}.ics`, [{ id: `sch-${s.id}`, title: `Deadline: ${s.name}`, date: s.deadline, url: s.url, reminders: [14, 3] }]);
              toast("Calendar file downloaded");
            }}
          >
            <CalendarPlus /> Calendar
          </Button>
        )}
      </Actions>

      <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-subtle p-4 text-[13px]">
        <div>
          <div className="flex items-center gap-1.5 text-[12px] text-fg-muted">
            <StatusDot tone={status === "Open" ? "open" : status === "Upcoming" ? "upcoming" : "closed"} /> {status}
          </div>
          <div className="mt-0.5 tabular">{formatDate(s.deadline)}</div>
          {status !== "Closed" && <div className={cn("text-[12px]", daysUntil(s.deadline) <= 21 ? "text-danger" : "text-fg-muted")}>{relativeDeadline(s.deadline)}</div>}
        </div>
        <div>
          <div className="text-[12px] text-fg-muted">Stipend</div>
          <div className="mt-0.5">{s.stipend}</div>
        </div>
      </div>

      <dl>
        <KeyValue label="Tuition">{s.tuition}</KeyValue>
        <KeyValue label="Accommodation">{s.accommodation}</KeyValue>
        <KeyValue label="Travel">{s.travel}</KeyValue>
        <KeyValue label="Nationalities">{s.nationalities}</KeyValue>
        <KeyValue label="Language">{s.languageReq}</KeyValue>
        <KeyValue label="Academic">{s.academicReq}</KeyValue>
      </dl>
      {s.notes && <p className="mt-5 whitespace-pre-line rounded-lg bg-subtle px-3.5 py-3 text-[13px] leading-relaxed">{s.notes}</p>}
      <OfficialLink url={s.url} />
    </div>
  );
}

function ProgramPeek({ id }: { id: string }) {
  const { isSaved, toggleSaved } = useStore();
  const { programById, uniById } = useLookups();
  const p = programById[id];
  const u = uniById[p.universityId];
  const d = daysUntil(p.deadline);
  return (
    <div>
      {u && (
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-fg-muted">
          <Flag code={u.countryCode} size={16} />
          <PeekLink kind="university" id={u.id} className="hover:text-accent">
            {u.name}
          </PeekLink>
          · {u.city}
        </div>
      )}
      <div className="mb-5 flex flex-wrap gap-1.5">
        <Badge tone="outline">{p.degree}</Badge>
        <Badge tone="outline">{p.language}</Badge>
        {p.tuitionPerYear === 0 && <Badge tone="success">Tuition-free</Badge>}
      </div>
      <Actions>
        <SaveToggle withLabel saved={isSaved("programs", p.id)} onToggle={() => toggleSaved("programs", p.id)} className="h-7 text-[12.5px]" />
        <CompareButton kind="program" id={p.id} />
      </Actions>
      <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-subtle p-4 text-[13px]">
        <div>
          <div className="text-[12px] text-fg-muted">Deadline</div>
          <div className="mt-0.5 tabular">{formatDate(p.deadline)}</div>
          <div className={cn("text-[12px]", d < 0 ? "text-fg-faint" : d <= 21 ? "text-danger" : "text-fg-muted")}>{relativeDeadline(p.deadline)}</div>
        </div>
        <div>
          <div className="text-[12px] text-fg-muted">Tuition</div>
          <div className="mt-0.5">{p.tuitionLabel}</div>
        </div>
      </div>
      <dl>
        <KeyValue label="Faculty">{p.faculty}</KeyValue>
        <KeyValue label="Duration">{formatDuration(p.durationMonths)}</KeyValue>
        <KeyValue label="Intake">{p.intake}</KeyValue>
        <KeyValue label="IELTS / TOEFL">
          {p.ielts} / {p.toefl}
        </KeyValue>
        <KeyValue label="Academic">{p.academic}</KeyValue>
      </dl>
      {p.notes && <p className="mt-5 whitespace-pre-line rounded-lg bg-subtle px-3.5 py-3 text-[13px] leading-relaxed">{p.notes}</p>}
      <OfficialLink url={p.url} />
    </div>
  );
}

function UniversityPeek({ id }: { id: string }) {
  const { isSaved, toggleSaved, programs } = useStore();
  const u = useLookups().uniById[id];
  const list = programs.filter((p) => p.universityId === id);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-fg-muted">
        <Flag code={u.countryCode} size={16} /> {u.city}, {countryName(u.countryCode)} · {u.type}
        {u.founded ? ` · Est. ${u.founded}` : ""}
      </div>
      <Actions>
        <SaveToggle withLabel saved={isSaved("universities", u.id)} onToggle={() => toggleSaved("universities", u.id)} className="h-7 text-[12.5px]" />
      </Actions>
      <p className="text-[14px] leading-relaxed">{u.description}</p>
      {u.notes && <p className="mt-4 whitespace-pre-line rounded-lg bg-subtle px-3.5 py-3 text-[13px] leading-relaxed">{u.notes}</p>}
      <h3 className="t-eyebrow mb-2 mt-7">Programs · {list.length}</h3>
      {list.length === 0 ? (
        <p className="text-[13px] text-fg-muted">No programs recorded.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {list.map((p) => (
            <li key={p.id}>
              <PeekLink kind="program" id={p.id} className="group flex items-center justify-between gap-3 py-2.5 text-[13px]">
                <span className="group-hover:text-accent">{p.name}</span>
                <span className="shrink-0 text-[12px] text-fg-muted">{formatDate(p.deadline, { year: false })}</span>
              </PeekLink>
            </li>
          ))}
        </ul>
      )}
      <OfficialLink url={u.website} label="Official website" />
    </div>
  );
}

function OfficialLink({ url, label = "Official page" }: { url: string; label?: string }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-1.5 text-[13px] text-accent hover:underline">
      {label} <ArrowUpRight className="size-3.5" />
    </a>
  );
}
