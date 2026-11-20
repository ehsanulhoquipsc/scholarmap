"use client";

import Link from "next/link";
import { Provenance } from "@/components/ui/Provenance";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Badge, Button, Flag, KeyValue, SaveToggle, Section } from "@/components/ui/primitives";
import { AsideBlock, DetailShell, ExternalLinkRow, NotFound } from "./DetailShell";
import { ProgramBrowser } from "@/components/views/ProgramBrowser";
import { LinkedNotes } from "@/components/views/LinkedNotes";
import { ApplicationForm, UniversityForm } from "@/components/forms/RecordForms";
import { useLookups, useStore } from "@/lib/store";
import { countryName, relativeDeadline } from "@/lib/utils";

export function Detail({ id }: { id: string }) {
  const { scholarships, isSaved, toggleSaved, hydrated } = useStore();
  const { uniById } = useLookups();
  const [editing, setEditing] = useState(false);
  const [tracking, setTracking] = useState(false);
  const u = uniById[id];

  if (!u) return hydrated ? <NotFound what="university" href="/universities" /> : null;

  const funding = scholarships.filter((s) => s.universityId === u.id);

  return (
    <DetailShell
      provenance={<Provenance id={u.id} editedAt={u.editedAt} />}
      back={{ href: "/universities", label: "Universities" }}
      eyebrow={
        <>
          <Link href={`/countries/${u.countryCode}`} className="flex items-center gap-1.5 hover:text-fg">
            <Flag code={u.countryCode} size={16} /> {countryName(u.countryCode)}
          </Link>
          <span className="text-fg-faint">·</span>
          <span>{u.city}</span>
        </>
      }
      title={u.name}
      subtitle={
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="outline">{u.type}</Badge>
          {u.founded && <span>Founded {u.founded}</span>}
        </div>
      }
      actions={
        <>
          <Button variant="ghost" onClick={() => setEditing(true)}>
            <Pencil /> Edit
          </Button>
          <SaveToggle withLabel saved={isSaved("universities", u.id)} onToggle={() => toggleSaved("universities", u.id)} />
          <Button variant="primary" onClick={() => setTracking(true)}>
            <Plus /> Track application
          </Button>
        </>
      }
      aside={
        <>
          <AsideBlock title="Links">
            <ExternalLinkRow href={u.website} label="Official website" />
            <ExternalLinkRow href={u.portal} label="Application portal" />
          </AsideBlock>
          <AsideBlock title="University funding">
            {funding.length === 0 ? (
              <p className="text-fg-faint">None recorded</p>
            ) : (
              <ul className="space-y-2.5">
                {funding.map((s) => (
                  <li key={s.id}>
                    <Link href={`/scholarships/${s.id}`} className="group block">
                      <span className="block group-hover:text-accent">{s.name}</span>
                      <span className="text-[12px] text-fg-muted">
                        {s.coverage} · {relativeDeadline(s.deadline)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AsideBlock>
        </>
      }
    >
      <p className="max-w-2xl text-[15px] leading-relaxed">{u.description}</p>

      <dl className="mt-8">
        <KeyValue label="Country">{countryName(u.countryCode)}</KeyValue>
        <KeyValue label="City">{u.city}</KeyValue>
        <KeyValue label="Type">{u.type}</KeyValue>
        <KeyValue label="Research notes">{u.notes && <span className="whitespace-pre-line">{u.notes}</span>}</KeyValue>
      </dl>

      <Section title="Academic programs">
        <ProgramBrowser universityId={u.id} />
      </Section>

      <Section title="Notes">
        <LinkedNotes link={{ universityId: u.id, countryCode: u.countryCode }} emptyHint="Admissions tips, contact people and impressions about this university." />
      </Section>

      {editing && <UniversityForm open initial={u} onClose={() => setEditing(false)} />}
      {tracking && <ApplicationForm open preset={{ universityId: u.id }} onClose={() => setTracking(false)} />}
    </DetailShell>
  );
}
