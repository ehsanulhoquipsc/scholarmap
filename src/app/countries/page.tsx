"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Flag, PageHeader, SearchInput, Segmented } from "@/components/ui/primitives";
import { useLookups, useStore } from "@/lib/store";
import { useCountryStats } from "@/lib/derived";
import { countries } from "@/data/countries";
import { allCountryCodes, cn, countryName } from "@/lib/utils";

export default function CountriesPage() {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"researched" | "favourites" | "all">("researched");
  const stats = useCountryStats();

  // Deep link from the "View saved" toast: /countries?scope=favourites
  useEffect(() => {
    const sc = new URLSearchParams(window.location.search).get("scope");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sc === "favourites" || sc === "all") setScope(sc);
  }, []);
  const { researched } = useLookups();
  const { saved } = useStore();

  const list = useMemo(() => {
    let codes: string[];
    if (scope === "all") codes = allCountryCodes();
    else if (scope === "favourites") codes = saved.countries;
    else codes = [...new Set([...countries.map((c) => c.code), ...researched])];
    const t = q.trim().toLowerCase();
    return codes.filter((c) => !t || countryName(c).toLowerCase().includes(t)).sort((a, b) => countryName(a).localeCompare(countryName(b)));
  }, [scope, q, saved.countries, researched]);

  const info = Object.fromEntries(countries.map((c) => [c.code, c]));

  return (
    <div>
      <PageHeader title="Countries" description="Every country has its own workspace for universities, programs, funding and notes." />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search countries" className="w-full sm:w-[280px]" />
        <Segmented
          value={scope}
          onChange={setScope}
          options={[
            { value: "researched", label: "Researched" },
            { value: "favourites", label: "Favourites" },
            { value: "all", label: "All countries" },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <p className="py-16 text-center text-[13px] text-fg-muted">{scope === "favourites" ? "No favourite countries yet. Star a country from its workspace." : "No countries match."}</p>
      ) : (
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const s = stats[c];
            return (
              <Link key={c} href={`/countries/${c}`} className="group flex flex-col bg-bg p-5 transition-colors hover:bg-subtle">
                <div className="flex items-center gap-3">
                  <Flag code={c} size={24} />
                  <span className="flex-1 text-[14px] font-medium group-hover:text-accent">{countryName(c)}</span>
                  {saved.countries.includes(c) && <Star className="size-3.5 fill-accent text-accent" />}
                </div>
                {info[c] ? (
                  <>
                    <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-fg-muted">{info[c].summary}</p>
                    <div className="mt-4 flex gap-4 text-[12px] text-fg-muted tabular">
                      <span>{s?.universities ?? 0} universities</span>
                      <span>{s?.programs ?? 0} programs</span>
                      <span>{s?.scholarships ?? 0} scholarships</span>
                    </div>
                  </>
                ) : (
                  <p className={cn("mt-3 text-[12.5px] text-fg-faint")}>Not yet researched</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
