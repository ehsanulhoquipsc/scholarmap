"use client";

import Link from "next/link";
import { Provenance } from "@/components/ui/Provenance";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, Download, FileText, Paperclip, Plus, Trash2 } from "lucide-react";
import { Badge, Button, EmptyState, Field, IconButton, Input, Modal, SearchInput, Select, Textarea } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import { DOCUMENT_KINDS, type DocumentKind, type DocumentRecord, type DocumentStatus, type DocumentVersion } from "@/lib/types";
import { downloadFile, exportCSV, slug } from "@/lib/export";
import { cn, formatDate, uid } from "@/lib/utils";

const STATUS_TONE: Record<DocumentStatus, "neutral" | "warning" | "success"> = { Draft: "neutral", "In review": "warning", Final: "success" };
const todayIso = () => new Date().toISOString().slice(0, 10);

/** Applications whose checklist links to a document. */
function useUsage() {
  const { applications } = useStore();
  return useMemo(() => {
    const m: Record<string, { appId: string; title: string; item: string; done: boolean }[]> = {};
    applications.forEach((a) =>
      a.checklist.forEach((c) => c.documentId && (m[c.documentId] ??= []).push({ appId: a.id, title: a.title, item: c.label, done: c.done })),
    );
    return m;
  }, [applications]);
}

export default function DocumentsPage() {
  const { documents, toast } = useStore();
  const usage = useUsage();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveId(id);
      setMobileOpen(true);
    }
  }, []);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...documents]
      .filter((d) => (!kind || d.kind === kind) && (!t || [d.title, d.kind, ...d.versions.map((v) => v.label + " " + v.note + " " + v.content)].some((x) => x.toLowerCase().includes(t))))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [documents, q, kind]);

  const active = documents.find((d) => d.id === activeId) ?? (mobileOpen ? undefined : list[0]);

  const exportList = () => {
    exportCSV("scholarmap-documents.csv", documents, [
      { header: "Title", value: (d) => d.title },
      { header: "Type", value: (d) => d.kind },
      { header: "Status", value: (d) => d.status },
      { header: "Latest version", value: (d) => d.versions[0]?.label },
      { header: "File", value: (d) => d.versions[0]?.fileName },
      { header: "Versions", value: (d) => d.versions.length },
      { header: "Updated", value: (d) => d.updatedAt },
      { header: "Used in applications", value: (d) => (usage[d.id] ?? []).map((u) => u.title).join("; ") },
    ]);
    toast("Exported documents list");
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="t-h1">Documents</h1>
          <p className="mt-1.5 max-w-2xl text-[14px] text-fg-muted">
            Your CVs, statements and certificates — with versions — linked to the applications that need them.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportList}>
            <Download /> Export CSV
          </Button>
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus /> New document
          </Button>
        </div>
      </div>

      <div className="grid min-h-[calc(100dvh-240px)] overflow-hidden rounded-xl border border-line lg:grid-cols-[340px_1fr]">
        <aside className={cn("flex flex-col border-line bg-subtle/50 lg:border-r", mobileOpen && "hidden lg:flex")}>
          <div className="space-y-2 border-b border-line p-3">
            <SearchInput value={q} onChange={setQ} placeholder="Search documents" />
            <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Document type">
              <option value="">All types</option>
              {DOCUMENT_KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </Select>
          </div>
          <ul className="thin-scroll flex-1 overflow-y-auto p-1.5">
            {list.length === 0 && <li className="px-3 py-10 text-center text-[13px] text-fg-muted">No documents found.</li>}
            {list.map((d) => {
              const uses = usage[d.id]?.length ?? 0;
              return (
                <li key={d.id}>
                  <button
                    onClick={() => {
                      setActiveId(d.id);
                      setMobileOpen(true);
                    }}
                    className={cn("flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors", active?.id === d.id ? "bg-bg shadow-[0_0_0_1px_var(--line)]" : "hover:bg-muted/70")}
                  >
                    <FileText className="mt-0.5 size-4 shrink-0 text-fg-faint" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="flex-1 truncate text-[13.5px]">{d.title}</span>
                        <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-fg-muted">
                        {d.kind} · {d.versions[0]?.label ?? "No versions"}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-fg-faint">
                        {uses ? `Used in ${uses} ${uses === 1 ? "application" : "applications"}` : "Not linked yet"} · {formatDate(d.updatedAt, { year: false })}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className={cn("min-w-0 bg-bg", !mobileOpen && "hidden lg:block")}>
          {active ? (
            <DocumentDetail
              key={active.id}
              doc={active}
              onBack={() => setMobileOpen(false)}
              onDeleted={() => {
                setActiveId(null);
                setMobileOpen(false);
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-10">
              <EmptyState
                className="w-full max-w-md border-0"
                icon={<FileText />}
                title="No document selected"
                description="Add your CV, statement of purpose or certificates to reuse them across applications."
                action={
                  <Button variant="primary" onClick={() => setCreating(true)}>
                    <Plus /> New document
                  </Button>
                }
              />
            </div>
          )}
        </section>
      </div>

      {creating && (
        <NewDocument
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setActiveId(id);
            setMobileOpen(true);
          }}
        />
      )}
    </div>
  );
}

function NewDocument({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { upsertDocument, toast } = useStore();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<DocumentKind>("Statement of purpose");
  const create = () => {
    const d: DocumentRecord = {
      id: uid("doc"),
      title: title.trim() || kind,
      kind,
      status: "Draft",
      updatedAt: todayIso(),
      versions: [{ id: uid("v"), label: "v1", createdAt: todayIso(), content: "", note: "" }],
    };
    upsertDocument(d);
    toast("Document created");
    onCreated(d.id);
    onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="New document"
      width={460}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={create}>Create</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} placeholder="e.g. Statement of purpose — Data Science" />
        </Field>
        <Field label="Type">
          <Select value={kind} onChange={(e) => setKind(e.target.value as DocumentKind)}>
            {DOCUMENT_KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

function DocumentDetail({ doc, onBack, onDeleted }: { doc: DocumentRecord; onBack: () => void; onDeleted: () => void }) {
  const { upsertDocument, removeDocument, toast, undoable } = useStore();
  const usage = useUsage()[doc.id] ?? [];
  const [versionId, setVersionId] = useState(doc.versions[0]?.id);
  const v = doc.versions.find((x) => x.id === versionId) ?? doc.versions[0];

  const save = (patch: Partial<DocumentRecord>) => upsertDocument({ ...doc, ...patch, updatedAt: todayIso() });
  const saveVersion = (patch: Partial<DocumentVersion>) => save({ versions: doc.versions.map((x) => (x.id === v.id ? { ...x, ...patch } : x)) });

  const newVersion = () => {
    const n = doc.versions.length + 1;
    const nv: DocumentVersion = { id: uid("v"), label: `v${n}`, createdAt: todayIso(), content: v?.content ?? "", fileName: undefined, note: "" };
    save({ versions: [nv, ...doc.versions], status: "Draft" });
    setVersionId(nv.id);
    toast(`Created v${n} from ${v?.label ?? "scratch"}`);
  };

  const words = v?.content.trim() ? v.content.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2 sm:px-8">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg lg:hidden">
          <ArrowLeft className="size-3.5" /> Documents
        </button>
        <Provenance id={doc.id} editedAt={doc.editedAt} className="hidden lg:inline-flex" />
        <IconButton
          label="Delete document"
          onClick={() => {
            onDeleted();
            removeDocument(doc.id);
          }}
          className="hover:text-danger"
        >
          <Trash2 />
        </IconButton>
      </div>

      <div className="thin-scroll flex-1 overflow-y-auto px-4 py-8 sm:px-10">
        <div className="mx-auto max-w-[720px]">
          <input
            value={doc.title}
            onChange={(e) => save({ title: e.target.value })}
            className="w-full bg-transparent text-[24px] font-medium tracking-[-0.02em] focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Select value={doc.kind} onChange={(e) => save({ kind: e.target.value as DocumentKind })} className="w-[200px]" aria-label="Type">
              {DOCUMENT_KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </Select>
            <Select value={doc.status} onChange={(e) => save({ status: e.target.value as DocumentStatus })} className="w-[130px]" aria-label="Status">
              {(["Draft", "In review", "Final"] as const).map((k) => (
                <option key={k}>{k}</option>
              ))}
            </Select>
          </div>

          {/* Versions */}
          <div className="mt-8 flex items-center justify-between">
            <h2 className="t-h2">Versions</h2>
            <Button size="sm" onClick={newVersion}>
              <Plus /> New version
            </Button>
          </div>
          <div className="thin-scroll mt-3 flex gap-2 overflow-x-auto pb-1">
            {doc.versions.map((x, i) => (
              <button
                key={x.id}
                onClick={() => setVersionId(x.id)}
                className={cn(
                  "shrink-0 rounded-md border px-3 py-2 text-left transition-colors",
                  x.id === v?.id ? "border-accent bg-accent-soft/50" : "border-line hover:border-line-strong",
                )}
              >
                <div className="flex items-center gap-1.5 text-[12.5px] font-medium">
                  {x.label}
                  {i === 0 && <span className="text-[10.5px] font-normal uppercase tracking-wide text-accent">Latest</span>}
                </div>
                <div className="text-[11.5px] text-fg-muted">{formatDate(x.createdAt, { year: false })}</div>
              </button>
            ))}
          </div>

          {v ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Version label">
                  <Input value={v.label} onChange={(e) => saveVersion({ label: e.target.value })} />
                </Field>
                <Field label="File reference" hint="Where the file lives (no uploads in the prototype)">
                  <div className="relative">
                    <Paperclip className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-faint" />
                    <Input value={v.fileName ?? ""} onChange={(e) => saveVersion({ fileName: e.target.value || undefined })} placeholder="e.g. SOP_v3.pdf" className="pl-7" />
                  </div>
                </Field>
              </div>
              <Field label="Version note">
                <Input value={v.note} onChange={(e) => saveVersion({ note: e.target.value })} placeholder="What changed, who it's tailored for…" />
              </Field>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-fg-muted">Text</span>
                  <span className="flex items-center gap-1">
                    <span className="mr-2 text-[11.5px] text-fg-faint tabular">{words} words</span>
                    <IconButton
                      label="Copy text"
                      className="size-7"
                      onClick={() => {
                        navigator.clipboard?.writeText(v.content);
                        toast("Copied to clipboard");
                      }}
                    >
                      <Copy />
                    </IconButton>
                    <IconButton
                      label="Download as .txt"
                      className="size-7"
                      onClick={() => downloadFile(`${slug(doc.title)}-${slug(v.label)}.txt`, v.content, "text/plain;charset=utf-8")}
                    >
                      <Download />
                    </IconButton>
                  </span>
                </div>
                <Textarea
                  value={v.content}
                  onChange={(e) => saveVersion({ content: e.target.value })}
                  placeholder="Paste or draft the text of this version…"
                  className="min-h-[260px] text-[14px] leading-[1.7]"
                />
              </div>
              {doc.versions.length > 1 && (
                <button
                  onClick={() => {
                    const rest = doc.versions.filter((x) => x.id !== v.id);
                    setVersionId(rest[0]?.id);
                    undoable(`Deleted ${v.label}`, ["documents"], () => save({ versions: rest }));
                  }}
                  className="text-[12.5px] text-fg-muted hover:text-danger"
                >
                  Delete this version
                </button>
              )}
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-fg-muted">No versions yet.</p>
          )}

          {/* Usage */}
          <h2 className="t-h2 mt-10">Used in</h2>
          {usage.length === 0 ? (
            <p className="mt-2 text-[13px] text-fg-muted">
              Not linked to any application. Link it from a checklist item in{" "}
              <Link href="/applications" className="text-accent">
                My Applications
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {usage.map((u) => (
                <li key={u.appId + u.item}>
                  <Link href={`/applications?id=${u.appId}`} className="group flex items-center gap-3 py-2.5 text-[13px]">
                    <span className={cn("size-1.5 rounded-full", u.done ? "bg-success" : "bg-warning")} />
                    <span className="flex-1 truncate group-hover:text-accent">{u.title}</span>
                    <span className="shrink-0 text-[12px] text-fg-muted">
                      {u.item} · {u.done ? "done" : "to do"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}
