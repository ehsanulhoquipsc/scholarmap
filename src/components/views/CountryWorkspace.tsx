"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { Badge, Button, Flag, Tabs } from "@/components/ui/primitives";
import { UniversityBrowser } from "./UniversityBrowser";
import { ProgramBrowser } from "./ProgramBrowser";
import { ScholarshipBrowser } from "./ScholarshipBrowser";
import { LinkedNotes } from "./LinkedNotes";
import { useLookups, useStore } from "@/lib/store";
import { useCountryStats } from "@/lib/derived";
import { countryByCode } from "@/data/countries";
import { cn, countryName, formatDate, relativeDeadline, windowStatus } from "@/lib/utils";

const TABS = ["overview", "universities", "programs", "scholarships", "requirements", "notes"] as const;
type Tab = (typeof TABS)[number];

export function CountryWorkspace({ code }: { code: string }) {
  const info = countryByCode[code];
  const name = countryName(code);
  const { isSaved, toggleSaved, notes, scholarships, programs } = useStore();
  const { uniById } = useLookups();
  const stats = useCountryStats()[code];
  const [tab, setTab] = useState<Tab>("overview");
  const fav = isSaved("countries", code);

  // Deep-link tabs via #hash so the back button and sharing behave
  useEffect(() => {
    const h = window.location.hash.slice(1) as Tab;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (TABS.includes(h)) setTab(h);
  }, []);
  const changeTab = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", t === "overview" ? window.location.pathname : `#${t}`);
  };

  const countryNotes = notes.filter((n) => n.countryCode === code);
  const countryPrograms = programs.filter((p) => uniById[p.universityId]?.countryCode === code);
  const openFunding = scholarships
    .filter((s) => s.countryCode === code && windowStatus(s.opens, s.deadline) !== "Closed")
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  if (code.length !== 2 || name === code) {
    return (
      <div className="py-24 text-center">
        <p className="t-h2">We couldn’t find that country.</p>
        <Link href="/countries" className="mt-3 inline-block text-[13px] text-accent">
          Browse countries
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/countries" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg">
        <ArrowLeft className="size-3.5" /> Countries
      </Link>

      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-5">
          <Flag code={code} size={56} className="mt-1 rounded-[5px]" />
          <div>
            <h1 className="t-display">{name}</h1>
            {info ? (
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-fg-muted">
                <span>
                  <span className="text-fg-faint">Capital</span> {info.capital}
                </span>
                <span>
                  <span className="text-fg-faint">Currency</span> {info.currency}
                </span>
                <span>
                  <span className="text-fg-faint">Region</span> {info.region}
                </span>
              </div>
            ) : (
              <p className="mt-2 text-[13px] text-fg-muted">Not yet researched</p>
            )}
          </div>
        </div>
        <Button
          variant={fav ? "secondary" : "primary"}
          onClick={() => {
            toggleSaved("countries", code);
          }}
          className={cn(fav && "text-accent")}
        >
          <Star className={cn(fav && "fill-current")} />
          {fav ? "Favourite" : "Add to favourites"}
        </Button>
      </header>

      <Tabs
        className="mt-10"
        value={tab}
        onChange={changeTab}
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "universities", label: "Universities", count: stats?.universities ?? 0 },
          { value: "programs", label: "Programs", count: stats?.programs ?? 0 },
          { value: "scholarships", label: "Scholarships", count: stats?.scholarships ?? 0 },
          { value: "requirements", label: "Admission Requirements" },
          { value: "notes", label: "Notes", count: countryNotes.length },
        ]}
      />

      <div key={tab} className="anim-fade pt-8">
        {tab === "overview" && (
          <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
            <div>
              {info ? (
                <p className="max-w-2xl text-[15px] leading-relaxed">{info.summary}</p>
              ) : (
                <p className="max-w-2xl text-[15px] leading-relaxed text-fg-muted">
                  Nothing has been collected for {name} yet. Start by adding a university or a scholarship — the workspace fills in as your group researches.
                </p>
              )}

              <dl className="mt-8 grid grid-cols-3 border-y border-line py-5">
                {[
                  ["Saved universities", stats?.savedUnis ?? 0, "universities"],
                  ["Available programs", stats?.programs ?? 0, "programs"],
                  ["Saved scholarships", stats?.savedScholarships ?? 0, "scholarships"],
                ].map(([l, v, t], i) => (
                  <button key={l as string} onClick={() => changeTab(t as Tab)} className={cn("group text-left", i > 0 && "border-l border-line pl-5")}>
                    <dd className="tabular text-[26px] leading-none tracking-[-0.02em]">{v}</dd>
                    <dt className="mt-2 text-[12.5px] text-fg-muted group-hover:text-fg">{l}</dt>
                  </button>
                ))}
              </dl>

              <section className="mt-10">
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="t-h2">Funding with open or upcoming deadlines</h2>
                  <button onClick={() => changeTab("scholarships")} className="text-[13px] text-fg-muted hover:text-fg">
                    All scholarships
                  </button>
                </div>
                {openFunding.length === 0 ? (
                  <p className="border-y border-line py-6 text-[13px] text-fg-muted">No open scholarships recorded for {name}.</p>
                ) : (
                  <ul className="divide-y divide-line border-y border-line">
                    {openFunding.slice(0, 5).map((s) => (
                      <li key={s.id}>
                        <Link href={`/scholarships/${s.id}`} className="group flex items-center gap-4 py-3">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13.5px] group-hover:text-accent">{s.name}</div>
                            <div className="text-[12.5px] text-fg-muted">
                              {s.source} · {s.coverage}
                            </div>
                          </div>
                          <span className="shrink-0 text-[12.5px] text-fg-muted tabular">{relativeDeadline(s.deadline)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="mt-10">
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="t-h2">General research notes</h2>
                  <button onClick={() => changeTab("notes")} className="text-[13px] text-fg-muted hover:text-fg">
                    All notes
                  </button>
                </div>
                {countryNotes.length === 0 ? (
                  <p className="border-y border-line py-6 text-[13px] text-fg-muted">
                    No notes yet.{" "}
                    <button onClick={() => changeTab("notes")} className="text-accent">
                      Write the first one
                    </button>
                  </p>
                ) : (
                  <div className="space-y-5">
                    {countryNotes.slice(0, 2).map((n) => (
                      <Link key={n.id} href={`/notes?id=${n.id}`} className="group block">
                        <div className="text-[13.5px] font-medium group-hover:text-accent">{n.title}</div>
                        <p className="mt-1 line-clamp-2 whitespace-pre-line text-[13px] text-fg-muted">{n.body}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-8 text-[13px]">
              <div>
                <div className="t-eyebrow mb-2.5">Main teaching languages</div>
                <div className="flex flex-wrap gap-1.5">
                  {(info?.languages ?? []).map((l) => (
                    <Badge key={l} tone="outline">
                      {l}
                    </Badge>
                  ))}
                  {!info && <span className="text-fg-faint">Unknown</span>}
                </div>
              </div>
              <div>
                <div className="t-eyebrow mb-1.5">Tuition</div>
                <p>{info?.tuitionNote ?? <span className="text-fg-faint">Not recorded</span>}</p>
              </div>
              <div>
                <div className="t-eyebrow mb-1.5">Living costs</div>
                <p>{info?.livingCost ?? <span className="text-fg-faint">Not recorded</span>}</p>
              </div>
              {countryPrograms.length > 0 && (
                <div>
                  <div className="t-eyebrow mb-1.5">Next program deadline</div>
                  {(() => {
                    const next = countryPrograms.filter((p) => windowStatus("2000-01-01", p.deadline) !== "Closed").sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
                    return next ? (
                      <Link href={`/programs/${next.id}`} className="hover:text-accent">
                        {formatDate(next.deadline)} — {next.name}
                      </Link>
                    ) : (
                      <span className="text-fg-faint">None upcoming</span>
                    );
                  })()}
                </div>
              )}
            </aside>
          </div>
        )}

        {tab === "universities" && <UniversityBrowser countryCode={code} />}
        {tab === "programs" && <ProgramBrowser countryCode={code} />}
        {tab === "scholarships" && <ScholarshipBrowser countryCode={code} compact />}
        {tab === "requirements" && <Requirements code={code} />}
        {tab === "notes" && <LinkedNotes link={{ countryCode: code }} emptyHint={`Capture visa rules, costs and impressions about ${name}.`} />}
      </div>
    </div>
  );
}

function Requirements({ code }: { code: string }) {
  const { programs } = useStore();
  const { uniById } = useLookups();
  const info = countryByCode[code];
  const list = programs.filter((p) => uniById[p.universityId]?.countryCode === code);

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
      <div>
        <h2 className="t-h2 mb-3">Program requirements</h2>
        {list.length === 0 ? (
          <p className="border-y border-line py-6 text-[13px] text-fg-muted">Add programs to compare their admission requirements here.</p>
        ) : (
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-y border-line text-left text-[12px] text-fg-muted">
                  <th className="py-2.5 pr-4 font-normal">Program</th>
                  <th className="py-2.5 pr-4 font-normal">IELTS</th>
                  <th className="py-2.5 pr-4 font-normal">TOEFL</th>
                  <th className="py-2.5 font-normal">Academic</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="border-b border-line align-top">
                    <td className="py-3 pr-4">
                      <Link href={`/programs/${p.id}`} className="font-medium hover:text-accent">
                        {p.name}
                      </Link>
                      <div className="text-[12px] text-fg-muted">{uniById[p.universityId]?.name}</div>
                    </td>
                    <td className="tabular py-3 pr-4">{p.ielts}</td>
                    <td className="tabular py-3 pr-4">{p.toefl}</td>
                    <td className="py-3 text-fg-muted">{p.academic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <aside className="space-y-6 text-[13px]">
        <div>
          <div className="t-eyebrow mb-2">Typical documents</div>
          <ul className="space-y-1.5 text-fg-muted">
            {["Certified transcripts and degree certificate", "Language test results", "CV / résumé", "Statement of purpose", "Two academic references", "Passport copy"].map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
        {info && (
          <div>
            <div className="t-eyebrow mb-2">Proof of funds for visa</div>
            <p className="text-fg-muted">{info.livingCost}</p>
          </div>
        )}
        <p className="text-[12px] text-fg-faint">Requirements change every cycle. Always confirm on the official program page.</p>
      </aside>
    </div>
  );
}
