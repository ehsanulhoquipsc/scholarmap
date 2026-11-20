"use client";

import { PeekLink } from "./Peek";
import { EditedMark } from "@/components/ui/Provenance";
import { useMemo, useState } from "react";
import { Building2, LayoutList, Download, Plus, Rows3 } from "lucide-react";
import { Button, EmptyState, Flag, SaveToggle, SearchInput, Segmented } from "@/components/ui/primitives";
import { FilterBar, ResultCount, useFilters } from "./FilterBar";
import { UniversityForm } from "@/components/forms/RecordForms";
import { useStore } from "@/lib/store";
import { exportCSV } from "@/lib/export";
import { countryName } from "@/lib/utils";

export function UniversityBrowser({ countryCode }: { countryCode?: string }) {
  const { universities, programs, scholarships, isSaved, toggleSaved, toast } = useStore();
  const [q, setQ] = useState("");
  const [f, setF] = useFilters();
  const [sort, setSort] = useState<"name" | "programs" | "founded">("name");
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [adding, setAdding] = useState(false);

  const counts = useMemo(() => {
    const m: Record<string, { programs: number; scholarships: number }> = {};
    programs.forEach((p) => ((m[p.universityId] ??= { programs: 0, scholarships: 0 }).programs++));
    scholarships.forEach((s) => s.universityId && ((m[s.universityId] ??= { programs: 0, scholarships: 0 }).scholarships++));
    return m;
  }, [programs, scholarships]);

  const base = useMemo(() => (countryCode ? universities.filter((u) => u.countryCode === countryCode) : universities), [universities, countryCode]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return base
      .filter((u) => {
        if (t && ![u.name, u.city, countryName(u.countryCode)].some((x) => x.toLowerCase().includes(t))) return false;
        if (f.country && u.countryCode !== f.country) return false;
        if (f.type && u.type !== f.type) return false;
        if (f.saved && !isSaved("universities", u.id)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "programs") return (counts[b.id]?.programs ?? 0) - (counts[a.id]?.programs ?? 0);
        if (sort === "founded") return (a.founded ?? 9999) - (b.founded ?? 9999);
        return a.name.localeCompare(b.name);
      });
  }, [base, q, f, sort, counts, isSaved]);

  const countryOptions = [...new Set(universities.map((u) => u.countryCode))]
    .sort((a, b) => countryName(a).localeCompare(countryName(b)))
    .map((c) => ({ value: c, label: countryName(c) }));

  return (
    <div>
      <FilterBar
        search={<SearchInput value={q} onChange={setQ} placeholder="Search universities or cities" />}
        values={f}
        onChange={setF}
        filters={[
          { key: "country", label: "Country", options: countryOptions, hidden: !!countryCode },
          { key: "type", label: "Type", options: ["Public", "Private", "Technical", "Research institute"].map((x) => ({ value: x, label: x })) },
          { key: "saved", label: "All items", options: [{ value: "1", label: "Saved only" }] },
        ]}
        trailing={
          <>
            <Button
              title="Download the rows shown as CSV"
              onClick={() => {
                exportCSV(`scholarmap-universities${countryCode ? "-" + countryCode.toLowerCase() : ""}.csv`, rows, [
              { header: "University", value: (u) => u.name },
              { header: "Country", value: (u) => countryName(u.countryCode) },
              { header: "City", value: (u) => u.city },
              { header: "Type", value: (u) => u.type },
              { header: "Founded", value: (u) => u.founded },
              { header: "Programs", value: (u) => counts[u.id]?.programs ?? 0 },
              { header: "Saved", value: (u) => (isSaved("universities", u.id) ? "Yes" : "") },
              { header: "Website", value: (u) => u.website },
              { header: "Application portal", value: (u) => u.portal },
              { header: "Notes", value: (u) => u.notes },
            ]);
                toast(`Exported ${rows.length} universities`);
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

      <div className="mb-2 flex items-center justify-between gap-3">
        <ResultCount shown={rows.length} total={base.length} noun="universities" />
        <div className="flex items-center gap-2">
          <Segmented
            value={sort}
            onChange={setSort}
            options={[
              { value: "name", label: "A–Z" },
              { value: "programs", label: "Programs" },
              { value: "founded", label: "Oldest" },
            ]}
          />
          <Segmented
            className="hidden sm:inline-flex"
            value={layout}
            onChange={setLayout}
            options={[
              { value: "list", label: <Rows3 />, title: "List" },
              { value: "grid", label: <LayoutList />, title: "Grid" },
            ]}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Building2 />}
          title={base.length === 0 ? "No universities recorded yet" : "No universities match"}
          description={base.length === 0 ? "Start building this country's shortlist by adding a university." : "Try a different search or clear the filters."}
          action={
            base.length === 0 && (
              <Button onClick={() => setAdding(true)}>
                <Plus /> Add university
              </Button>
            )
          }
        />
      ) : layout === "list" ? (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((u) => (
            <li key={u.id} className="group relative flex items-center gap-4 py-3.5">
              <Flag code={u.countryCode} size={22} />
              <div className="min-w-0 flex-1">
                <PeekLink kind="university" id={u.id} className="text-[14px] font-medium after:absolute after:inset-0 group-hover:text-accent">
                  {u.name}
                </PeekLink>
                <EditedMark id={u.id} editedAt={u.editedAt} />
                <div className="mt-0.5 truncate text-[12.5px] text-fg-muted">
                  {u.city}, {countryName(u.countryCode)} · {u.type}
                  {u.founded ? ` · Est. ${u.founded}` : ""}
                </div>
              </div>
              <div className="hidden w-[180px] gap-6 text-[12.5px] text-fg-muted md:flex">
                <span className="tabular">{counts[u.id]?.programs ?? 0} programs</span>
                <span className="tabular">{counts[u.id]?.scholarships ?? 0} funding</span>
              </div>
              <div className="relative z-10">
                <SaveToggle saved={isSaved("universities", u.id)} onToggle={() => toggleSaved("universities", u.id)} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((u) => (
            <div key={u.id} className="group relative flex flex-col bg-bg p-5 transition-colors hover:bg-subtle">
              <div className="flex items-start justify-between">
                <Flag code={u.countryCode} size={22} />
                <div className="relative z-10 -mr-2 -mt-2">
                  <SaveToggle saved={isSaved("universities", u.id)} onToggle={() => toggleSaved("universities", u.id)} />
                </div>
              </div>
              <PeekLink kind="university" id={u.id} className="mt-4 text-[14px] font-medium leading-snug after:absolute after:inset-0">
                {u.name}
              </PeekLink>
              <div className="mt-1 text-[12.5px] text-fg-muted">
                {u.city} · {u.type}
              </div>
              <p className="mt-3 line-clamp-2 text-[12.5px] text-fg-muted">{u.description}</p>
              <div className="mt-auto pt-4 text-[12px] text-fg-faint tabular">{counts[u.id]?.programs ?? 0} programs</div>
            </div>
          ))}
        </div>
      )}

      {adding && <UniversityForm open onClose={() => setAdding(false)} defaultCountry={countryCode} />}
    </div>
  );
}
