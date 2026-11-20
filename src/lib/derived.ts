"use client";

import { useMemo } from "react";
import { useLookups, useStore } from "@/lib/store";

/** Per-country counts used by the map tooltip, country index and workspace. */
export function useCountryStats() {
  const { universities, programs, scholarships, notes, saved } = useStore();
  const { uniById } = useLookups();
  return useMemo(() => {
    const stats: Record<string, { universities: number; programs: number; scholarships: number; savedUnis: number; savedScholarships: number; savedPrograms: number; notes: number }> = {};
    const get = (c: string) =>
      (stats[c] ??= { universities: 0, programs: 0, scholarships: 0, savedUnis: 0, savedScholarships: 0, savedPrograms: 0, notes: 0 });
    universities.forEach((u) => {
      const s = get(u.countryCode);
      s.universities++;
      if (saved.universities.includes(u.id)) s.savedUnis++;
    });
    programs.forEach((p) => {
      const c = uniById[p.universityId]?.countryCode;
      if (!c) return;
      const s = get(c);
      s.programs++;
      if (saved.programs.includes(p.id)) s.savedPrograms++;
    });
    scholarships.forEach((x) => {
      const s = get(x.countryCode);
      s.scholarships++;
      if (saved.scholarships.includes(x.id)) s.savedScholarships++;
    });
    notes.forEach((n) => n.countryCode && get(n.countryCode).notes++);
    return stats;
  }, [universities, programs, scholarships, notes, saved, uniById]);
}

export function describeCountry(s?: { universities: number; scholarships: number; savedUnis: number; savedScholarships: number }) {
  if (!s || (s.universities === 0 && s.scholarships === 0)) return "No research yet — click to start";
  const parts = [`${s.universities} ${s.universities === 1 ? "university" : "universities"}`, `${s.scholarships} ${s.scholarships === 1 ? "scholarship" : "scholarships"}`];
  return parts.join(" · ");
}

/* ---------- Calendar ---------- */

export type DeadlineKind = "application" | "scholarship" | "opens" | "program";

export const DEADLINE_KINDS: { kind: DeadlineKind; label: string; dot: string }[] = [
  { kind: "application", label: "My applications", dot: "bg-accent" },
  { kind: "scholarship", label: "Scholarship deadlines", dot: "bg-warning" },
  { kind: "opens", label: "Scholarships opening", dot: "bg-success" },
  { kind: "program", label: "Program deadlines", dot: "bg-fg-faint" },
];

export type DeadlineEvent = {
  id: string;
  kind: DeadlineKind;
  date: string;
  title: string;
  sub: string;
  href: string;
  countryCode?: string;
  url?: string;
};

/** Every dated item in the workspace. "mine" = tracked applications + saved scholarships/programs. */
export function useDeadlineEvents(scope: "mine" | "all") {
  const { applications, scholarships, programs, saved } = useStore();
  const { uniById } = useLookups();
  return useMemo(() => {
    const out: DeadlineEvent[] = [];
    const appScholarships = new Set(applications.map((a) => a.scholarshipId).filter(Boolean));
    const appPrograms = new Set(applications.map((a) => a.programId).filter(Boolean));

    applications.forEach((a) => {
      const u = a.universityId ? uniById[a.universityId] : undefined;
      out.push({ id: `app-${a.id}`, kind: "application", date: a.deadline, title: a.title, sub: a.status, href: "/applications", countryCode: u?.countryCode });
    });
    scholarships.forEach((s) => {
      if (scope === "mine" && !saved.scholarships.includes(s.id)) return;
      if (!appScholarships.has(s.id) || scope === "all")
        out.push({ id: `sch-${s.id}`, kind: "scholarship", date: s.deadline, title: s.name, sub: `${s.provider} · deadline`, href: `/scholarships/${s.id}`, countryCode: s.countryCode, url: s.url });
      out.push({ id: `open-${s.id}`, kind: "opens", date: s.opens, title: s.name, sub: "Application window opens", href: `/scholarships/${s.id}`, countryCode: s.countryCode, url: s.url });
    });
    programs.forEach((p) => {
      if (scope === "mine" && !saved.programs.includes(p.id)) return;
      if (scope === "mine" && appPrograms.has(p.id)) return; // already shown as an application
      const u = uniById[p.universityId];
      out.push({ id: `prog-${p.id}`, kind: "program", date: p.deadline, title: p.name, sub: u?.name ?? "", href: `/programs/${p.id}`, countryCode: u?.countryCode, url: p.url });
    });
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }, [applications, scholarships, programs, saved, scope, uniById]);
}

export function toCalendarEvent(e: DeadlineEvent) {
  const prefix = e.kind === "opens" ? "Opens: " : "Deadline: ";
  return {
    id: e.id,
    title: prefix + e.title,
    date: e.date,
    description: `${e.sub}\nScholarMap — verify on the official site.`,
    url: e.url,
    reminders: e.kind === "opens" ? [1] : [14, 3],
  };
}
