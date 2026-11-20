"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Provenance } from "@/components/ui/Provenance";
import { ArrowLeft, NotebookPen, Plus, Trash2 } from "lucide-react";
import { Button, EmptyState, Flag, IconButton, SearchInput, Select } from "@/components/ui/primitives";
import { useLookups, useStore } from "@/lib/store";
import { NOTE_CATEGORIES, type Note } from "@/lib/types";
import { countries } from "@/data/countries";
import { cn, countryName, formatDate, uid } from "@/lib/utils";

export default function NotesPage() {
  const { notes, upsertNote, removeNote } = useStore();
  const { uniById, scholarshipById } = useLookups();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileEditing, setMobileEditing] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveId(id);
      setMobileEditing(true);
    }
  }, []);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...notes]
      .filter((n) => {
        if (category && n.category !== category) return false;
        if (country && n.countryCode !== country) return false;
        if (!t) return true;
        const links = [countryName(n.countryCode), n.universityId && uniById[n.universityId]?.name, n.scholarshipId && scholarshipById[n.scholarshipId]?.name];
        return [n.title, n.body, ...links].some((x) => typeof x === "string" && x.toLowerCase().includes(t));
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, q, category, country, uniById, scholarshipById]);

  const active = notes.find((n) => n.id === activeId) ?? (mobileEditing ? undefined : list[0]);

  const create = () => {
    const n: Note = { id: uid("note"), title: "", body: "", category: "General", author: "You", updatedAt: new Date().toISOString().slice(0, 10), countryCode: country || undefined };
    upsertNote(n);
    setActiveId(n.id);
    setMobileEditing(true);
    setQ("");
    setCategory("");
  };

  return (
    <div className="-mt-2">
      <div className="grid min-h-[calc(100dvh-160px)] overflow-hidden rounded-xl border border-line lg:grid-cols-[320px_1fr]">
        {/* List */}
        <aside className={cn("flex flex-col border-line bg-subtle/50 lg:border-r", mobileEditing && "hidden lg:flex")}>
          <div className="space-y-2 border-b border-line p-3">
            <div className="flex items-center justify-between px-1 pb-1 pt-1">
              <h1 className="t-h2">Research Notes</h1>
              <Button size="sm" variant="primary" onClick={create}>
                <Plus /> New
              </Button>
            </div>
            <SearchInput value={q} onChange={setQ} placeholder="Search notes" />
            <div className="grid grid-cols-2 gap-2">
              <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
                <option value="">All categories</option>
                {NOTE_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
              <Select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country">
                <option value="">All countries</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <ul className="thin-scroll flex-1 overflow-y-auto p-1.5">
            {list.length === 0 && <li className="px-3 py-10 text-center text-[13px] text-fg-muted">No notes found.</li>}
            {list.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    setActiveId(n.id);
                    setMobileEditing(true);
                  }}
                  className={cn("w-full rounded-md px-3 py-2.5 text-left transition-colors", active?.id === n.id ? "bg-bg shadow-[0_0_0_1px_var(--line)]" : "hover:bg-muted/70")}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("flex-1 truncate text-[13.5px]", !n.title && "text-fg-faint")}>{n.title || "Untitled"}</span>
                    {n.countryCode && <Flag code={n.countryCode} size={14} />}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[12.5px] text-fg-muted">{n.body || "No content"}</p>
                  <div className="mt-1 text-[11.5px] text-fg-faint">
                    {n.category} · {formatDate(n.updatedAt, { year: false })}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Editor */}
        <section className={cn("min-w-0 bg-bg", !mobileEditing && "hidden lg:block")}>
          {active ? (
            <Editor
              key={active.id}
              note={active}
              onBack={() => setMobileEditing(false)}
              onChange={(n) => upsertNote(n)}
              onDelete={() => {
                removeNote(active.id);
                setActiveId(null);
                setMobileEditing(false);
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-10">
              <EmptyState
                className="w-full max-w-md border-0"
                icon={<NotebookPen />}
                title="Select a note"
                description="Or start a new one to capture what you learn."
                action={
                  <Button variant="primary" onClick={create}>
                    <Plus /> New note
                  </Button>
                }
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Editor({ note, onChange, onDelete, onBack }: { note: Note; onChange: (n: Note) => void; onDelete: () => void; onBack: () => void }) {
  const { universities, scholarships } = useStore();
  const [draft, setDraft] = useState(note);
  const [saved, setSaved] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Debounced autosave
  const update = (patch: Partial<Note>) => {
    const next = { ...draft, ...patch, updatedAt: new Date().toISOString().slice(0, 10) };
    setDraft(next);
    setSaved(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onChange(next);
      setSaved(true);
    }, 450);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  // Auto-grow body
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [draft.body]);

  const unis = universities.filter((u) => !draft.countryCode || u.countryCode === draft.countryCode).sort((a, b) => a.name.localeCompare(b.name));
  const schs = scholarships.filter((s) => !draft.countryCode || s.countryCode === draft.countryCode);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2 sm:px-8">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg lg:hidden">
          <ArrowLeft className="size-3.5" /> Notes
        </button>
        <span className="text-[12px] text-fg-faint lg:ml-0">
          {saved ? <Provenance id={note.id} editedAt={note.editedAt} /> : "Saving…"}
        </span>
        <IconButton label="Delete note" onClick={onDelete} className="hover:text-danger">
          <Trash2 />
        </IconButton>
      </div>
      <div className="thin-scroll flex-1 overflow-y-auto px-4 py-8 sm:px-12 sm:py-10">
        <div className="mx-auto max-w-[680px]">
          <input
            autoFocus={!note.title}
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Untitled"
            className="w-full bg-transparent text-[26px] font-medium tracking-[-0.022em] placeholder:text-fg-faint focus:outline-none"
          />
          <div className="mt-4 grid grid-cols-[110px_1fr] items-center gap-y-1.5 border-b border-line pb-5 text-[13px]">
            <span className="text-fg-muted">Category</span>
            <MetaSelect value={draft.category} onChange={(v) => update({ category: v as Note["category"] })} options={NOTE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
            <span className="text-fg-muted">Country</span>
            <MetaSelect
              value={draft.countryCode ?? ""}
              onChange={(v) => update({ countryCode: v || undefined, universityId: undefined, scholarshipId: undefined })}
              empty="None"
              options={countries.map((c) => ({ value: c.code, label: c.name }))}
            />
            <span className="text-fg-muted">University</span>
            <MetaSelect value={draft.universityId ?? ""} onChange={(v) => update({ universityId: v || undefined })} empty="None" options={unis.map((u) => ({ value: u.id, label: u.name }))} />
            <span className="text-fg-muted">Scholarship</span>
            <MetaSelect value={draft.scholarshipId ?? ""} onChange={(v) => update({ scholarshipId: v || undefined })} empty="None" options={schs.map((s) => ({ value: s.id, label: s.name }))} />
          </div>
          <textarea
            ref={bodyRef}
            value={draft.body}
            onChange={(e) => update({ body: e.target.value })}
            placeholder="Start writing…"
            className="mt-6 min-h-[300px] w-full resize-none overflow-hidden bg-transparent text-[15px] leading-[1.75] placeholder:text-fg-faint focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function MetaSelect({ value, onChange, options, empty }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; empty?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "-ml-2 h-7 max-w-full cursor-pointer truncate rounded-md bg-transparent px-2 transition-colors hover:bg-muted focus:outline-none",
        !value && "text-fg-faint",
      )}
    >
      {empty !== undefined && <option value="">{empty}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
