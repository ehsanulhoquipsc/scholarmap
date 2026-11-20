export type DegreeLevel = "Bachelor" | "Master" | "PhD";

export type Country = {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  capital: string;
  currency: string;
  region: string;
  languages: string[]; // main teaching languages
  summary: string;
  tuitionNote: string;
  livingCost: string; // monthly estimate
};

export type UniversityType = "Public" | "Private" | "Technical" | "Research institute";

export type University = {
  id: string;
  name: string;
  countryCode: string;
  city: string;
  type: UniversityType;
  founded?: number;
  website: string;
  portal: string;
  description: string;
  notes: string;
  editedAt?: string;
};

export type Intake = "Winter" | "Summer" | "Fall" | "Spring";

export type Program = {
  id: string;
  name: string;
  universityId: string;
  degree: DegreeLevel;
  faculty: string;
  language: string;
  durationMonths: number;
  tuitionPerYear: number; // EUR equivalent, 0 = tuition-free
  tuitionLabel: string;
  intake: Intake;
  deadline: string; // ISO date
  ielts: string;
  toefl: string;
  academic: string;
  url: string;
  notes: string;
  editedAt?: string;
};

export type FundingSource = "Government" | "University" | "Foundation";
export type Coverage = "Fully funded" | "Partially funded";

export type Scholarship = {
  id: string;
  name: string;
  provider: string;
  countryCode: string;
  universityId?: string;
  source: FundingSource;
  coverage: Coverage;
  type: string; // e.g. "Merit-based", "Need-based"
  degrees: DegreeLevel[];
  nationalities: string;
  tuition: string;
  stipend: string;
  stipendMonthly: number; // EUR equivalent, 0 = none
  accommodation: string;
  travel: string;
  languages: string[]; // teaching languages accepted
  languageReq: string;
  academicReq: string;
  opens: string; // ISO
  deadline: string; // ISO
  durationLabel: string;
  url: string;
  notes: string;
  editedAt?: string;
};

export const APPLICATION_STATUSES = [
  "Interested",
  "Researching",
  "Preparing documents",
  "Ready to apply",
  "Applied",
  "Under review",
  "Accepted",
  "Rejected",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type ChecklistItem = { id: string; label: string; done: boolean; documentId?: string };

export type Application = {
  id: string;
  title: string;
  universityId?: string;
  programId?: string;
  scholarshipId?: string;
  degree: DegreeLevel;
  deadline: string;
  status: ApplicationStatus;
  notes: string;
  checklist: ChecklistItem[];
  updatedAt: string;
  editedAt?: string;
};

export const NOTE_CATEGORIES = [
  "General",
  "Visa & immigration",
  "Funding",
  "Admissions",
  "Living costs",
  "Language",
] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export type Note = {
  id: string;
  title: string;
  body: string;
  category: NoteCategory;
  countryCode?: string;
  universityId?: string;
  scholarshipId?: string;
  author: string;
  updatedAt: string;
  editedAt?: string;
};

export type CompareItem = { kind: "scholarship" | "program"; id: string };

export const DOCUMENT_KINDS = [
  "CV",
  "Statement of purpose",
  "Motivation letter",
  "Research proposal",
  "Recommendation letter",
  "Essay",
  "Transcript",
  "Language certificate",
  "Passport",
  "Other",
] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export type DocumentVersion = {
  id: string;
  label: string; // e.g. "v3 — TU Delft"
  createdAt: string;
  /** Text content for writing documents (SOP, CV text, essays). */
  content: string;
  /** Name of the file kept elsewhere (no uploads in the prototype). */
  fileName?: string;
  note: string;
};

export type DocumentStatus = "Draft" | "In review" | "Final";

export type DocumentRecord = {
  id: string;
  title: string;
  kind: DocumentKind;
  status: DocumentStatus;
  versions: DocumentVersion[]; // newest first
  updatedAt: string;
  editedAt?: string;
};
