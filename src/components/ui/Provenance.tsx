"use client";

import { useEffect, useState } from "react";
import { SAMPLE_IDS } from "@/lib/store";
import { cn, timeAgo } from "@/lib/utils";

/** Re-render periodically so "2 min ago" stays true. */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** Where a record came from and when you last changed it. */
export function provenanceText(id: string, editedAt: string | undefined, now: number) {
  const sample = SAMPLE_IDS.has(id);
  if (sample && !editedAt) return { text: "Sample data", mine: false };
  if (sample) return { text: `Sample · edited by you ${timeAgo(editedAt!, now)}`, mine: true };
  return { text: editedAt ? `Added by you · edited ${timeAgo(editedAt, now)}` : "Added by you", mine: true };
}

export function Provenance({ id, editedAt, className }: { id: string; editedAt?: string; className?: string }) {
  const now = useNow();
  const { text, mine } = provenanceText(id, editedAt, now);
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12px]", mine ? "text-fg-muted" : "text-fg-faint", className)} title={editedAt ? new Date(editedAt).toLocaleString("en-GB") : undefined}>
      <span className={cn("size-1.5 rounded-full", mine ? "bg-accent" : "border border-fg-faint")} />
      {text}
    </span>
  );
}

/** Tiny marker for list rows: shows only for records you added or edited. */
export function EditedMark({ id, editedAt }: { id: string; editedAt?: string }) {
  const now = useNow(60000);
  if (SAMPLE_IDS.has(id) && !editedAt) return null;
  const { text } = provenanceText(id, editedAt, now);
  return (
    <span title={text} className="inline-flex items-center gap-1 text-[11.5px] text-accent">
      <span className="size-1.5 rounded-full bg-accent" />
      {SAMPLE_IDS.has(id) ? "Edited" : "Yours"}
    </span>
  );
}
