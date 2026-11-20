"use client";

import Link from "next/link";
import { Provenance } from "@/components/ui/Provenance";
import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Check, Columns2, Download, FileText, ListChecks, Paperclip, Pencil, Plus, Rows3, Trash2 } from "lucide-react";
import { exportCSV, exportICS, slug } from "@/lib/export";
import { Badge, Button, EmptyState, Flag, Input, Modal, PageHeader, Segmented, Select, Textarea } from "@/components/ui/primitives";
import { ApplicationForm } from "@/components/forms/RecordForms";
import { useLookups, useStore } from "@/lib/store";
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from "@/lib/types";
import { cn, daysUntil, formatDate, relativeDeadline, uid } from "@/lib/utils";

const STATUS_TONE: Record<ApplicationStatus, string> = {
  Interested: "bg-fg-faint",
  Researching: "bg-fg-faint",
  "Preparing documents": "bg-warning",
  "Ready to apply": "bg-accent",
  Applied: "bg-accent",
  "Under review": "bg-accent",
  Accepted: "bg-success",
  Rejected: "bg-danger",
};

const PHASES = [
  { label: "Exploring", statuses: ["Interested", "Researching"] },
  { label: "Preparing", statuses: ["Preparing documents", "Ready to apply"] },
  { label: "Submitted", statuses: ["Applied", "Under review"] },
  { label: "Decided", statuses: ["Accepted", "Rejected"] },
];

const progressOf = (a: Application) => (a.checklist.length ? Math.round((a.checklist.filter((c) => c.done).length / a.checklist.length) * 100) : 0);

export default function ApplicationsPage() {
  const { applications, upsertApplication, toast } = useStore();
  const [view, setView] = useState<"list" | "board">("list");
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [phase, setPhase] = useState<string>("");
  const { uniById, programById, scholarshipById } = useLookups();

  // Deep link: /applications?id=app-1 opens that application
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id) setOpenId(id);
  }, []);

  const sorted = useMemo(
    () =>
      [...applications]
        .filter((a) => !phase || PHASES.find((p) => p.label === phase)?.statuses.includes(a.status))
        .sort((a, b) => APPLICATION_STATUSES.indexOf(a.status) - APPLICATION_STATUSES.indexOf(b.status) || a.deadline.localeCompare(b.deadline)),
    [applications, phase],
  );

  const exportList = () => {
    exportCSV("scholarmap-applications.csv", sorted, [
      { header: "Opportunity", value: (a) => a.title },
      { header: "University", value: (a) => (a.universityId ? uniById[a.universityId]?.name : "") },
      { header: "Program", value: (a) => (a.programId ? programById[a.programId]?.name : "") },
      { header: "Scholarship", value: (a) => (a.scholarshipId ? scholarshipById[a.scholarshipId]?.name : "") },
      { header: "Degree", value: (a) => a.degree },
      { header: "Deadline", value: (a) => a.deadline },
      { header: "Status", value: (a) => a.status },
      { header: "Documents ready", value: (a) => `${a.checklist.filter((c) => c.done).length}/${a.checklist.length}` },
      { header: "Missing documents", value: (a) => a.checklist.filter((c) => !c.done).map((c) => c.label).join("; ") },
      { header: "Notes", value: (a) => a.notes },
      { header: "Last updated", value: (a) => a.updatedAt },
    ]);
    toast(`Exported ${sorted.length} applications`);
  };

  const setStatus = (a: Application, status: ApplicationStatus) => {
    if (a.status === status) return;
    upsertApplication({ ...a, status, updatedAt: new Date().toISOString().slice(0, 10) });
    toast(`Moved to “${status}”`);
  };

  const open = applications.find((a) => a.id === openId);

  return (
    <div>
      <PageHeader
        title="My Applications"
        description="Track every opportunity from first interest to final decision."
        actions={
          <>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: "list", label: <><Rows3 /> List</> },
                { value: "board", label: <><Columns2 /> Board</> },
              ]}
            />
            <Button onClick={exportList} title="Export the applications shown as CSV">
              <Download /> CSV
            </Button>
            <Button variant="primary" onClick={() => setAdding(true)}>
              <Plus /> Track application
            </Button>
          </>
        }
      />

      {/* Phase summary doubles as a filter */}
      <div className="mb-8 grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {PHASES.map((p, i) => {
          const n = applications.filter((a) => p.statuses.includes(a.status)).length;
          const active = phase === p.label;
          return (
            <button
              key={p.label}
              onClick={() => setPhase(active ? "" : p.label)}
              className={cn(
                "py-4 text-left transition-colors sm:px-5",
                i > 0 && "sm:border-l sm:border-line",
                i % 2 === 1 && "border-l border-line pl-5 sm:pl-5",
                i >= 2 && "border-t border-line sm:border-t-0",
                i === 0 && "sm:pl-0",
                active ? "text-accent" : "hover:text-fg",
              )}
            >
              <div className="tabular text-[24px] leading-none tracking-[-0.02em]">{n}</div>
              <div className={cn("mt-1.5 text-[12.5px]", active ? "text-accent" : "text-fg-muted")}>{p.label}</div>
            </button>
          );
        })}
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={<ListChecks />}
          title="No applications tracked yet"
          description="Track a program or scholarship to follow its documents, deadline and status."
          action={
            <Button variant="primary" onClick={() => setAdding(true)}>
              <Plus /> Track application
            </Button>
          }
        />
      ) : view === "list" ? (
        <div className="thin-scroll -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="border-y border-line text-left text-[12px] text-fg-muted">
                <th className="py-2.5 pr-4 font-normal">Opportunity</th>
                <th className="py-2.5 pr-4 font-normal">Degree</th>
                <th className="py-2.5 pr-4 font-normal">Deadline</th>
                <th className="py-2.5 pr-4 font-normal">Status</th>
                <th className="w-[150px] py-2.5 font-normal">Documents</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <ListRow key={a.id} a={a} onOpen={() => setOpenId(a.id)} onStatus={(s) => setStatus(a, s)} />
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && <p className="py-10 text-center text-[13px] text-fg-muted">No applications in this phase.</p>}
        </div>
      ) : (
        <Board apps={sorted} onOpen={setOpenId} onStatus={setStatus} />
      )}

      {adding && <ApplicationForm open onClose={() => setAdding(false)} />}
      {open && <ApplicationDetail a={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function StatusSelect({ value, onChange }: { value: ApplicationStatus; onChange: (s: ApplicationStatus) => void }) {
  return (
    <div className="relative inline-flex items-center">
      <span className={cn("pointer-events-none absolute left-2.5 size-1.5 rounded-full", STATUS_TONE[value])} />
      <select
        value={value}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange(e.target.value as ApplicationStatus)}
        className="h-7 cursor-pointer appearance-none rounded-md border border-transparent bg-muted pl-6 pr-3 text-[12.5px] transition-colors hover:border-line-strong focus:border-accent focus:outline-none"
      >
        {APPLICATION_STATUSES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}

function Progress({ a }: { a: Application }) {
  const p = progressOf(a);
  const done = a.checklist.filter((c) => c.done).length;
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", p === 100 ? "bg-success" : "bg-accent")} style={{ width: `${p}%` }} />
      </div>
      <span className="tabular w-9 text-right text-[12px] text-fg-muted">
        {done}/{a.checklist.length}
      </span>
    </div>
  );
}

function Subtitle({ a }: { a: Application }) {
  const { uniById, scholarshipById } = useLookups();
  const u = a.universityId ? uniById[a.universityId] : undefined;
  const s = a.scholarshipId ? scholarshipById[a.scholarshipId] : undefined;
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-fg-muted">
      {u && <Flag code={u.countryCode} size={13} />}
      <span className="truncate">{[s && s.name !== a.title ? s.name : null, !s && u ? u.city : null].filter(Boolean).join(" · ") || (u ? u.name : "")}</span>
    </span>
  );
}

function ListRow({ a, onOpen, onStatus }: { a: Application; onOpen: () => void; onStatus: (s: ApplicationStatus) => void }) {
  const d = daysUntil(a.deadline);
  const submitted = ["Applied", "Under review", "Accepted", "Rejected"].includes(a.status);
  return (
    <tr onClick={onOpen} className="group cursor-pointer border-b border-line align-middle transition-colors hover:bg-subtle/70">
      <td className="max-w-[360px] py-3 pr-4">
        <div className="truncate font-medium group-hover:text-accent">{a.title}</div>
        <Subtitle a={a} />
      </td>
      <td className="py-3 pr-4 text-fg-muted">{a.degree}</td>
      <td className="py-3 pr-4">
        <div className="tabular">{formatDate(a.deadline)}</div>
        <div className={cn("text-[12px]", submitted ? "text-fg-faint" : d < 0 ? "text-fg-faint" : d <= 14 ? "text-danger" : "text-fg-muted")}>
          {submitted ? "Submitted" : relativeDeadline(a.deadline)}
        </div>
      </td>
      <td className="py-3 pr-4">
        <StatusSelect value={a.status} onChange={onStatus} />
      </td>
      <td className="py-3">
        <Progress a={a} />
      </td>
    </tr>
  );
}

function Board({ apps, onOpen, onStatus }: { apps: Application[]; onOpen: (id: string) => void; onStatus: (a: Application, s: ApplicationStatus) => void }) {
  const [over, setOver] = useState<string | null>(null);
  return (
    <div className="thin-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
      {APPLICATION_STATUSES.map((status) => {
        const items = apps.filter((a) => a.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(status);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const a = apps.find((x) => x.id === e.dataTransfer.getData("text/plain"));
              if (a) onStatus(a, status);
            }}
            className={cn("flex w-[248px] shrink-0 flex-col rounded-lg bg-subtle p-2 transition-colors", over === status && "bg-accent-soft")}
          >
            <div className="flex items-center gap-2 px-1.5 pb-2.5 pt-1">
              <span className={cn("size-1.5 rounded-full", STATUS_TONE[status])} />
              <span className="text-[12.5px] font-medium">{status}</span>
              <span className="tabular text-[12px] text-fg-faint">{items.length}</span>
            </div>
            <div className="flex min-h-[80px] flex-col gap-2">
              {items.map((a) => (
                <button
                  key={a.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", a.id)}
                  onClick={() => onOpen(a.id)}
                  className="cursor-grab rounded-md border border-line bg-bg p-3 text-left transition-shadow hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] active:cursor-grabbing"
                >
                  <div className="line-clamp-2 text-[13px] font-medium leading-snug">{a.title}</div>
                  <div className="mt-1.5 text-[12px] text-fg-muted tabular">{formatDate(a.deadline)}</div>
                  <div className="mt-3">
                    <Progress a={a} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ApplicationDetail({ a, onClose }: { a: Application; onClose: () => void }) {
  const { upsertApplication, removeApplication, toast, undoable, documents } = useStore();
  const { uniById, programById, scholarshipById } = useLookups();
  const docById = Object.fromEntries(documents.map((d) => [d.id, d]));
  const [editing, setEditing] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [notes, setNotes] = useState(a.notes);

  const save = (patch: Partial<Application>) => upsertApplication({ ...a, ...patch, updatedAt: new Date().toISOString().slice(0, 10) });
  const u = a.universityId ? uniById[a.universityId] : undefined;
  const p = a.programId ? programById[a.programId] : undefined;
  const s = a.scholarshipId ? scholarshipById[a.scholarshipId] : undefined;

  if (editing) return <ApplicationForm open initial={a} onClose={() => setEditing(false)} />;

  return (
    <Modal
      open
      side
      width={540}
      header={<Provenance id={a.id} editedAt={a.editedAt} className="mr-2 hidden sm:inline-flex" />}
      onClose={() => {
        if (notes !== a.notes) save({ notes });
        onClose();
      }}
      title={a.title}
      footer={
        (
          <>
            <Button
              variant="danger"
              className="mr-auto"
              onClick={() => {
                onClose();
                removeApplication(a.id);
              }}
            >
              <Trash2 /> Remove
            </Button>
            <Button variant="ghost" onClick={() => setEditing(true)}>
              <Pencil /> Edit details
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                save({ notes });
                onClose();
              }}
            >
              Done
            </Button>
          </>
        )
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
          <div>
            <div className="text-[12px] text-fg-faint">Status</div>
            <Select value={a.status} onChange={(e) => save({ status: e.target.value as ApplicationStatus })} className="mt-1">
              {APPLICATION_STATUSES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </div>
          <div>
            <div className="text-[12px] text-fg-faint">Deadline</div>
            <div className="mt-1 flex h-8 items-center tabular">
              {formatDate(a.deadline)} <span className="ml-2 text-fg-muted">{relativeDeadline(a.deadline)}</span>
              {daysUntil(a.deadline) >= 0 && (
                <IconButtonSmall
                  label="Add deadline to calendar"
                  onClick={() => {
                    exportICS(`${slug(a.title)}.ics`, [{ id: `app-${a.id}`, title: `Deadline: ${a.title}`, date: a.deadline, description: a.notes, reminders: [14, 3] }]);
                    toast("Calendar file downloaded");
                  }}
                >
                  <CalendarPlus />
                </IconButtonSmall>
              )}
            </div>
          </div>
          {u && (
            <div>
              <div className="text-[12px] text-fg-faint">University</div>
              <Link href={`/universities/${u.id}`} className="hover:text-accent">{u.name}</Link>
            </div>
          )}
          {p && (
            <div>
              <div className="text-[12px] text-fg-faint">Program</div>
              <Link href={`/programs/${p.id}`} className="hover:text-accent">{p.name}</Link>
            </div>
          )}
          {s && (
            <div>
              <div className="text-[12px] text-fg-faint">Scholarship</div>
              <Link href={`/scholarships/${s.id}`} className="hover:text-accent">{s.name}</Link>
            </div>
          )}
          <div>
            <div className="text-[12px] text-fg-faint">Degree</div>
            <Badge tone="outline">{a.degree}</Badge>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-medium">Documents</span>
            <span className="text-[12px] text-fg-muted tabular">{progressOf(a)}% ready</span>
          </div>
          <ul className="divide-y divide-line rounded-lg border border-line">
            {a.checklist.map((c) => (
              <li key={c.id} className="group flex items-center gap-3 px-3 py-2">
                <button
                  onClick={() => save({ checklist: a.checklist.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)) })}
                  aria-pressed={c.done}
                  aria-label={c.done ? `Mark ${c.label} as not done` : `Mark ${c.label} as done`}
                  className={cn(
                    "flex size-[18px] shrink-0 items-center justify-center rounded border transition-colors",
                    c.done ? "border-accent bg-accent text-white" : "border-line-strong hover:border-accent",
                  )}
                >
                  {c.done && <Check className="size-3" strokeWidth={3} />}
                </button>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[13px]", c.done && "text-fg-muted line-through")}>{c.label}</span>
                  {c.documentId && docById[c.documentId] && (
                    <Link
                      href={`/documents?id=${c.documentId}`}
                      className="mt-0.5 inline-flex max-w-full items-center gap-1 text-[12px] text-accent hover:underline"
                    >
                      <FileText className="size-3 shrink-0" />
                      <span className="truncate">
                        {docById[c.documentId].title} · {docById[c.documentId].versions[0]?.label}
                      </span>
                    </Link>
                  )}
                </span>
                {/* Link a document from the library — native select over an icon keeps it compact */}
                <label
                  title={c.documentId ? "Change linked document" : "Link a document"}
                  className={cn(
                    "relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-muted",
                    c.documentId ? "text-accent" : "text-fg-faint opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
                  )}
                >
                  <Paperclip className="size-3.5" />
                  <select
                    aria-label={`Link document to ${c.label}`}
                    value={c.documentId ?? ""}
                    onChange={(e) => save({ checklist: a.checklist.map((x) => (x.id === c.id ? { ...x, documentId: e.target.value || undefined } : x)) })}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  >
                    <option value="">No linked document</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.kind})
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={() => undoable(`Removed “${c.label}”`, ["applications"], () => save({ checklist: a.checklist.filter((x) => x.id !== c.id) }))}
                  className="text-fg-faint opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                  aria-label="Remove item"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
            <li className="px-3 py-1.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newItem.trim()) return;
                  save({ checklist: [...a.checklist, { id: uid("c"), label: newItem.trim(), done: false }] });
                  setNewItem("");
                }}
              >
                <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add a document and press Enter" className="border-0 px-0 hover:border-0" />
              </form>
            </li>
          </ul>
        </div>

        <div>
          <div className="mb-2 text-[13px] font-medium">Personal notes</div>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reminders, contacts, questions…" />
        </div>
      </div>
    </Modal>
  );
}

function IconButtonSmall({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="ml-2 flex size-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-muted hover:text-accent [&_svg]:size-3.5"
    >
      {children}
    </button>
  );
}
