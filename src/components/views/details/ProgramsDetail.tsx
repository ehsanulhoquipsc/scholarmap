"use client";

import Link from "next/link";
import { Provenance } from "@/components/ui/Provenance";
import { useState } from "react";
import { CalendarPlus, Check, Columns3, Pencil, Plus } from "lucide-react";
import { exportICS, slug } from "@/lib/export";
import { Badge, Button, Flag, KeyValue, SaveToggle, Section } from "@/components/ui/primitives";
import { AsideBlock, DetailShell, ExternalLinkRow, NotFound } from "./DetailShell";
import { ApplicationForm, ProgramForm } from "@/components/forms/RecordForms";
import { useLookups, useStore } from "@/lib/store";
import { cn, countryName, daysUntil, formatDate, formatDuration, relativeDeadline } from "@/lib/utils";

export function Detail({ id }: { id: string }) {
  const { programs, scholarships, isSaved, toggleSaved, compare, toggleCompare, hydrated, toast } = useStore();
  const { programById, uniById } = useLookups();
  const [editing, setEditing] = useState(false);
  const [tracking, setTracking] = useState(false);
  const p = programById[id];
  if (!p) return hydrated ? <NotFound what="program" href="/programs" /> : null;
  const u = uniById[p.universityId];
  const inCompare = compare.some((c) => c.kind === "program" && c.id === p.id);
  const days = daysUntil(p.deadline);

  const funding = scholarships.filter((s) => s.countryCode === u?.countryCode && s.degrees.includes(p.degree) && (!s.universityId || s.universityId === u?.id));
  const siblings = programs.filter((x) => x.universityId === p.universityId && x.id !== p.id);

  return (
    <DetailShell
      provenance={<Provenance id={p.id} editedAt={p.editedAt} />}
      back={{ href: "/programs", label: "Programs" }}
      eyebrow={
        u && (
          <>
            <Link href={`/universities/${u.id}`} className="hover:text-fg">
              {u.name}
            </Link>
            <span className="text-fg-faint">·</span>
            <Link href={`/countries/${u.countryCode}`} className="flex items-center gap-1.5 hover:text-fg">
              <Flag code={u.countryCode} size={16} /> {u.city}, {countryName(u.countryCode)}
            </Link>
          </>
        )
      }
      title={p.name}
      subtitle={
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="outline">{p.degree}</Badge>
          <Badge tone="outline">{p.language}</Badge>
          <span>{p.faculty}</span>
        </div>
      }
      actions={
        <>
          <Button variant="ghost" onClick={() => setEditing(true)}>
            <Pencil /> Edit
          </Button>
          <Button onClick={() => toggleCompare({ kind: "program", id: p.id })} className={cn(inCompare && "text-accent")}>
            {inCompare ? <Check /> : <Columns3 />} {inCompare ? "In comparison" : "Compare"}
          </Button>
          <SaveToggle withLabel saved={isSaved("programs", p.id)} onToggle={() => toggleSaved("programs", p.id)} />
          <Button variant="primary" onClick={() => setTracking(true)}>
            <Plus /> Track
          </Button>
        </>
      }
      aside={
        <>
          <AsideBlock title="Application deadline">
            <div className="tabular text-[22px] leading-tight tracking-[-0.02em]">{formatDate(p.deadline)}</div>
            <div className={cn("mt-1", days < 0 ? "text-fg-faint" : days <= 21 ? "text-danger" : "text-fg-muted")}>{relativeDeadline(p.deadline)}</div>
            {days >= 0 && (
              <button
                onClick={() => {
                  exportICS(`${slug(p.name)}.ics`, [{ id: `prog-${p.id}`, title: `Deadline: ${p.name} — ${u?.name ?? ""}`, date: p.deadline, url: p.url, reminders: [14, 3] }]);
                  toast("Calendar file downloaded");
                }}
                className="mt-3 flex items-center gap-1.5 text-[12.5px] text-accent hover:underline"
              >
                <CalendarPlus className="size-3.5" /> Add to calendar
              </button>
            )}
          </AsideBlock>
          <AsideBlock title="Links">
            <ExternalLinkRow href={p.url} label="Official program page" />
            {u && <ExternalLinkRow href={u.portal} label="Application portal" />}
          </AsideBlock>
          {funding.length > 0 && (
            <AsideBlock title="Possible funding">
              <ul className="space-y-2.5">
                {funding.slice(0, 4).map((s) => (
                  <li key={s.id}>
                    <Link href={`/scholarships/${s.id}`} className="group block">
                      <span className="block group-hover:text-accent">{s.name}</span>
                      <span className="text-[12px] text-fg-muted">{s.coverage}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </AsideBlock>
          )}
        </>
      }
    >
      <h2 className="t-h2 mb-2">Program details</h2>
      <dl>
        <KeyValue label="University">{u?.name}</KeyValue>
        <KeyValue label="Country · City">{u && `${countryName(u.countryCode)} · ${u.city}`}</KeyValue>
        <KeyValue label="Degree level">{p.degree}</KeyValue>
        <KeyValue label="Faculty">{p.faculty}</KeyValue>
        <KeyValue label="Teaching language">{p.language}</KeyValue>
        <KeyValue label="Duration">{formatDuration(p.durationMonths)}</KeyValue>
        <KeyValue label="Tuition fees">{p.tuitionLabel}</KeyValue>
        <KeyValue label="Intake">{p.intake}</KeyValue>
      </dl>

      <Section title="Requirements">
        <dl>
          <KeyValue label="IELTS">{p.ielts}</KeyValue>
          <KeyValue label="TOEFL iBT">{p.toefl}</KeyValue>
          <KeyValue label="Academic">{p.academic}</KeyValue>
        </dl>
      </Section>

      <Section title="Additional notes">
        {p.notes ? <p className="max-w-2xl whitespace-pre-line text-[14px] leading-relaxed">{p.notes}</p> : <p className="text-[13px] text-fg-faint">No notes. Use Edit to add some.</p>}
      </Section>

      {siblings.length > 0 && (
        <Section title={`More at ${u?.name}`}>
          <ul className="divide-y divide-line border-y border-line">
            {siblings.map((s) => (
              <li key={s.id}>
                <Link href={`/programs/${s.id}`} className="group flex items-center justify-between py-3 text-[13.5px]">
                  <span className="group-hover:text-accent">{s.name}</span>
                  <span className="text-[12.5px] text-fg-muted">{s.degree}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {editing && <ProgramForm open initial={p} onClose={() => setEditing(false)} />}
      {tracking && (
        <ApplicationForm open preset={{ universityId: p.universityId, programId: p.id, degree: p.degree, deadline: p.deadline }} onClose={() => setTracking(false)} />
      )}
    </DetailShell>
  );
}
