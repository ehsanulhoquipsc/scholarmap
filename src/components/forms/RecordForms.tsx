"use client";

import { useState } from "react";
import { Button, Field, Input, Modal, Select, Textarea } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import { countries } from "@/data/countries";
import { APPLICATION_STATUSES, type Application, type DegreeLevel, type Program, type Scholarship, type University } from "@/lib/types";
import { allCountryCodes, countryName, uid } from "@/lib/utils";

const DEGREES: DegreeLevel[] = ["Bachelor", "Master", "PhD"];

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const researched = countries.map((c) => c.code);
  const others = allCountryCodes()
    .filter((c) => !researched.includes(c))
    .sort((a, b) => countryName(a).localeCompare(countryName(b)));
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <optgroup label="Researched">
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="All countries">
        {others.map((c) => (
          <option key={c} value={c}>
            {countryName(c)}
          </option>
        ))}
      </optgroup>
    </Select>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function useDraft<T>(initial: T) {
  const [draft, setDraft] = useState<T>(initial);
  const set = <K extends keyof T>(k: K, v: T[K]) => setDraft((d) => ({ ...d, [k]: v }));
  return [draft, set, setDraft] as const;
}

/* ---------- University ---------- */

export function UniversityForm({ open, onClose, initial, defaultCountry }: { open: boolean; onClose: () => void; initial?: University; defaultCountry?: string }) {
  const { upsertUniversity, toast } = useStore();
  const [d, set] = useDraft<University>(
    initial ?? { id: uid("uni"), name: "", countryCode: defaultCountry ?? "DE", city: "", type: "Public", website: "", portal: "", description: "", notes: "" },
  );
  const save = () => {
    if (!d.name.trim()) return toast("Give the university a name first.");
    upsertUniversity(d);
    toast(initial ? "University updated" : "University added");
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit university" : "Add university"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>{initial ? "Save changes" : "Add university"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name"><Input autoFocus value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. University of Vienna" /></Field>
        <Grid>
          <Field label="Country"><CountrySelect value={d.countryCode} onChange={(v) => set("countryCode", v)} /></Field>
          <Field label="City"><Input value={d.city} onChange={(e) => set("city", e.target.value)} /></Field>
          <Field label="Type">
            <Select value={d.type} onChange={(e) => set("type", e.target.value as University["type"])}>
              {["Public", "Private", "Technical", "Research institute"].map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Founded"><Input type="number" value={d.founded ?? ""} onChange={(e) => set("founded", e.target.value ? Number(e.target.value) : undefined)} /></Field>
          <Field label="Official website"><Input value={d.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" /></Field>
          <Field label="Application portal"><Input value={d.portal} onChange={(e) => set("portal", e.target.value)} placeholder="https://" /></Field>
        </Grid>
        <Field label="Description"><Textarea value={d.description} onChange={(e) => set("description", e.target.value)} /></Field>
        <Field label="Research notes"><Textarea value={d.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

/* ---------- Program ---------- */

export function ProgramForm({ open, onClose, initial, defaultUniversity }: { open: boolean; onClose: () => void; initial?: Program; defaultUniversity?: string }) {
  const { upsertProgram, universities, toast } = useStore();
  const [d, set] = useDraft<Program>(
    initial ?? {
      id: uid("prog"), name: "", universityId: defaultUniversity ?? universities[0]?.id ?? "", degree: "Master", faculty: "", language: "English", durationMonths: 24,
      tuitionPerYear: 0, tuitionLabel: "", intake: "Fall", deadline: "2027-01-15", ielts: "6.5", toefl: "90", academic: "", url: "", notes: "",
    },
  );
  const save = () => {
    if (!d.name.trim()) return toast("Give the program a name first.");
    upsertProgram({ ...d, tuitionLabel: d.tuitionLabel || (d.tuitionPerYear ? `€${d.tuitionPerYear.toLocaleString("en-GB")} / year` : "Tuition-free") });
    toast(initial ? "Program updated" : "Program added");
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      width={640}
      title={initial ? "Edit program" : "Add program"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>{initial ? "Save changes" : "Add program"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Program name"><Input autoFocus value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. M.Sc. Computer Science" /></Field>
        <Grid>
          <Field label="University">
            <Select value={d.universityId} onChange={(e) => set("universityId", e.target.value)}>
              {[...universities].sort((a, b) => a.name.localeCompare(b.name)).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
          <Field label="Degree level">
            <Select value={d.degree} onChange={(e) => set("degree", e.target.value as DegreeLevel)}>{DEGREES.map((x) => <option key={x}>{x}</option>)}</Select>
          </Field>
          <Field label="Faculty"><Input value={d.faculty} onChange={(e) => set("faculty", e.target.value)} /></Field>
          <Field label="Teaching language"><Input value={d.language} onChange={(e) => set("language", e.target.value)} /></Field>
          <Field label="Duration (months)"><Input type="number" value={d.durationMonths} onChange={(e) => set("durationMonths", Number(e.target.value))} /></Field>
          <Field label="Tuition per year (EUR)" hint="0 for tuition-free"><Input type="number" value={d.tuitionPerYear} onChange={(e) => set("tuitionPerYear", Number(e.target.value))} /></Field>
          <Field label="Intake">
            <Select value={d.intake} onChange={(e) => set("intake", e.target.value as Program["intake"])}>{["Winter", "Summer", "Fall", "Spring"].map((x) => <option key={x}>{x}</option>)}</Select>
          </Field>
          <Field label="Application deadline"><Input type="date" value={d.deadline} onChange={(e) => set("deadline", e.target.value)} /></Field>
          <Field label="IELTS"><Input value={d.ielts} onChange={(e) => set("ielts", e.target.value)} /></Field>
          <Field label="TOEFL iBT"><Input value={d.toefl} onChange={(e) => set("toefl", e.target.value)} /></Field>
        </Grid>
        <Field label="Academic requirements"><Textarea value={d.academic} onChange={(e) => set("academic", e.target.value)} className="min-h-[64px]" /></Field>
        <Field label="Official program URL"><Input value={d.url} onChange={(e) => set("url", e.target.value)} placeholder="https://" /></Field>
        <Field label="Additional notes"><Textarea value={d.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-[64px]" /></Field>
      </div>
    </Modal>
  );
}

/* ---------- Scholarship ---------- */

export function ScholarshipForm({ open, onClose, initial, defaultCountry }: { open: boolean; onClose: () => void; initial?: Scholarship; defaultCountry?: string }) {
  const { upsertScholarship, toast } = useStore();
  const [d, set] = useDraft<Scholarship>(
    initial ?? {
      id: uid("sch"), name: "", provider: "", countryCode: defaultCountry ?? "DE", source: "Government", coverage: "Fully funded", type: "Merit-based", degrees: ["Master"],
      nationalities: "", tuition: "", stipend: "", stipendMonthly: 0, accommodation: "", travel: "", languages: ["English"], languageReq: "", academicReq: "",
      opens: "2026-12-01", deadline: "2027-03-01", durationLabel: "", url: "", notes: "",
    },
  );
  const save = () => {
    if (!d.name.trim()) return toast("Give the scholarship a name first.");
    upsertScholarship(d);
    toast(initial ? "Scholarship updated" : "Scholarship added");
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      width={680}
      title={initial ? "Edit scholarship" : "Add scholarship"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>{initial ? "Save changes" : "Add scholarship"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Scholarship name"><Input autoFocus value={d.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Grid>
          <Field label="Provider"><Input value={d.provider} onChange={(e) => set("provider", e.target.value)} /></Field>
          <Field label="Country"><CountrySelect value={d.countryCode} onChange={(v) => set("countryCode", v)} /></Field>
          <Field label="Funding source">
            <Select value={d.source} onChange={(e) => set("source", e.target.value as Scholarship["source"])}>{["Government", "University", "Foundation"].map((x) => <option key={x}>{x}</option>)}</Select>
          </Field>
          <Field label="Coverage">
            <Select value={d.coverage} onChange={(e) => set("coverage", e.target.value as Scholarship["coverage"])}>{["Fully funded", "Partially funded"].map((x) => <option key={x}>{x}</option>)}</Select>
          </Field>
          <Field label="Scholarship type"><Input value={d.type} onChange={(e) => set("type", e.target.value)} /></Field>
          <Field label="Degree levels">
            <div className="flex h-8 items-center gap-3">
              {DEGREES.map((x) => (
                <label key={x} className="flex items-center gap-1.5 text-[13px]">
                  <input
                    type="checkbox"
                    className="accent-[var(--accent)]"
                    checked={d.degrees.includes(x)}
                    onChange={(e) => set("degrees", e.target.checked ? [...d.degrees, x] : d.degrees.filter((y) => y !== x))}
                  />
                  {x}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Tuition coverage"><Input value={d.tuition} onChange={(e) => set("tuition", e.target.value)} /></Field>
          <Field label="Monthly stipend"><Input value={d.stipend} onChange={(e) => set("stipend", e.target.value)} placeholder="e.g. €934 / month" /></Field>
          <Field label="Accommodation"><Input value={d.accommodation} onChange={(e) => set("accommodation", e.target.value)} /></Field>
          <Field label="Travel allowance"><Input value={d.travel} onChange={(e) => set("travel", e.target.value)} /></Field>
          <Field label="Application opens"><Input type="date" value={d.opens} onChange={(e) => set("opens", e.target.value)} /></Field>
          <Field label="Application deadline"><Input type="date" value={d.deadline} onChange={(e) => set("deadline", e.target.value)} /></Field>
        </Grid>
        <Field label="Eligible nationalities"><Input value={d.nationalities} onChange={(e) => set("nationalities", e.target.value)} /></Field>
        <Field label="Language requirements"><Input value={d.languageReq} onChange={(e) => set("languageReq", e.target.value)} /></Field>
        <Field label="Academic requirements"><Textarea value={d.academicReq} onChange={(e) => set("academicReq", e.target.value)} className="min-h-[64px]" /></Field>
        <Field label="Official application URL"><Input value={d.url} onChange={(e) => set("url", e.target.value)} placeholder="https://" /></Field>
        <Field label="Research notes"><Textarea value={d.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-[64px]" /></Field>
      </div>
    </Modal>
  );
}

/* ---------- Application ---------- */

export function ApplicationForm({ open, onClose, initial, preset }: { open: boolean; onClose: () => void; initial?: Application; preset?: Partial<Application> }) {
  const { upsertApplication, universities, scholarships, programs, toast } = useStore();
  const [d, set] = useDraft<Application>(
    initial ?? {
      id: uid("app"), title: "", degree: "Master", deadline: "2027-01-15", status: "Interested", notes: "", updatedAt: new Date().toISOString().slice(0, 10),
      checklist: ["Transcript & degree certificate", "Language test score", "CV", "Statement of purpose", "Recommendation letters", "Passport copy"].map((label, i) => ({ id: `c${i}`, label, done: false })),
      ...preset,
    },
  );
  const save = () => {
    const prog = programs.find((p) => p.id === d.programId);
    const uni = universities.find((u) => u.id === (d.universityId ?? prog?.universityId));
    const sch = scholarships.find((s) => s.id === d.scholarshipId);
    const title = d.title.trim() || [uni?.name, prog?.name].filter(Boolean).join(" — ") || sch?.name || "";
    if (!title) return toast("Choose a university, program or scholarship.");
    upsertApplication({ ...d, title, universityId: d.universityId ?? prog?.universityId, updatedAt: new Date().toISOString().slice(0, 10) });
    toast(initial ? "Application updated" : "Added to your tracker");
    onClose();
  };
  const uniPrograms = programs.filter((p) => !d.universityId || p.universityId === d.universityId);
  return (
    <Modal
      open={open}
      onClose={onClose}
      width={600}
      title={initial ? "Edit application" : "Track an application"}
      description={initial ? undefined : "Add an opportunity you are considering. You can update its status at any time."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>{initial ? "Save changes" : "Add to tracker"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Grid>
          <Field label="University">
            <Select value={d.universityId ?? ""} onChange={(e) => set("universityId", e.target.value || undefined)}>
              <option value="">None</option>
              {[...universities].sort((a, b) => a.name.localeCompare(b.name)).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
          <Field label="Program">
            <Select value={d.programId ?? ""} onChange={(e) => set("programId", e.target.value || undefined)}>
              <option value="">None</option>
              {uniPrograms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Scholarship" className="sm:col-span-2">
            <Select value={d.scholarshipId ?? ""} onChange={(e) => set("scholarshipId", e.target.value || undefined)}>
              <option value="">None</option>
              {scholarships.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Degree">
            <Select value={d.degree} onChange={(e) => set("degree", e.target.value as DegreeLevel)}>{DEGREES.map((x) => <option key={x}>{x}</option>)}</Select>
          </Field>
          <Field label="Application deadline"><Input type="date" value={d.deadline} onChange={(e) => set("deadline", e.target.value)} /></Field>
          <Field label="Status" className="sm:col-span-2">
            <Select value={d.status} onChange={(e) => set("status", e.target.value as Application["status"])}>{APPLICATION_STATUSES.map((x) => <option key={x}>{x}</option>)}</Select>
          </Field>
        </Grid>
        <Field label="Title" hint="Optional — generated from the university and program if left empty">
          <Input value={d.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Personal notes"><Textarea value={d.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
