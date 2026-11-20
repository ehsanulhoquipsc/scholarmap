"use client";

import Link from "next/link";
import { useState } from "react";
import { NotebookPen } from "lucide-react";
import { Button, EmptyState, Input, Select, Textarea } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import { NOTE_CATEGORIES, type Note, type NoteCategory } from "@/lib/types";
import { formatDate, uid } from "@/lib/utils";

/** Notes attached to a country, university or scholarship, with an inline composer. */
export function LinkedNotes({ link, emptyHint }: { link: Pick<Note, "countryCode" | "universityId" | "scholarshipId">; emptyHint: string }) {
  const { notes, upsertNote, toast } = useStore();
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<NoteCategory>("General");

  const list = notes
    .filter((n) =>
      link.universityId ? n.universityId === link.universityId : link.scholarshipId ? n.scholarshipId === link.scholarshipId : n.countryCode === link.countryCode,
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const save = () => {
    if (!title.trim() && !body.trim()) return;
    upsertNote({
      id: uid("note"),
      title: title.trim() || "Untitled note",
      body,
      category,
      ...link,
      author: "You",
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    toast("Note added");
    setTitle("");
    setBody("");
    setComposing(false);
  };

  return (
    <div>
      {composing ? (
        <div className="mb-6 rounded-lg border border-line p-4">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="border-0 px-0 text-[15px] font-medium hover:border-0 focus:border-0" />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write what you found…" className="mt-1 border-0 px-0 hover:border-0" />
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
            <Select value={category} onChange={(e) => setCategory(e.target.value as NoteCategory)} className="w-[180px]">
              {NOTE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setComposing(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={save}>
                Save note
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button className="mb-6" onClick={() => setComposing(true)}>
          <NotebookPen /> New note
        </Button>
      )}

      {list.length === 0 && !composing ? (
        <EmptyState icon={<NotebookPen />} title="No notes yet" description={emptyHint} />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {list.map((n) => (
            <li key={n.id}>
              <Link href={`/notes?id=${n.id}`} className="group block py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[14px] font-medium group-hover:text-accent">{n.title}</span>
                  <span className="shrink-0 text-[12px] text-fg-faint">{formatDate(n.updatedAt, { year: false })}</span>
                </div>
                <p className="mt-1 line-clamp-3 whitespace-pre-line text-[13px] leading-relaxed text-fg-muted">{n.body}</p>
                <div className="mt-2 text-[12px] text-fg-faint">
                  {n.category}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
