import type { Application, DocumentRecord, Note } from "@/lib/types";

// Checklist labels that map onto documents in the library
const DOC_LINKS: Record<string, string> = {
  "Transcript & degree certificate": "doc-transcript",
  "IELTS / TOEFL score": "doc-ielts",
  CV: "doc-cv",
  "Statement of purpose": "doc-sop",
  "Two recommendation letters": "doc-reco",
  "Passport copy": "doc-passport",
};

const docs = (labels: string[], done: number) =>
  labels.map((label, i) => ({ id: `c${i}`, label, done: i < done, documentId: DOC_LINKS[label] }));

const standardDocs = ["Transcript & degree certificate", "IELTS / TOEFL score", "CV", "Statement of purpose", "Two recommendation letters", "Passport copy"];

export const seedApplications: Application[] = [
  { id: "app-1", title: "TU Delft — M.Sc. Computer Science", universityId: "tu-delft", programId: "tud-msc-cs", scholarshipId: "tud-excellence", degree: "Master", deadline: "2026-12-01", status: "Ready to apply", notes: "Excellence scholarship needs a separate essay — draft is in shared folder.", checklist: docs(standardDocs, 5), updatedAt: "2026-11-18" },
  { id: "app-2", title: "ETH Zurich — M.Sc. Computer Science", universityId: "eth", programId: "eth-msc-cs", scholarshipId: "eth-esop", degree: "Master", deadline: "2026-12-15", status: "Preparing documents", notes: "Ask Prof. Rahman for second letter by Dec 1.", checklist: docs(standardDocs, 3), updatedAt: "2026-11-17" },
  { id: "app-3", title: "KTH — M.Sc. Machine Learning", universityId: "kth", programId: "kth-msc-ml", scholarshipId: "kth-scholarship", degree: "Master", deadline: "2027-01-15", status: "Researching", notes: "Check whether SI scholarship can be combined with KTH waiver.", checklist: docs(standardDocs, 1), updatedAt: "2026-11-12" },
  { id: "app-4", title: "DAAD EPOS — Development-Related Postgraduate Courses", scholarshipId: "daad-epos", universityId: "tum", degree: "Master", deadline: "2026-12-31", status: "Preparing documents", notes: "Need employer certificate confirming two years of work.", checklist: docs([...standardDocs, "Employer certificate", "DAAD application form"], 4), updatedAt: "2026-11-15" },
  { id: "app-5", title: "University of Helsinki — M.Sc. Data Science", universityId: "helsinki", programId: "helsinki-msc-ds", degree: "Master", deadline: "2027-01-02", status: "Interested", notes: "", checklist: docs(standardDocs, 0), updatedAt: "2026-11-10" },
  { id: "app-6", title: "Commonwealth Master's Scholarship — UCL Public Policy", universityId: "ucl", programId: "ucl-msc-ppe", scholarshipId: "commonwealth-masters", degree: "Master", deadline: "2026-10-14", status: "Under review", notes: "Shortlisting results expected in February.", checklist: docs(standardDocs, 6), updatedAt: "2026-10-14" },
  { id: "app-7", title: "Lester B. Pearson — University of Toronto", universityId: "utoronto", scholarshipId: "lester-pearson", degree: "Bachelor", deadline: "2026-11-30", status: "Applied", notes: "Submitted for my younger cousin — tracking it on her behalf.", checklist: docs(["School nomination", "Transcript", "Personal essay", "Recommendation letter"], 4), updatedAt: "2026-11-08" },
];

export const seedNotes: Note[] = [
  { id: "note-1", title: "German blocked account — how it works", category: "Visa & immigration", countryCode: "DE", author: "You", updatedAt: "2026-11-16",
    body: "For the student visa you need proof of €11,904 per year (€992/month from 2025).\n\nOptions: Fintiba, Expatrio, Coracle. Expatrio bundles health insurance which simplifies the embassy appointment.\n\nDAAD scholars are exempt — the award letter is enough proof of funding." },
  { id: "note-2", title: "TU Delft application timeline", category: "Admissions", countryCode: "NL", universityId: "tu-delft", author: "You", updatedAt: "2026-11-18",
    body: "Studielink application first, then the TU Delft portal. Excellence scholarship deadline is the same as the regular Dec 1 round.\n\nDocuments: transcript, CV, motivation letter (max 1 page), two references, IELTS 7.0 with sub-scores ≥ 6.5." },
  { id: "note-3", title: "Comparing Swedish scholarships", category: "Funding", countryCode: "SE", scholarshipId: "si-sisgp", author: "You", updatedAt: "2026-11-11",
    body: "SI scholarship requires 3,000 hours of work experience — I just about qualify.\n\nThe university-level scholarships (KTH, Lund) only cover tuition. SI covers living costs too, so it's the one to aim for. They can't be held at the same time." },
  { id: "note-4", title: "ETH vs EPFL — first impressions", category: "General", countryCode: "CH", universityId: "eth", author: "You", updatedAt: "2026-11-09",
    body: "Both have very low tuition but Zurich rent is brutal — roughly CHF 900+ for a WG room.\n\nESOP is the only realistic way to make ETH work financially. EPFL has a similar Excellence Fellowship." },
  { id: "note-5", title: "Stipendium Hungaricum nomination", category: "Funding", countryCode: "HU", scholarshipId: "stipendium-hungaricum", author: "You", updatedAt: "2026-11-05",
    body: "Application through the online portal, then the sending partner (our ministry) nominates.\n\nYou can rank up to two programs. Medicine is very competitive; engineering at Debrecen seems more realistic." },
  { id: "note-6", title: "IELTS booking", category: "Language", author: "You", updatedAt: "2026-11-02",
    body: "Test dates fill up quickly before December deadlines. Results arrive 3–5 days after the computer-delivered test.\n\nMost programs we're looking at need 6.5 overall; TU Delft and ETH need 7.0." },
];

export const seedSaved = {
  universities: ["tum", "tu-delft", "kth", "eth", "helsinki", "uva", "nus"],
  programs: ["tud-msc-cs", "eth-msc-cs", "kth-msc-ml", "helsinki-msc-ds", "uva-msc-ai", "tum-msc-informatics"],
  scholarships: ["daad-epos", "tud-excellence", "si-sisgp", "eth-esop", "stipendium-hungaricum", "chevening", "mext"],
  countries: ["DE", "NL", "SE", "CH"],
};

export const seedDocuments: DocumentRecord[] = [
  {
    id: "doc-sop", title: "Statement of purpose", kind: "Statement of purpose", status: "In review", updatedAt: "2026-11-17",
    versions: [
      { id: "v3", label: "v3 — TU Delft CS", createdAt: "2026-11-17", note: "Shortened to one page for Delft; stronger opening on distributed systems.",
        content: "My interest in computer science began with a practical problem: keeping a small clinic's patient records available when the internet failed.\n\nThat project led me to distributed systems, which became the focus of my final-year thesis on conflict-free replicated data types.\n\nTU Delft's Distributed Systems group, and Prof. ___'s work on edge computing, is the reason I am applying…" },
      { id: "v2", label: "v2 — ETH Zurich", createdAt: "2026-11-02", note: "ETH asks for research interests in more depth — added thesis section.",
        content: "Draft focused on research interests: CRDTs, consistency models, and systems for low-connectivity environments…" },
      { id: "v1", label: "v1 — General", createdAt: "2026-10-12", note: "First complete draft.", content: "General statement covering background, motivation and goals…" },
    ],
  },
  {
    id: "doc-cv", title: "Academic CV", kind: "CV", status: "Final", updatedAt: "2026-11-10",
    versions: [
      { id: "v2", label: "v2 — Europass", createdAt: "2026-11-10", fileName: "CV_Europass_2026-11.pdf", note: "Europass format for DAAD and German universities.", content: "" },
      { id: "v1", label: "v1 — Two-page academic", createdAt: "2026-10-05", fileName: "CV_academic.pdf", note: "Standard academic CV.", content: "" },
    ],
  },
  {
    id: "doc-motivation-daad", title: "DAAD motivation letter", kind: "Motivation letter", status: "Draft", updatedAt: "2026-11-15",
    versions: [
      { id: "v1", label: "v1", createdAt: "2026-11-15", note: "Must explain development relevance and plans to return.",
        content: "I am applying for the DAAD EPOS scholarship to pursue an M.Sc. in Informatics at TUM, with the aim of returning to strengthen digital infrastructure in public health…" },
    ],
  },
  {
    id: "doc-reco", title: "Recommendation letters", kind: "Recommendation letter", status: "In review", updatedAt: "2026-11-14",
    versions: [
      { id: "v1", label: "Referees", createdAt: "2026-11-14", note: "Prof. Rahman confirmed (sends directly). Second referee: Dr. Karim — asked on 12 Nov, awaiting reply.", content: "" },
    ],
  },
  {
    id: "doc-transcript", title: "Transcript & degree certificate", kind: "Transcript", status: "Final", updatedAt: "2026-09-30",
    versions: [{ id: "v1", label: "Certified copies", createdAt: "2026-09-30", fileName: "Transcript_certified.pdf", note: "Certified English translation included. Original kept at home.", content: "" }],
  },
  {
    id: "doc-ielts", title: "IELTS Academic result", kind: "Language certificate", status: "Final", updatedAt: "2026-10-20",
    versions: [{ id: "v1", label: "Overall 7.5", createdAt: "2026-10-20", fileName: "IELTS_TRF.pdf", note: "L 8.0 · R 7.5 · W 7.0 · S 7.0. Valid until Oct 2028.", content: "" }],
  },
  {
    id: "doc-passport", title: "Passport", kind: "Passport", status: "Final", updatedAt: "2026-08-01",
    versions: [{ id: "v1", label: "Scan", createdAt: "2026-08-01", fileName: "Passport_scan.pdf", note: "Expires 2031.", content: "" }],
  },
];
