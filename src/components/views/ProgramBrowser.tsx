"use client";

import { PeekLink } from "./Peek";
import { EditedMark } from "@/components/ui/Provenance";
import { useMemo, useState } from "react";
import { BookOpen, Check, Columns3, Download, Plus } from "lucide-react";
import { Badge, Button, EmptyState, Flag, SaveToggle, SearchInput } from "@/components/ui/primitives";
import { FilterBar, ResultCount, SortHeader, useFilters } from "./FilterBar";
import { ProgramForm } from "@/components/forms/RecordForms";
import { useLookups, useStore } from "@/lib/store";
import { exportCSV } from "@/lib/export";
import { cn, countryName, daysUntil, formatDate, formatDuration } from "@/lib/utils";

type SortKey = "name" | "tuition" | "deadline" | "university";

const TUITION_BANDS = [
  { value: "0", label: "Tuition-free", test: (n: number) => n === 0 },
  { value: "5000", label: "Up to €5,000", test: (n: number) => n <= 5000 },
  { value: "15000", label: "Up to €15,000", test: (n: number) => n <= 15000 },
  { value: "25000", label: "Up to €25,000", test: (n: number) => n <= 25000 },
  { value: "high", label: "Above €25,000", test: (n: number) => n > 25000 },
];

export function ProgramBrowser({ countryCode, universityId }: { countryCode?: string; universityId?: string }) {
  const { programs, universities, isSaved, toggleSaved, compare, toggleCompare, toast } = useStore();
  const { uniById } = useLookups();
  const [q, setQ] = useState("");
  const [f, setF] = useFilters();
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "deadline", dir: "asc" });
  const [adding, setAdding] = useState(false);

  const base = useMemo(
    () =>
      programs.filter((p) => {
        if (universityId) return p.universityId === universityId;
        if (countryCode) return uniById[p.universityId]?.countryCode === countryCode;
        return true;
      }),
    [programs, countryCode, universityId, uniById],
  );

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = base.filter((p) => {
      const u = uniById[p.universityId];
      if (t && ![p.name, p.faculty, u?.name ?? "", u?.city ?? ""].some((x) => x.toLowerCase().includes(t))) return false;
      if (f.country && u?.countryCode !== f.country) return false;
      if (f.degree && p.degree !== f.degree) return false;
      if (f.language && p.language !== f.language) return false;
      if (f.university && p.universityId !== f.university) return false;
      if (f.intake && p.intake !== f.intake) return false;
      if (f.tuition && !TUITION_BANDS.find((b) => b.value === f.tuition)?.test(p.tuitionPerYear)) return false;
      if (f.saved && !isSaved("programs", p.id)) return false;
      return true;
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      switch (sort.key) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "tuition":
          return (a.tuitionPerYear - b.tuitionPerYear) * dir;
        case "university":
          return (uniById[a.universityId]?.name ?? "").localeCompare(uniById[b.universityId]?.name ?? "") * dir;
        default:
          return a.deadline.localeCompare(b.deadline) * dir;
      }
    });
  }, [base, q, f, sort, uniById, isSaved]);

  const sortBy = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  const countryOptions = [...new Set(universities.map((u) => u.countryCode))]
    .sort((a, b) => countryName(a).localeCompare(countryName(b)))
    .map((c) => ({ value: c, label: countryName(c) }));
  const uniOptions = universities
    .filter((u) => !countryCode || u.countryCode === countryCode)
    .filter((u) => !f.country || u.countryCode === f.country)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((u) => ({ value: u.id, label: u.name }));

  return (
    <div>
      <FilterBar
        search={<SearchInput value={q} onChange={setQ} placeholder="Search programs" />}
        values={f}
        onChange={setF}
        filters={[
          { key: "country", label: "Country", options: countryOptions, hidden: !!countryCode || !!universityId },
          { key: "degree", label: "Degree", options: ["Bachelor", "Master", "PhD"].map((x) => ({ value: x, label: x })) },
          { key: "language", label: "Language", options: [...new Set(programs.map((p) => p.language))].sort().map((x) => ({ value: x, label: x })) },
          { key: "university", label: "University", options: uniOptions, hidden: !!universityId },
          { key: "tuition", label: "Tuition", options: TUITION_BANDS.map(({ value, label }) => ({ value, label })) },
          { key: "intake", label: "Intake", options: ["Fall", "Winter", "Spring", "Summer"].map((x) => ({ value: x, label: x })) },
          { key: "saved", label: "All items", options: [{ value: "1", label: "Saved only" }] },
        ]}
        trailing={
          <>
            <Button
              title="Download the rows shown as CSV"
              onClick={() => {
                exportCSV(`scholarmap-programs${countryCode ? "-" + countryCode.toLowerCase() : ""}.csv`, rows, [
              { header: "Program", value: (p) => p.name },
              { header: "University", value: (p) => uniById[p.universityId]?.name },
              { header: "Country", value: (p) => countryName(uniById[p.universityId]?.countryCode) },
              { header: "City", value: (p) => uniById[p.universityId]?.city },
              { header: "Degree", value: (p) => p.degree },
              { header: "Faculty", value: (p) => p.faculty },
              { header: "Language", value: (p) => p.language },
              { header: "Duration (months)", value: (p) => p.durationMonths },
              { header: "Tuition", value: (p) => p.tuitionLabel },
              { header: "Tuition (EUR/year approx.)", value: (p) => p.tuitionPerYear },
              { header: "Intake", value: (p) => p.intake },
              { header: "Deadline", value: (p) => p.deadline },
              { header: "IELTS", value: (p) => p.ielts },
              { header: "TOEFL", value: (p) => p.toefl },
              { header: "Academic requirements", value: (p) => p.academic },
              { header: "Saved", value: (p) => (isSaved("programs", p.id) ? "Yes" : "") },
              { header: "URL", value: (p) => p.url },
              { header: "Notes", value: (p) => p.notes },
            ]);
                toast(`Exported ${rows.length} programs`);
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

      <ResultCount shown={rows.length} total={base.length} noun="programs" />

      {rows.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title={base.length === 0 ? "No programs recorded yet" : "No programs match these filters"}
          description={base.length === 0 ? "Programs you add will appear here with their requirements and deadlines." : "Try clearing a filter."}
          action={
            base.length === 0 && (
              <Button onClick={() => setAdding(true)}>
                <Plus /> Add program
              </Button>
            )
          }
        />
      ) : (
        <div className="thin-scroll -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[820px] border-collapse text-[13px]">
            <thead>
              <tr className="border-y border-line text-left text-[12px] text-fg-muted [&_th]:whitespace-nowrap">
                <th className="py-2.5 pr-4 font-normal">
                  <SortHeader label="Program" active={sort.key === "name"} dir={sort.dir} onClick={() => sortBy("name")} />
                </th>
                {!universityId && (
                  <th className="py-2.5 pr-4 font-normal">
                    <SortHeader label="University" active={sort.key === "university"} dir={sort.dir} onClick={() => sortBy("university")} />
                  </th>
                )}
                <th className="py-2.5 pr-4 font-normal">Degree</th>
                <th className="py-2.5 pr-4 font-normal">Language</th>
                <th className="py-2.5 pr-4 font-normal">
                  <SortHeader label="Tuition / yr" active={sort.key === "tuition"} dir={sort.dir} onClick={() => sortBy("tuition")} />
                </th>
                <th className="py-2.5 pr-4 font-normal">
                  <SortHeader label="Deadline" active={sort.key === "deadline"} dir={sort.dir} onClick={() => sortBy("deadline")} />
                </th>
                <th className="w-[72px] py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const u = uniById[p.universityId];
                const closed = daysUntil(p.deadline) < 0;
                const inCompare = compare.some((c) => c.kind === "program" && c.id === p.id);
                return (
                  <tr key={p.id} className="group border-b border-line align-top transition-colors hover:bg-subtle/70">
                    <td className="py-3 pr-4">
                      <PeekLink kind="program" id={p.id} className="font-medium group-hover:text-accent">
                        {p.name}
                      </PeekLink>
                      <div className="mt-0.5 flex items-center gap-2 text-[12px] text-fg-muted">
                        {formatDuration(p.durationMonths)} · {p.intake} intake
                        <EditedMark id={p.id} editedAt={p.editedAt} />
                      </div>
                    </td>
                    {!universityId && (
                      <td className="py-3 pr-4">
                        <PeekLink kind="university" id={p.universityId} className="hover:text-accent">
                          {u?.name}
                        </PeekLink>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-fg-muted">
                          <Flag code={u?.countryCode} size={13} /> {u?.city}
                        </div>
                      </td>
                    )}
                    <td className="py-3 pr-4">
                      <Badge tone="outline">{p.degree}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-fg-muted">{p.language}</td>
                    <td className="tabular whitespace-nowrap py-3 pr-4">{p.tuitionPerYear === 0 ? <span className="text-success">Free</span> : `€${p.tuitionPerYear.toLocaleString("en-GB")}`}</td>
                    <td className={cn("tabular whitespace-nowrap py-3 pr-4", closed && "text-fg-faint line-through")}>{formatDate(p.deadline)}</td>
                    <td className="py-2">
                      <div className="flex justify-end">
                        <button
                          onClick={() => toggleCompare({ kind: "program", id: p.id })}
                          title={inCompare ? "Remove from comparison" : "Add to comparison"}
                          className={cn("flex size-8 items-center justify-center rounded-md hover:bg-muted", inCompare ? "text-accent" : "text-fg-faint hover:text-fg")}
                        >
                          {inCompare ? <Check className="size-4" /> : <Columns3 className="size-4" />}
                        </button>
                        <SaveToggle saved={isSaved("programs", p.id)} onToggle={() => toggleSaved("programs", p.id)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {adding && <ProgramForm open onClose={() => setAdding(false)} defaultUniversity={universityId ?? uniOptions[0]?.value} />}
    </div>
  );
}
