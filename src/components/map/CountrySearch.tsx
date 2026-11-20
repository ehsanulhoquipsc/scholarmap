"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Flag } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function CountrySearch({
  countries,
  researched,
  onPick,
  placeholder = "Search countries",
}: {
  countries: { code: string; name: string }[];
  researched: Set<string>;
  onPick: (code: string) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term
      ? countries.filter((c) => c.name.toLowerCase().includes(term) || c.code.toLowerCase() === term)
      : countries.filter((c) => researched.has(c.code));
    return list
      .slice()
      .sort((a, b) => {
        const ar = researched.has(a.code) ? 0 : 1;
        const br = researched.has(b.code) ? 0 : 1;
        const as = a.name.toLowerCase().startsWith(term) ? 0 : 1;
        const bs = b.name.toLowerCase().startsWith(term) ? 0 : 1;
        return as - bs || ar - br || a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [q, countries, researched]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const pick = (code: string) => {
    onPick(code);
    setQ("");
    setOpen(false);
    (document.activeElement as HTMLElement)?.blur();
  };

  return (
    <div ref={ref} className="relative" onPointerDown={(e) => e.stopPropagation()}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-fg-faint" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && results[active]) {
            pick(results[active].code);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls="country-search-list"
        aria-label="Search countries"
        className="h-9 w-full rounded-md border border-line bg-bg/95 pl-8 pr-3 text-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur placeholder:text-fg-faint focus:border-accent focus:outline-none"
      />
      {open && results.length > 0 && (
        <div id="country-search-list" role="listbox" className="anim-pop absolute left-0 right-0 top-[calc(100%+6px)] rounded-lg border border-line bg-bg p-1 shadow-pop">
          {!q && <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-fg-faint">Your countries</div>}
          {results.map((c, i) => (
            <button
              key={c.code}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(c.code)}
              className={cn("flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px]", i === active && "bg-muted")}
            >
              <Flag code={c.code} size={18} />
              <span className="flex-1 truncate">{c.name}</span>
              {researched.has(c.code) && <span className="size-1.5 rounded-full bg-accent" />}
            </button>
          ))}
        </div>
      )}
      {open && q && results.length === 0 && (
        <div className="anim-pop absolute left-0 right-0 top-[calc(100%+6px)] rounded-lg border border-line bg-bg px-3 py-3 text-[13px] text-fg-muted shadow-pop">
          No country matches “{q}”.
        </div>
      )}
    </div>
  );
}
