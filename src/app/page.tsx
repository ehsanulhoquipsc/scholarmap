"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ArrowRight } from "lucide-react";
import { WorldMap } from "@/components/map/WorldMap";
import { Flag } from "@/components/ui/primitives";
import { useLookups, useStore } from "@/lib/store";
import { describeCountry, useCountryStats } from "@/lib/derived";
import { cn, countryName, daysUntil, formatDate, relativeDeadline } from "@/lib/utils";

export default function OverviewPage() {
  const router = useRouter();
  const { saved, applications, scholarships, notes } = useStore();
  const { researched, uniById } = useLookups();
  const stats = useCountryStats();

  const [selected, setSelected] = useState<string | null>(null);
  // Highlight the chosen country for a beat, then open its workspace
  const onSelect = useCallback(
    (code: string) => {
      setSelected(code);
      setTimeout(() => router.push(`/countries/${code}`), 220);
    },
    [router],
  );
  const describe = useCallback((code: string) => describeCountry(stats[code]), [stats]);

  const inProgress = applications.filter((a) => !["Accepted", "Rejected", "Applied", "Under review"].includes(a.status)).length;

  const deadlines = [
    ...applications
      .filter((a) => !["Applied", "Under review", "Accepted", "Rejected"].includes(a.status))
      .map((a) => ({ key: a.id, title: a.title, sub: a.status, date: a.deadline, href: "/applications", country: a.universityId ? uniById[a.universityId]?.countryCode : undefined })),
    ...scholarships
      .filter((s) => saved.scholarships.includes(s.id))
      .map((s) => ({ key: s.id, title: s.name, sub: s.provider, date: s.deadline, href: `/scholarships/${s.id}`, country: s.countryCode })),
  ]
    .filter((d) => daysUntil(d.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  const myCountries = [...researched].sort((a, b) => countryName(a).localeCompare(countryName(b)));
  const recentNotes = [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);

  return (
    <div>
      <header className="mb-8 max-w-3xl">
        <h1 className="t-display">Explore opportunities around the world.</h1>
        <p className="mt-3 text-[15.5px] text-fg-muted">Discover universities, academic programs and scholarships across countries.</p>
      </header>

      <WorldMap researched={researched} selected={selected} onSelect={onSelect} describe={describe} wheel="modifier" />

      {/* Statistics — a quiet strip, not a wall of cards */}
      <dl className="mt-6 grid grid-cols-2 gap-y-5 border-b border-line pb-7 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Countries explored", value: researched.size, href: "/countries" },
          { label: "Universities saved", value: saved.universities.length, href: "/universities?saved=1" },
          { label: "Programs collected", value: saved.programs.length, href: "/programs?saved=1" },
          { label: "Scholarships discovered", value: saved.scholarships.length, href: "/scholarships?saved=1" },
          { label: "Applications in progress", value: inProgress, href: "/applications" },
        ].map((s, i) => (
          <Link key={s.label} href={s.href} className={cn("group pr-4", i > 0 && "lg:border-l lg:border-line lg:pl-6")}>
            <dd className="tabular text-[26px] font-medium leading-none tracking-[-0.02em]">{s.value}</dd>
            <dt className="mt-2 text-[12.5px] text-fg-muted transition-colors group-hover:text-fg">{s.label}</dt>
          </Link>
        ))}
      </dl>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="t-h2">Upcoming deadlines</h2>
            <Link href="/applications" className="text-[13px] text-fg-muted hover:text-fg">
              View tracker
            </Link>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {deadlines.map((d) => {
              const n = daysUntil(d.date);
              return (
                <li key={d.key}>
                  <Link href={d.href} className="group flex items-center gap-4 py-3">
                    <div className="w-14 shrink-0 text-center">
                      <div className="text-[11px] uppercase tracking-wide text-fg-faint">{formatDate(d.date, { year: false }).split(" ")[1]}</div>
                      <div className="tabular text-[19px] leading-tight">{formatDate(d.date).split(" ")[0]}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] group-hover:text-accent">{d.title}</div>
                      <div className="flex items-center gap-1.5 truncate text-[12.5px] text-fg-muted">
                        {d.country && <Flag code={d.country} size={14} />}
                        {d.sub}
                      </div>
                    </div>
                    <span className={cn("shrink-0 text-[12.5px] tabular", n <= 14 ? "text-danger" : "text-fg-muted")}>{relativeDeadline(d.date)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="space-y-10">
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="t-h2">Your countries</h2>
              <Link href="/countries" className="text-[13px] text-fg-muted hover:text-fg">
                All
              </Link>
            </div>
            <ul className="-mx-2">
              {myCountries.slice(0, 7).map((c) => (
                <li key={c}>
                  <Link href={`/countries/${c}`} className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-subtle">
                    <Flag code={c} size={20} />
                    <span className="flex-1 text-[13.5px]">{countryName(c)}</span>
                    <span className="tabular text-[12px] text-fg-faint">
                      {(stats[c]?.savedUnis ?? 0) + (stats[c]?.savedScholarships ?? 0)} saved
                    </span>
                    <ArrowRight className="size-3.5 text-fg-faint opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="t-h2">Recent notes</h2>
              <Link href="/notes" className="text-[13px] text-fg-muted hover:text-fg">
                Notebook
              </Link>
            </div>
            <ul className="space-y-4">
              {recentNotes.map((n) => (
                <li key={n.id}>
                  <Link href={`/notes?id=${n.id}`} className="group block">
                    <div className="text-[13.5px] group-hover:text-accent">{n.title}</div>
                    <div className="mt-0.5 line-clamp-2 text-[12.5px] text-fg-muted">{n.body}</div>
                    <div className="mt-1 text-[11.5px] text-fg-faint">
                      {n.category} · {formatDate(n.updatedAt, { year: false })}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
