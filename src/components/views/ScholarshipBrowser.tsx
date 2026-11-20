"use client";

import { PeekLink } from "./Peek";
import { EditedMark } from "@/components/ui/Provenance";
import { useMemo, useState } from "react";
import { Check, Columns3, GraduationCap, Download, Plus } from "lucide-react";
import { Badge, Button, EmptyState, Flag, SaveToggle, SearchInput, Segmented, StatusDot } from "@/components/ui/primitives";
import { FilterBar, ResultCount, useFilters } from "./FilterBar";
import { ScholarshipForm } from "@/components/forms/RecordForms";
import { useStore } from "@/lib/store";
import { exportCSV } from "@/lib/export";
import { cn, countryName, formatDate, relativeDeadline, windowStatus } from "@/lib/utils";
import type { Scholarship } from "@/lib/types";

type Sort = "deadline" | "stipend" | "name";

export function ScholarshipBrowser({ countryCode, compact = false }: { countryCode?: string; compact?: boolean }) {
  const { scholarships, isSaved, toggleSaved, toast } = useStore();
  const [q, setQ] = useState("");
  const [f, setF] = useFilters();
  const [sort, setSort] = useState<Sort>("deadline");
  const [adding, setAdding] = useState(false);

  const base = useMemo(() => (countryCode ? scholarships.filter((s) => s.countryCode === countryCode) : scholarships), [scholarships, countryCode]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = base.filter((s) => {
      if (t && ![s.name, s.provider, countryName(s.countryCode), s.type].some((x) => x.toLowerCase().includes(t))) return false;
      if (f.country && s.countryCode !== f.country) return false;
      if (f.degree && !s.degrees.includes(f.degree as never)) return false;
      if (f.source && s.source !== f.source) return false;
      if (f.coverage && s.coverage !== f.coverage) return false;
      if (f.language && !s.languages.includes(f.language)) return false;
      if (f.status && windowStatus(s.opens, s.deadline) !== f.status) return false;
      if (f.saved && !isSaved("scholarships", s.id)) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "stipend") return b.stipendMonthly - a.stipendMonthly;
      // deadline: open/upcoming first by date, closed last
      const ac = windowStatus(a.opens, a.deadline) === "Closed" ? 1 : 0;
      const bc = windowStatus(b.opens, b.deadline) === "Closed" ? 1 : 0;
      return ac - bc || a.deadline.localeCompare(b.deadline);
    });
  }, [base, q, f, sort, isSaved]);

  const countryOptions = [...new Set(scholarships.map((s) => s.countryCode))]
    .sort((a, b) => countryName(a).localeCompare(countryName(b)))
    .map((c) => ({ value: c, label: countryName(c) }));
  const languageOptions = [...new Set(scholarships.flatMap((s) => s.languages))].sort().map((l) => ({ value: l, label: l }));

  return (
    <div>
      <FilterBar
        search={<SearchInput value={q} onChange={setQ} placeholder="Search scholarships" />}
        values={f}
        onChange={setF}
        filters={[
          { key: "country", label: "Country", options: countryOptions, hidden: !!countryCode },
          { key: "degree", label: "Degree", options: ["Bachelor", "Master", "PhD"].map((x) => ({ value: x, label: x })) },
          { key: "source", label: "Funding source", options: ["Government", "University", "Foundation"].map((x) => ({ value: x, label: x })) },
          { key: "coverage", label: "Coverage", options: ["Fully funded", "Partially funded"].map((x) => ({ value: x, label: x })) },
          { key: "language", label: "Language", options: languageOptions, hidden: compact },
          { key: "status", label: "Status", options: ["Open", "Upcoming", "Closed"].map((x) => ({ value: x, label: x })) },
          { key: "saved", label: "All items", options: [{ value: "1", label: "Saved only" }] },
        ]}
        trailing={
          <>
            <Button
              title="Download the rows shown as CSV"
              onClick={() => {
                exportCSV(`scholarmap-scholarships${countryCode ? "-" + countryCode.toLowerCase() : ""}.csv`, filtered, [
              { header: "Scholarship", value: (s) => s.name },
              { header: "Provider", value: (s) => s.provider },
              { header: "Country", value: (s) => countryName(s.countryCode) },
              { header: "Funding source", value: (s) => s.source },
              { header: "Coverage", value: (s) => s.coverage },
              { header: "Type", value: (s) => s.type },
              { header: "Degree levels", value: (s) => s.degrees.join("; ") },
              { header: "Eligible nationalities", value: (s) => s.nationalities },
              { header: "Tuition", value: (s) => s.tuition },
              { header: "Stipend", value: (s) => s.stipend },
              { header: "Stipend (EUR/month approx.)", value: (s) => s.stipendMonthly || "" },
              { header: "Accommodation", value: (s) => s.accommodation },
              { header: "Travel", value: (s) => s.travel },
              { header: "Language requirements", value: (s) => s.languageReq },
              { header: "Academic requirements", value: (s) => s.academicReq },
              { header: "Opens", value: (s) => s.opens },
              { header: "Deadline", value: (s) => s.deadline },
              { header: "Status", value: (s) => windowStatus(s.opens, s.deadline) },
              { header: "Saved", value: (s) => (isSaved("scholarships", s.id) ? "Yes" : "") },
              { header: "URL", value: (s) => s.url },
              { header: "Notes", value: (s) => s.notes },
            ]);
                toast(`Exported ${filtered.length} scholarships`);
              }}
            >
              <Download /> CSV
            </Button>
            <Button onClick={() => setAdding(true)}>
              <Plus /> Add
            </Button>
          </>
        }
      />

      <div className="mb-2 flex items-center justify-between">
        <ResultCount shown={filtered.length} total={base.length} noun="scholarships" />
        <Segmented
          value={sort}
          onChange={setSort}
          options={[
            { value: "deadline", label: "Deadline" },
            { value: "stipend", label: "Stipend" },
            { value: "name", label: "A–Z" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<GraduationCap />}
          title={base.length === 0 ? "No scholarships recorded yet" : "No scholarships match these filters"}
          description={base.length === 0 ? "Add government or university funding you find for this country." : "Try removing a filter or searching for something broader."}
          action={
            base.length === 0 && (
              <Button onClick={() => setAdding(true)}>
                <Plus /> Add scholarship
              </Button>
            )
          }
        />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {filtered.map((s) => (
            <ScholarshipRow key={s.id} s={s} saved={isSaved("scholarships", s.id)} onSave={() => toggleSaved("scholarships", s.id)} />
          ))}
        </ul>
      )}

      {adding && <ScholarshipForm open onClose={() => setAdding(false)} defaultCountry={countryCode} />}
    </div>
  );
}

export function ScholarshipRow({ s, saved, onSave }: { s: Scholarship; saved: boolean; onSave: () => void }) {
  const { compare, toggleCompare } = useStore();
  const status = windowStatus(s.opens, s.deadline);
  const inCompare = compare.some((c) => c.kind === "scholarship" && c.id === s.id);
  return (
    <li className="group relative flex flex-col gap-3 py-4 transition-colors sm:flex-row sm:items-center sm:gap-6">
      <div className="min-w-0 flex-1">
        <PeekLink kind="scholarship" id={s.id} className="text-[14px] font-medium after:absolute after:inset-0 group-hover:text-accent">
          {s.name}
        </PeekLink>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-fg-muted">
          <span className="flex items-center gap-1.5">
            <Flag code={s.countryCode} size={14} /> {countryName(s.countryCode)}
          </span>
          <span className="text-fg-faint">·</span>
          <span className="truncate">{s.provider}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone={s.coverage === "Fully funded" ? "accent" : "neutral"}>{s.coverage}</Badge>
          <Badge tone="outline">{s.source}</Badge>
          <Badge tone="outline">{s.degrees.join(" · ")}</Badge>
          <EditedMark id={s.id} editedAt={s.editedAt} />
        </div>
      </div>
      <div className="flex items-center gap-6 sm:w-[340px] sm:justify-end">
        <div className="min-w-[110px] text-[12.5px]">
          <div className="text-fg-faint">Stipend</div>
          <div className="tabular">{s.stipendMonthly ? `≈ €${s.stipendMonthly.toLocaleString("en-GB")} / mo` : "—"}</div>
        </div>
        <div className="min-w-[110px] text-[12.5px]">
          <div className="flex items-center gap-1.5 text-fg-faint">
            <StatusDot tone={status === "Open" ? "open" : status === "Upcoming" ? "upcoming" : "closed"} /> {status}
          </div>
          <div className="tabular">{status === "Closed" ? formatDate(s.deadline) : relativeDeadline(s.deadline)}</div>
        </div>
        <div className="relative z-10 ml-auto flex items-center sm:ml-0">
          <button
            onClick={() => toggleCompare({ kind: "scholarship", id: s.id })}
            title={inCompare ? "Remove from comparison" : "Add to comparison"}
            aria-pressed={inCompare}
            className={cn(
              "flex size-8 items-center justify-center rounded-md transition-colors hover:bg-muted",
              inCompare ? "text-accent" : "text-fg-faint hover:text-fg",
            )}
          >
            {inCompare ? <Check className="size-4" /> : <Columns3 className="size-4" />}
          </button>
          <SaveToggle saved={saved} onToggle={onSave} />
        </div>
      </div>
    </li>
  );
}
