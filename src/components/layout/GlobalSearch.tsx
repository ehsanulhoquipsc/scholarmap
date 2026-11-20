"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { BookOpen, Building2, CornerDownLeft, GraduationCap, NotebookPen, Search } from "lucide-react";
import { Flag } from "@/components/ui/primitives";
import { useLookups, useStore } from "@/lib/store";
import { allCountryCodes, cn, countryName } from "@/lib/utils";
import { countryByCode } from "@/data/countries";

type Result = { key: string; group: string; title: string; meta: string; href: string; icon: React.ReactNode };

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const { universities, programs, scholarships, notes } = useStore();
  const { uniById } = useLookups();

  const results = useMemo<Result[]>(() => {
    const t = q.trim().toLowerCase();
    if (!t) {
      return Object.values(countryByCode)
        .slice(0, 5)
        .map((c) => ({ key: c.code, group: "Suggested countries", title: c.name, meta: c.region, href: `/countries/${c.code}`, icon: <Flag code={c.code} size={18} /> }));
    }
    const has = (...s: (string | undefined)[]) => s.some((x) => x?.toLowerCase().includes(t));
    const out: Result[] = [];
    allCountryCodes()
      .filter((c) => has(countryName(c)))
      .sort((a, b) => (countryByCode[a] ? 0 : 1) - (countryByCode[b] ? 0 : 1))
      .slice(0, 4)
      .forEach((c) => out.push({ key: "c" + c, group: "Countries", title: countryName(c), meta: countryByCode[c] ? countryByCode[c].region : "Not yet researched", href: `/countries/${c}`, icon: <Flag code={c} size={18} /> }));
    universities
      .filter((u) => has(u.name, u.city, countryName(u.countryCode)))
      .slice(0, 5)
      .forEach((u) => out.push({ key: "u" + u.id, group: "Universities", title: u.name, meta: `${u.city}, ${countryName(u.countryCode)}`, href: `/universities/${u.id}`, icon: <Building2 /> }));
    programs
      .filter((p) => has(p.name, p.faculty, uniById[p.universityId]?.name))
      .slice(0, 5)
      .forEach((p) => out.push({ key: "p" + p.id, group: "Programs", title: p.name, meta: uniById[p.universityId]?.name ?? "", href: `/programs/${p.id}`, icon: <BookOpen /> }));
    scholarships
      .filter((s) => has(s.name, s.provider, countryName(s.countryCode)))
      .slice(0, 5)
      .forEach((s) => out.push({ key: "s" + s.id, group: "Scholarships", title: s.name, meta: `${s.provider}`, href: `/scholarships/${s.id}`, icon: <GraduationCap /> }));
    notes
      .filter((n) => has(n.title, n.body))
      .slice(0, 4)
      .forEach((n) => out.push({ key: "n" + n.id, group: "Notes", title: n.title, meta: n.category, href: `/notes?id=${n.id}`, icon: <NotebookPen /> }));
    return out;
  }, [q, universities, programs, scholarships, notes, uniById]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQ("");
    setActive(0);
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const go = (r: Result) => {
    onClose();
    router.push(r.href);
  };

  let lastGroup = "";
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <div className="anim-fade absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="anim-pop relative w-full max-w-[600px] overflow-hidden rounded-xl border border-line bg-bg shadow-pop">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-[17px] text-fg-faint" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              }
              if (e.key === "Enter" && results[active]) go(results[active]);
            }}
            placeholder="Search countries, universities, programs, scholarships and notes"
            className="h-14 flex-1 bg-transparent text-[15px] placeholder:text-fg-faint focus:outline-none"
          />
          <kbd className="rounded border border-line px-1.5 text-[10.5px] text-fg-muted">Esc</kbd>
        </div>
        <div className="thin-scroll max-h-[420px] overflow-y-auto p-1.5">
          {results.length === 0 && <p className="px-3 py-10 text-center text-[13px] text-fg-muted">No results for “{q}”.</p>}
          {results.map((r, i) => {
            const header = r.group !== lastGroup;
            lastGroup = r.group;
            return (
              <div key={r.key}>
                {header && <div className="px-2.5 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-fg-faint">{r.group}</div>}
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left [&_svg]:size-4 [&_svg]:text-fg-faint",
                    i === active && "bg-muted",
                  )}
                >
                  <span className="flex w-[18px] justify-center">{r.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px]">{r.title}</span>
                    <span className="block truncate text-[12px] text-fg-muted">{r.meta}</span>
                  </span>
                  {i === active && <CornerDownLeft className="!size-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
