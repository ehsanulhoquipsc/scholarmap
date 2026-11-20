"use client";

import Link from "next/link";
import { Provenance } from "@/components/ui/Provenance";
import { useState } from "react";
import { CalendarPlus, Check, Columns3, Pencil, Plus } from "lucide-react";
import { exportICS, slug } from "@/lib/export";
import { Badge, Button, Flag, KeyValue, SaveToggle, Section, StatusDot } from "@/components/ui/primitives";
import { AsideBlock, DetailShell, ExternalLinkRow, NotFound } from "./DetailShell";
import { ApplicationForm, ScholarshipForm } from "@/components/forms/RecordForms";
import { LinkedNotes } from "@/components/views/LinkedNotes";
import { useLookups, useStore } from "@/lib/store";
import { cn, countryName, daysUntil, formatDate, relativeDeadline, windowStatus } from "@/lib/utils";

export function Detail({ id }: { id: string }) {
  const { isSaved, toggleSaved, compare, toggleCompare, hydrated, toast } = useStore();
  const { scholarshipById, uniById } = useLookups();
  const [editing, setEditing] = useState(false);
  const [tracking, setTracking] = useState(false);
  const s = scholarshipById[id];
  if (!s) return hydrated ? <NotFound what="scholarship" href="/scholarships" /> : null;

  const status = windowStatus(s.opens, s.deadline);
  const inCompare = compare.some((c) => c.kind === "scholarship" && c.id === s.id);
  const uni = s.universityId ? uniById[s.universityId] : undefined;
  const days = daysUntil(s.deadline);

  return (
    <DetailShell
      provenance={<Provenance id={s.id} editedAt={s.editedAt} />}
      back={{ href: "/scholarships", label: "Scholarships" }}
      eyebrow={
        <>
          <Link href={`/countries/${s.countryCode}`} className="flex items-center gap-1.5 hover:text-fg">
            <Flag code={s.countryCode} size={16} /> {countryName(s.countryCode)}
          </Link>
          <span className="text-fg-faint">·</span>
          <span>{s.provider}</span>
        </>
      }
      title={s.name}
      subtitle={
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={s.coverage === "Fully funded" ? "accent" : "neutral"}>{s.coverage}</Badge>
          <Badge tone="outline">{s.source} funding</Badge>
          <Badge tone="outline">{s.degrees.join(" · ")}</Badge>
        </div>
      }
      actions={
        <>
          <Button variant="ghost" onClick={() => setEditing(true)}>
            <Pencil /> Edit
          </Button>
          <Button onClick={() => toggleCompare({ kind: "scholarship", id: s.id })} className={cn(inCompare && "text-accent")}>
            {inCompare ? <Check /> : <Columns3 />} {inCompare ? "In comparison" : "Compare"}
          </Button>
          <SaveToggle withLabel saved={isSaved("scholarships", s.id)} onToggle={() => toggleSaved("scholarships", s.id)} />
          <Button variant="primary" onClick={() => setTracking(true)}>
            <Plus /> Track
          </Button>
        </>
      }
      aside={
        <>
          <AsideBlock title="Application window">
            <div className="mb-3 flex items-center gap-1.5">
              <StatusDot tone={status === "Open" ? "open" : status === "Upcoming" ? "upcoming" : "closed"} />
              <span>{status}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[12px] text-fg-faint">Opens</div>
                <div className="tabular">{formatDate(s.opens)}</div>
              </div>
              <div>
                <div className="text-[12px] text-fg-faint">Deadline</div>
                <div className="tabular">{formatDate(s.deadline)}</div>
              </div>
            </div>
            {status !== "Closed" && <div className={cn("mt-2", days <= 21 ? "text-danger" : "text-fg-muted")}>{relativeDeadline(s.deadline)}</div>}
            {status !== "Closed" && (
              <button
                onClick={() => {
                  exportICS(`${slug(s.name)}.ics`, [
                    ...(status === "Upcoming" ? [{ id: `open-${s.id}`, title: `Opens: ${s.name}`, date: s.opens, url: s.url, reminders: [1] }] : []),
                    { id: `sch-${s.id}`, title: `Deadline: ${s.name}`, date: s.deadline, description: s.provider, url: s.url, reminders: [14, 3] },
                  ]);
                  toast("Calendar file downloaded");
                }}
                className="mt-3 flex items-center gap-1.5 text-[12.5px] text-accent hover:underline"
              >
                <CalendarPlus className="size-3.5" /> Add to calendar
              </button>
            )}
          </AsideBlock>
          <AsideBlock title="Links">
            <ExternalLinkRow href={s.url} label="Official application page" />
            {uni && (
              <Link href={`/universities/${uni.id}`} className="flex items-center justify-between py-2.5 hover:text-accent">
                {uni.name}
              </Link>
            )}
          </AsideBlock>
        </>
      }
    >
      <h2 className="t-h2 mb-2">What it covers</h2>
      <dl>
        <KeyValue label="Tuition">{s.tuition}</KeyValue>
        <KeyValue label="Monthly stipend">{s.stipend}</KeyValue>
        <KeyValue label="Accommodation">{s.accommodation}</KeyValue>
        <KeyValue label="Travel allowance">{s.travel}</KeyValue>
        <KeyValue label="Duration">{s.durationLabel}</KeyValue>
      </dl>

      <Section title="Eligibility">
        <dl>
          <KeyValue label="Scholarship type">{s.type}</KeyValue>
          <KeyValue label="Degree levels">{s.degrees.join(", ")}</KeyValue>
          <KeyValue label="Nationalities">{s.nationalities}</KeyValue>
          <KeyValue label="Teaching languages">{s.languages.join(", ")}</KeyValue>
          <KeyValue label="Language">{s.languageReq}</KeyValue>
          <KeyValue label="Academic">{s.academicReq}</KeyValue>
        </dl>
      </Section>

      {s.notes && (
        <Section title="Research notes">
          <p className="max-w-2xl whitespace-pre-line rounded-lg bg-subtle px-4 py-3.5 text-[14px] leading-relaxed">{s.notes}</p>
        </Section>
      )}

      <Section title="Notes">
        <LinkedNotes link={{ scholarshipId: s.id, countryCode: s.countryCode }} emptyHint="Eligibility questions, essay ideas or tips from past applicants." />
      </Section>

      {editing && <ScholarshipForm open initial={s} onClose={() => setEditing(false)} />}
      {tracking && (
        <ApplicationForm open preset={{ scholarshipId: s.id, universityId: s.universityId, degree: s.degrees[0], deadline: s.deadline, title: s.name }} onClose={() => setTracking(false)} />
      )}
    </DetailShell>
  );
}
