"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Columns3, Plus, X } from "lucide-react";
import { Button, EmptyState, Flag, IconButton, Modal, PageHeader, SearchInput, Segmented } from "@/components/ui/primitives";
import { useLookups, useStore } from "@/lib/store";
import type { CompareItem } from "@/lib/types";
import { cn, countryName, daysUntil, formatDate, formatDuration, relativeDeadline } from "@/lib/utils";

type Row = { label: string; values: (string | undefined)[]; highlight?: "max" | "min"; numeric?: (number | undefined)[] };

export default function ComparePage() {
  const { compare, toggleCompare, setCompare } = useStore();
  const { scholarshipById, programById, uniById } = useLookups();
  const [picking, setPicking] = useState(false);
  const [onlyDiff, setOnlyDiff] = useState(false);

  const columns = compare
    .map((c) => {
      if (c.kind === "scholarship") {
        const s = scholarshipById[c.id];
        if (!s) return null;
        const u = s.universityId ? uniById[s.universityId] : undefined;
        return {
          item: c,
          href: `/scholarships/${s.id}`,
          title: s.name,
          sub: s.provider,
          country: s.countryCode,
          fields: {
            Country: countryName(s.countryCode),
            University: u?.name ?? "Any eligible university",
            Degree: s.degrees.join(", "),
            "Funding coverage": s.coverage,
            Tuition: s.tuition,
            "Monthly stipend": s.stipend,
            Accommodation: s.accommodation,
            "Travel allowance": s.travel,
            Eligibility: s.nationalities,
            "Language requirements": s.languageReq,
            Deadline: `${formatDate(s.deadline)} (${relativeDeadline(s.deadline)})`,
            Duration: s.durationLabel,
          },
          stipend: s.stipendMonthly,
          tuitionNum: undefined as number | undefined,
          deadline: s.deadline,
        };
      }
      const p = programById[c.id];
      if (!p) return null;
      const u = uniById[p.universityId];
      return {
        item: c,
        href: `/programs/${p.id}`,
        title: p.name,
        sub: u?.name ?? "",
        country: u?.countryCode,
        fields: {
          Country: countryName(u?.countryCode),
          University: u?.name ?? "",
          Degree: p.degree,
          "Funding coverage": p.tuitionPerYear === 0 ? "Tuition-free" : "Self-funded unless awarded",
          Tuition: p.tuitionLabel,
          "Monthly stipend": "—",
          Accommodation: "—",
          "Travel allowance": "—",
          Eligibility: p.academic,
          "Language requirements": `IELTS ${p.ielts} · TOEFL ${p.toefl}`,
          Deadline: `${formatDate(p.deadline)} (${relativeDeadline(p.deadline)})`,
          Duration: formatDuration(p.durationMonths),
        },
        stipend: undefined as number | undefined,
        tuitionNum: p.tuitionPerYear,
        deadline: p.deadline,
      };
    })
    .filter(Boolean) as unknown as {
    item: CompareItem;
    href: string;
    title: string;
    sub: string;
    country?: string;
    fields: Record<string, string>;
    stipend?: number;
    tuitionNum?: number;
    deadline: string;
  }[];

  const labels = ["Country", "University", "Degree", "Funding coverage", "Tuition", "Monthly stipend", "Accommodation", "Travel allowance", "Eligibility", "Language requirements", "Deadline", "Duration"];
  const rows: Row[] = labels.map((l) => ({ label: l, values: columns.map((c) => c.fields[l]) }));
  const visibleRows = onlyDiff && columns.length > 1 ? rows.filter((r) => new Set(r.values).size > 1) : rows;

  // Quiet "best in row" cues
  const best = (label: string, i: number) => {
    if (columns.length < 2) return false;
    if (label === "Monthly stipend") {
      const vals = columns.map((c) => c.stipend ?? 0);
      return vals[i] > 0 && vals[i] === Math.max(...vals);
    }
    if (label === "Deadline") {
      const open = columns.map((c) => (daysUntil(c.deadline) >= 0 ? c.deadline : "9999"));
      return open[i] !== "9999" && open[i] === [...open].sort()[0];
    }
    return false;
  };

  return (
    <div>
      <PageHeader
        title="Compare"
        description="Put up to three scholarships or programs side by side."
        actions={
          columns.length > 0 && (
            <>
              <Segmented
                value={onlyDiff ? "diff" : "all"}
                onChange={(v) => setOnlyDiff(v === "diff")}
                options={[
                  { value: "all", label: "All rows" },
                  { value: "diff", label: "Differences" },
                ]}
              />
              <Button variant="ghost" onClick={() => setCompare([])}>
                Clear
              </Button>
            </>
          )
        }
      />

      {columns.length === 0 ? (
        <EmptyState
          icon={<Columns3 />}
          title="Nothing to compare yet"
          description="Add scholarships or programs using the compare button on any listing, or pick them here."
          action={
            <Button variant="primary" onClick={() => setPicking(true)}>
              <Plus /> Choose items
            </Button>
          }
        />
      ) : (
        <div className="thin-scroll -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[720px] table-fixed border-collapse text-[13px]">
            <colgroup>
              <col className="w-[180px]" />
              {columns.map((c) => (
                <col key={c.item.id} />
              ))}
              {columns.length < 3 && <col />}
            </colgroup>
            <thead>
              <tr>
                <th />
                {columns.map((c) => (
                  <th key={c.item.id} className="px-4 pb-5 text-left align-top font-normal">
                    <div className="flex items-start justify-between gap-2">
                      <Flag code={c.country} size={22} />
                      <IconButton label="Remove" onClick={() => toggleCompare(c.item)} className="-mr-2 -mt-1.5 size-7">
                        <X />
                      </IconButton>
                    </div>
                    <div className="t-eyebrow mt-3 !text-[10.5px]">{c.item.kind}</div>
                    <Link href={c.href} className="mt-1 block text-[15px] font-medium leading-snug hover:text-accent">
                      {c.title}
                    </Link>
                    <div className="mt-1 text-[12.5px] text-fg-muted">{c.sub}</div>
                  </th>
                ))}
                {columns.length < 3 && (
                  <th className="px-4 pb-5 align-top">
                    <button
                      onClick={() => setPicking(true)}
                      className="flex h-full min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line text-[13px] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                    >
                      <Plus className="size-4" /> Add item
                    </button>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => (
                <tr key={r.label} className="border-t border-line align-top">
                  <th className="py-3.5 pr-4 text-left text-[12.5px] font-normal text-fg-muted">{r.label}</th>
                  {r.values.map((v, i) => (
                    <td key={i} className={cn("px-4 py-3.5 leading-relaxed", best(r.label, i) && "text-accent")}>
                      {v || <span className="text-fg-faint">—</span>}
                    </td>
                  ))}
                  {columns.length < 3 && <td />}
                </tr>
              ))}
            </tbody>
          </table>
          {onlyDiff && visibleRows.length === 0 && <p className="py-8 text-center text-[13px] text-fg-muted">These items are identical in every category.</p>}
        </div>
      )}

      {picking && <PickModal onClose={() => setPicking(false)} />}
    </div>
  );
}

function PickModal({ onClose }: { onClose: () => void }) {
  const { scholarships, programs, compare, toggleCompare } = useStore();
  const { uniById } = useLookups();
  const [kind, setKind] = useState<"scholarship" | "program">("scholarship");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.toLowerCase();
    return kind === "scholarship"
      ? scholarships.filter((s) => s.name.toLowerCase().includes(t)).map((s) => ({ id: s.id, title: s.name, sub: s.provider, country: s.countryCode }))
      : programs
          .filter((p) => (p.name + " " + uniById[p.universityId]?.name).toLowerCase().includes(t))
          .map((p) => ({ id: p.id, title: p.name, sub: uniById[p.universityId]?.name ?? "", country: uniById[p.universityId]?.countryCode }));
  }, [kind, q, scholarships, programs, uniById]);

  return (
    <Modal open onClose={onClose} title="Add to comparison" description={`${compare.length} of 3 selected`} footer={<Button variant="primary" onClick={onClose}>Done</Button>}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: "scholarship", label: "Scholarships" },
            { value: "program", label: "Programs" },
          ]}
        />
        <SearchInput value={q} onChange={setQ} className="flex-1" placeholder="Filter" />
      </div>
      <ul className="max-h-[360px] divide-y divide-line overflow-y-auto">
        {list.map((x) => {
          const on = compare.some((c) => c.kind === kind && c.id === x.id);
          return (
            <li key={x.id}>
              <label className="flex cursor-pointer items-center gap-3 py-2.5">
                <input type="checkbox" className="accent-[var(--accent)]" checked={on} onChange={() => toggleCompare({ kind, id: x.id })} />
                <Flag code={x.country} size={16} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px]">{x.title}</span>
                  <span className="block truncate text-[12px] text-fg-muted">{x.sub}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
