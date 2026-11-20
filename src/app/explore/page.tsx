"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowRight, Star, X } from "lucide-react";
import { WorldMap } from "@/components/map/WorldMap";
import { Badge, Button, Flag, IconButton, Segmented } from "@/components/ui/primitives";
import { useLookups, useStore } from "@/lib/store";
import { describeCountry, useCountryStats } from "@/lib/derived";
import { countryByCode, countries } from "@/data/countries";
import { cn, countryName, relativeDeadline, windowStatus } from "@/lib/utils";

const REGIONS = ["All", "Europe", "Asia", "Americas", "Oceania"] as const;

export default function ExplorePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("All");
  const { researched } = useLookups();
  const stats = useCountryStats();

  const describe = useCallback((code: string) => describeCountry(stats[code]), [stats]);
  const onSelect = useCallback((code: string) => setSelected(code), []);

  const list = countries.filter((c) => {
    if (region === "All") return true;
    if (region === "Americas") return c.region === "North America" || c.region === "South America";
    return c.region.startsWith(region);
  });

  return (
    <div className="flex h-[calc(100dvh-56px-64px-env(safe-area-inset-bottom))] flex-col lg:h-[calc(100dvh-56px)] lg:flex-row">
      <div className="relative min-h-[360px] flex-1 p-3 sm:p-4">
        <WorldMap researched={researched} selected={selected} onSelect={onSelect} describe={describe} focus={focus} wheel="always" fill />
      </div>

      <aside className="thin-scroll flex max-h-[50dvh] w-full shrink-0 flex-col overflow-y-auto border-t border-line bg-bg lg:max-h-none lg:w-[380px] lg:border-l lg:border-t-0">
        {selected ? (
          <CountryPreview code={selected} onClose={() => setSelected(null)} />
        ) : (
          <div className="p-6">
            <h1 className="t-h1">Explore World</h1>
            <p className="mt-1.5 text-[13.5px] text-fg-muted">Select any country on the map, or start from one you have already researched.</p>
            <Segmented className="mt-6" value={region} onChange={setRegion} options={REGIONS.map((r) => ({ value: r, label: r }))} />
            <ul className="-mx-2 mt-4">
              {list.map((c) => (
                <li key={c.code}>
                  <button
                    onClick={() => {
                      setSelected(c.code);
                      setFocus(c.code);
                    }}
                    className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-subtle"
                  >
                    <Flag code={c.code} size={22} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px]">{c.name}</span>
                      <span className="block text-[12px] text-fg-muted">{describeCountry(stats[c.code])}</span>
                    </span>
                    {researched.has(c.code) && <span className="size-1.5 rounded-full bg-accent" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

function CountryPreview({ code, onClose }: { code: string; onClose: () => void }) {
  const info = countryByCode[code];
  const stats = useCountryStats()[code];
  const { scholarships, isSaved, toggleSaved } = useStore();
  const fav = isSaved("countries", code);
  const funding = scholarships
    .filter((s) => s.countryCode === code && windowStatus(s.opens, s.deadline) !== "Closed")
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 3);

  return (
    <div key={code} className="anim-fade p-6">
      <div className="flex items-start justify-between">
        <Flag code={code} size={36} />
        <div className="-mr-2 -mt-1 flex">
          <IconButton
            label={fav ? "Remove from favourites" : "Add to favourites"}
            onClick={() => {
              toggleSaved("countries", code);
            }}
            className={cn(fav && "text-accent")}
          >
            <Star className={cn(fav && "fill-current")} />
          </IconButton>
          <IconButton label="Close" onClick={onClose}>
            <X />
          </IconButton>
        </div>
      </div>
      <h2 className="t-h1 mt-4">{countryName(code)}</h2>
      {info ? (
        <>
          <p className="mt-1 text-[13px] text-fg-muted">
            {info.capital} · {info.currency}
          </p>
          <p className="mt-4 text-[13.5px] leading-relaxed">{info.summary}</p>
          <dl className="mt-6 grid grid-cols-3 border-y border-line py-4">
            {[
              ["Universities", stats?.universities ?? 0],
              ["Programs", stats?.programs ?? 0],
              ["Scholarships", stats?.scholarships ?? 0],
            ].map(([l, v]) => (
              <div key={l as string}>
                <dd className="tabular text-[20px] leading-none">{v}</dd>
                <dt className="mt-1.5 text-[12px] text-fg-muted">{l}</dt>
              </div>
            ))}
          </dl>
          <div className="mt-6">
            <div className="t-eyebrow mb-2">Teaching languages</div>
            <div className="flex flex-wrap gap-1.5">
              {info.languages.map((l) => (
                <Badge key={l} tone="outline">{l}</Badge>
              ))}
            </div>
          </div>
          {funding.length > 0 && (
            <div className="mt-6">
              <div className="t-eyebrow mb-2">Open funding</div>
              <ul className="space-y-2.5">
                {funding.map((s) => (
                  <li key={s.id}>
                    <Link href={`/scholarships/${s.id}`} className="group block">
                      <span className="block text-[13px] group-hover:text-accent">{s.name}</span>
                      <span className="text-[12px] text-fg-muted">
                        {s.coverage} · {relativeDeadline(s.deadline)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="mt-4 text-[13.5px] text-fg-muted">
          You haven’t researched {countryName(code)} yet. Open its workspace to add universities, programs, scholarships and notes.
        </p>
      )}
      <Link href={`/countries/${code}`} className="mt-8 block">
        <Button variant="primary" className="w-full">
          Open workspace <ArrowRight />
        </Button>
      </Link>
    </div>
  );
}
