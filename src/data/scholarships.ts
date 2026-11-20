import type { Scholarship } from "@/lib/types";

type Seed = Omit<Scholarship, "notes" | "languages"> & { notes?: string; languages?: string[] };

const seed: Seed[] = [
  {
    id: "daad-epos", name: "DAAD EPOS — Development-Related Postgraduate Courses", provider: "German Academic Exchange Service (DAAD)", countryCode: "DE", source: "Government", coverage: "Fully funded", type: "Merit-based, development-related", degrees: ["Master", "PhD"],
    nationalities: "Developing countries listed by DAAD; at least two years of relevant work experience", tuition: "Full tuition and semester fees", stipend: "€934 / month (Master) · €1,300 / month (PhD)", stipendMonthly: 934, accommodation: "Rent subsidy where applicable", travel: "Travel allowance included", languages: ["English", "German"],
    languageReq: "IELTS 6.5 or TOEFL iBT 88 for English programs; German course funded before studies", academicReq: "Bachelor's degree, completed within the last six years, above-average grades", opens: "2026-08-01", deadline: "2026-12-31", durationLabel: "12–42 months", url: "https://www.daad.de/en/study-and-research-in-germany/scholarships/",
    notes: "Each listed course has its own deadline (Aug–Oct for most). Apply directly to the course, not to DAAD.",
  },
  {
    id: "deutschlandstipendium", name: "Deutschlandstipendium", provider: "Federal Ministry of Education and Research & private sponsors", countryCode: "DE", source: "Government", coverage: "Partially funded", type: "Merit-based", degrees: ["Bachelor", "Master"],
    nationalities: "All nationalities enrolled at participating German universities", tuition: "Not covered", stipend: "€300 / month", stipendMonthly: 300, accommodation: "Not covered", travel: "Not covered", languages: ["English", "German"],
    languageReq: "As required by the enrolled program", academicReq: "Outstanding academic performance and social engagement", opens: "2027-06-01", deadline: "2027-08-15", durationLabel: "12 months, renewable", url: "https://www.deutschlandstipendium.de",
  },
  {
    id: "heinrich-boell", name: "Heinrich Böll Foundation Scholarship", provider: "Heinrich Böll Stiftung", countryCode: "DE", source: "Foundation", coverage: "Fully funded", type: "Merit and values-based", degrees: ["Master", "PhD"],
    nationalities: "International students admitted to a German university", tuition: "Covered where applicable", stipend: "€934 / month (Master) · €1,450 / month (PhD)", stipendMonthly: 934, accommodation: "Included in stipend", travel: "Not covered", languages: ["German", "English"],
    languageReq: "German B2 for most applicants", academicReq: "Excellent grades and demonstrated social or political engagement aligned with the foundation's values", opens: "2027-01-01", deadline: "2027-03-01", durationLabel: "Standard program duration", url: "https://www.boell.de/en/scholarships",
  },
  {
    id: "holland", name: "Holland Scholarship", provider: "Dutch Ministry of Education & Dutch universities", countryCode: "NL", source: "Government", coverage: "Partially funded", type: "Merit-based", degrees: ["Bachelor", "Master"],
    nationalities: "Non-EEA students who have not previously studied in the Netherlands", tuition: "One-time €5,000 award", stipend: "None", stipendMonthly: 0, accommodation: "Not covered", travel: "Not covered", languages: ["English"],
    languageReq: "As required by the program", academicReq: "Admission to a participating Dutch university", opens: "2026-11-01", deadline: "2027-02-01", durationLabel: "First year only", url: "https://www.studyinnl.org/finances/holland-scholarship",
  },
  {
    id: "amsterdam-excellence", name: "Amsterdam Excellence Scholarships (AES)", provider: "University of Amsterdam", countryCode: "NL", universityId: "uva", source: "University", coverage: "Fully funded", type: "Merit-based", degrees: ["Master"],
    nationalities: "Non-EU students; top 10% of graduating class", tuition: "Full tuition", stipend: "€25,000 total for tuition and living costs", stipendMonthly: 0, accommodation: "Included in award", travel: "Not covered", languages: ["English"],
    languageReq: "As required by the program", academicReq: "Top 10% of class; nominated by the program", opens: "2026-10-01", deadline: "2027-01-15", durationLabel: "1–2 years", url: "https://www.uva.nl/en/education/fees-and-funding/masters-scholarships-and-loans",
    notes: "Must apply to the master's program first, then submit a separate AES application through the program.",
  },
  {
    id: "tud-excellence", name: "Justus & Louise van Effen Excellence Scholarship", provider: "Delft University of Technology", countryCode: "NL", universityId: "tu-delft", source: "University", coverage: "Fully funded", type: "Merit-based", degrees: ["Master"],
    nationalities: "Non-EU students admitted to a TU Delft MSc", tuition: "Full tuition", stipend: "€1,000 / month", stipendMonthly: 1000, accommodation: "Included in stipend", travel: "Not covered", languages: ["English"],
    languageReq: "IELTS 7.0 or TOEFL iBT 100", academicReq: "CGPA ≥ 80% of the scale maximum", opens: "2026-10-01", deadline: "2026-12-01", durationLabel: "2 years", url: "https://www.tudelft.nl/en/education/practical-matters/scholarships",
  },
  {
    id: "si-sisgp", name: "Swedish Institute Scholarships for Global Professionals", provider: "Swedish Institute", countryCode: "SE", source: "Government", coverage: "Fully funded", type: "Leadership and work experience", degrees: ["Master"],
    nationalities: "Citizens of eligible countries; minimum 3,000 hours of work experience", tuition: "Full tuition", stipend: "SEK 12,000 / month", stipendMonthly: 1050, accommodation: "Included in stipend", travel: "SEK 15,000 travel grant", languages: ["English"],
    languageReq: "As required by the program", academicReq: "Admitted to an eligible master's program; demonstrated leadership", opens: "2027-02-10", deadline: "2027-02-27", durationLabel: "1–2 years", url: "https://si.se/en/apply/scholarships/swedish-institute-scholarships-for-global-professionals/",
    notes: "Must apply to programs via universityadmissions.se by mid-January first.",
  },
  {
    id: "kth-scholarship", name: "KTH Scholarship", provider: "KTH Royal Institute of Technology", countryCode: "SE", universityId: "kth", source: "University", coverage: "Partially funded", type: "Merit-based", degrees: ["Master"],
    nationalities: "Non-EU/EEA fee-paying students", tuition: "Full tuition", stipend: "None", stipendMonthly: 0, accommodation: "Not covered", travel: "Not covered", languages: ["English"],
    languageReq: "English 6 (IELTS 6.5)", academicReq: "Excellent academic record; first choice must be a KTH program", opens: "2026-10-16", deadline: "2027-01-15", durationLabel: "2 years", url: "https://www.kth.se/en/studies/master/admission/scholarships",
  },
  {
    id: "lund-global", name: "Lund University Global Scholarship", provider: "Lund University", countryCode: "SE", universityId: "lund", source: "University", coverage: "Partially funded", type: "Merit-based", degrees: ["Bachelor", "Master"],
    nationalities: "Non-EU/EEA fee-paying students", tuition: "25%, 50%, 75% or 100% of tuition", stipend: "None", stipendMonthly: 0, accommodation: "Not covered", travel: "Not covered", languages: ["English"],
    languageReq: "As required by the program", academicReq: "Outstanding academic merit", opens: "2026-10-16", deadline: "2027-02-01", durationLabel: "Program duration", url: "https://www.lunduniversity.lu.se/admissions/bachelors-masters-studies/scholarships",
  },
  {
    id: "aalto-scholarship", name: "Aalto University Scholarship Programme", provider: "Aalto University", countryCode: "FI", universityId: "aalto", source: "University", coverage: "Partially funded", type: "Merit-based", degrees: ["Master"],
    nationalities: "Fee-paying students from outside the EU/EEA", tuition: "50% or 100% tuition waiver", stipend: "Up to €5,000 one-off relocation grant", stipendMonthly: 0, accommodation: "Not covered", travel: "Included in relocation grant", languages: ["English"],
    languageReq: "IELTS 6.5 or TOEFL 92", academicReq: "Top academic performance", opens: "2026-12-01", deadline: "2027-01-02", durationLabel: "2 years", url: "https://www.aalto.fi/en/study-at-aalto/scholarships-and-tuition-fees",
  },
  {
    id: "eiffel", name: "Eiffel Excellence Scholarship", provider: "Campus France / French Ministry for Europe and Foreign Affairs", countryCode: "FR", source: "Government", coverage: "Fully funded", type: "Merit-based", degrees: ["Master", "PhD"],
    nationalities: "Non-French citizens under 25 (Master) or 30 (PhD)", tuition: "Not covered — usually waived by host institution", stipend: "€1,181 / month (Master) · €1,700 / month (PhD)", stipendMonthly: 1181, accommodation: "Supplementary housing allowance", travel: "Return international flight", languages: ["French", "English"],
    languageReq: "French or English as required by the program", academicReq: "Nominated by a French higher education institution", opens: "2026-10-01", deadline: "2027-01-08", durationLabel: "12–36 months", url: "https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence",
    notes: "Candidates cannot apply directly — the French institution submits the nomination.",
  },
  {
    id: "maeci", name: "Invest Your Talent in Italy (MAECI)", provider: "Italian Ministry of Foreign Affairs", countryCode: "IT", source: "Government", coverage: "Fully funded", type: "Merit-based", degrees: ["Master", "PhD"],
    nationalities: "Citizens of eligible partner countries", tuition: "Tuition waived at partner universities", stipend: "€900 / month", stipendMonthly: 900, accommodation: "Included in stipend", travel: "Not covered", languages: ["English", "Italian"],
    languageReq: "English B2 or Italian B2", academicReq: "Bachelor's degree with good grades; admission to an Italian university", opens: "2027-02-01", deadline: "2027-05-30", durationLabel: "Up to 3 years", url: "https://studyinitaly.esteri.it",
  },
  {
    id: "chevening", name: "Chevening Scholarships", provider: "UK Foreign, Commonwealth & Development Office", countryCode: "GB", source: "Government", coverage: "Fully funded", type: "Leadership", degrees: ["Master"],
    nationalities: "Citizens of Chevening-eligible countries; two years of work experience", tuition: "Full tuition", stipend: "£1,401 / month (outside London)", stipendMonthly: 1650, accommodation: "Included in stipend", travel: "Economy return flight", languages: ["English"],
    languageReq: "Meet university's English requirement by July", academicReq: "Undergraduate degree enabling entry to UK master's; apply to three courses", opens: "2026-08-05", deadline: "2026-10-07", durationLabel: "12 months", url: "https://www.chevening.org/scholarships/",
    notes: "This cycle has closed. Next round opens early August 2027.",
  },
  {
    id: "commonwealth-masters", name: "Commonwealth Master's Scholarships", provider: "Commonwealth Scholarship Commission", countryCode: "GB", source: "Government", coverage: "Fully funded", type: "Development-focused", degrees: ["Master", "PhD"],
    nationalities: "Citizens of eligible low- and middle-income Commonwealth countries", tuition: "Full tuition", stipend: "£1,347 / month", stipendMonthly: 1580, accommodation: "Included in stipend", travel: "Return airfare", languages: ["English"],
    languageReq: "As required by the university", academicReq: "Upper second-class honours or equivalent", opens: "2026-09-15", deadline: "2026-10-14", durationLabel: "12 months", url: "https://cscuk.fcdo.gov.uk/scholarships/",
  },
  {
    id: "edinburgh-global", name: "Edinburgh Global Master's Scholarship", provider: "University of Edinburgh", countryCode: "GB", universityId: "edinburgh", source: "University", coverage: "Partially funded", type: "Merit-based", degrees: ["Master"],
    nationalities: "International fee-paying students", tuition: "£5,000 tuition discount", stipend: "None", stipendMonthly: 0, accommodation: "Not covered", travel: "Not covered", languages: ["English"],
    languageReq: "As required by the program", academicReq: "Offer of admission and excellent academic record", opens: "2026-11-01", deadline: "2027-04-01", durationLabel: "12 months", url: "https://www.ed.ac.uk/student-funding",
  },
  {
    id: "gois", name: "Government of Ireland International Education Scholarship", provider: "Higher Education Authority (HEA)", countryCode: "IE", source: "Government", coverage: "Fully funded", type: "Merit-based", degrees: ["Master", "PhD"],
    nationalities: "Non-EU/EEA students", tuition: "Full tuition", stipend: "€10,000 one-year stipend", stipendMonthly: 830, accommodation: "Included in stipend", travel: "Not covered", languages: ["English"],
    languageReq: "As required by the program", academicReq: "Excellent academic record; offer from an Irish institution", opens: "2027-01-15", deadline: "2027-03-12", durationLabel: "12 months", url: "https://hea.ie/policy/internationalisation/goi-ies/",
  },
  {
    id: "swiss-excellence", name: "Swiss Government Excellence Scholarships", provider: "Federal Commission for Scholarships (FCS)", countryCode: "CH", source: "Government", coverage: "Fully funded", type: "Research", degrees: ["PhD"],
    nationalities: "Researchers from 180+ countries; host professor letter required", tuition: "Tuition exemption", stipend: "CHF 1,920 / month", stipendMonthly: 2000, accommodation: "Housing allowance", travel: "Not covered", languages: ["English", "German", "French"],
    languageReq: "Language of the host institution", academicReq: "Master's degree and a research proposal supported by a Swiss host", opens: "2026-08-01", deadline: "2026-12-15", durationLabel: "12 months, renewable up to 3 years", url: "https://www.sbfi.admin.ch/scholarships_eng",
    notes: "Deadline varies by country — confirm with the local Swiss embassy.",
  },
  {
    id: "eth-esop", name: "ETH Excellence Scholarship & Opportunity Programme", provider: "ETH Zurich", countryCode: "CH", universityId: "eth", source: "University", coverage: "Fully funded", type: "Merit-based", degrees: ["Master"],
    nationalities: "All nationalities", tuition: "Full tuition waiver", stipend: "CHF 12,000 / semester", stipendMonthly: 2100, accommodation: "Included in stipend", travel: "Not covered", languages: ["English"],
    languageReq: "IELTS 7.0 or TOEFL 100", academicReq: "Top 10% of bachelor's class; applied at the same time as program application", opens: "2026-11-01", deadline: "2026-12-15", durationLabel: "Standard duration of master's", url: "https://ethz.ch/students/en/studies/financial/scholarships/excellencescholarship.html",
  },
  {
    id: "stipendium-hungaricum", name: "Stipendium Hungaricum", provider: "Tempus Public Foundation", countryCode: "HU", source: "Government", coverage: "Fully funded", type: "Bilateral agreement", degrees: ["Bachelor", "Master", "PhD"],
    nationalities: "Citizens of 90+ partner countries, nominated by the sending partner", tuition: "Full tuition", stipend: "HUF 43,700 / month (Bachelor, Master) · HUF 140,000 (PhD)", stipendMonthly: 115, accommodation: "Dormitory place or HUF 40,000 / month", travel: "Not covered", languages: ["English", "Hungarian"],
    languageReq: "As required by the program", academicReq: "Secondary school or bachelor's diploma; entrance exam at university", opens: "2026-11-01", deadline: "2027-01-15", durationLabel: "Program duration", url: "https://stipendiumhungaricum.hu",
  },
  {
    id: "turkiye-burslari", name: "Türkiye Bursları", provider: "Presidency for Turks Abroad and Related Communities (YTB)", countryCode: "TR", source: "Government", coverage: "Fully funded", type: "Merit-based", degrees: ["Bachelor", "Master", "PhD"],
    nationalities: "All nationalities except Turkish citizens", tuition: "Full tuition", stipend: "TRY 6,500 / month (Master)", stipendMonthly: 200, accommodation: "University dormitory", travel: "One-time round trip", languages: ["Turkish", "English"],
    languageReq: "One-year Turkish course provided", academicReq: "Minimum 75% for Master, 90% for Bachelor", opens: "2027-01-10", deadline: "2027-02-20", durationLabel: "Program + 1 year language", url: "https://www.turkiyeburslari.gov.tr",
  },
  {
    id: "fulbright", name: "Fulbright Foreign Student Program", provider: "U.S. Department of State", countryCode: "US", source: "Government", coverage: "Fully funded", type: "Merit-based", degrees: ["Master", "PhD"],
    nationalities: "Varies by country — applied through local Fulbright commission or U.S. Embassy", tuition: "Full tuition", stipend: "Living stipend varies by city", stipendMonthly: 1800, accommodation: "Included in stipend", travel: "Round-trip airfare", languages: ["English"],
    languageReq: "TOEFL iBT typically 80–100", academicReq: "Bachelor's degree; GRE or GMAT may be required", opens: "2027-02-01", deadline: "2027-05-15", durationLabel: "1–2 years (Master)", url: "https://foreign.fulbrightonline.org",
    notes: "Each country's commission sets its own timeline. Check the local commission site.",
  },
  {
    id: "lester-pearson", name: "Lester B. Pearson International Scholarship", provider: "University of Toronto", countryCode: "CA", universityId: "utoronto", source: "University", coverage: "Fully funded", type: "Merit and leadership", degrees: ["Bachelor"],
    nationalities: "International students in final year of secondary school", tuition: "Full tuition and incidental fees", stipend: "Residence and books for four years", stipendMonthly: 0, accommodation: "Full residence support", travel: "Not covered", languages: ["English"],
    languageReq: "English proficiency as required", academicReq: "Nominated by secondary school; exceptional achievement and creativity", opens: "2026-09-01", deadline: "2026-11-30", durationLabel: "4 years", url: "https://future.utoronto.ca/pearson/about",
  },
  {
    id: "australia-awards", name: "Australia Awards Scholarships", provider: "Department of Foreign Affairs and Trade (DFAT)", countryCode: "AU", source: "Government", coverage: "Fully funded", type: "Development-focused", degrees: ["Master", "PhD"],
    nationalities: "Citizens of participating Indo-Pacific countries", tuition: "Full tuition", stipend: "Contribution to Living Expenses (CLE) fortnightly", stipendMonthly: 1900, accommodation: "Establishment allowance", travel: "Return air travel", languages: ["English"],
    languageReq: "IELTS 6.5 overall, no band below 6.0", academicReq: "Bachelor's degree; two years of work experience for many countries", opens: "2027-02-01", deadline: "2027-04-30", durationLabel: "Program duration", url: "https://www.dfat.gov.au/people-to-people/australia-awards",
  },
  {
    id: "mext", name: "MEXT Scholarship (Embassy Recommendation)", provider: "Japanese Ministry of Education (MEXT)", countryCode: "JP", source: "Government", coverage: "Fully funded", type: "Merit-based", degrees: ["Bachelor", "Master", "PhD"],
    nationalities: "Citizens of countries with diplomatic relations with Japan, under 35", tuition: "Full tuition, entrance and exam fees", stipend: "¥144,000 / month (Master)", stipendMonthly: 900, accommodation: "Not covered", travel: "Economy return airfare", languages: ["Japanese", "English"],
    languageReq: "Willingness to learn Japanese; English programs accepted", academicReq: "GPA 2.3 / 3.0 or higher; written exam and interview at embassy", opens: "2027-04-01", deadline: "2027-05-31", durationLabel: "Up to 5 years incl. research student period", url: "https://www.studyinjapan.go.jp/en/smap-stopj-applications-research.html",
  },
  {
    id: "gks", name: "Global Korea Scholarship (GKS)", provider: "National Institute for International Education (NIIED)", countryCode: "KR", source: "Government", coverage: "Fully funded", type: "Merit-based", degrees: ["Bachelor", "Master", "PhD"],
    nationalities: "Citizens of GKS partner countries", tuition: "Full tuition", stipend: "KRW 1,000,000 / month", stipendMonthly: 700, accommodation: "Settlement allowance", travel: "Round-trip economy airfare", languages: ["Korean", "English"],
    languageReq: "One-year Korean language course included", academicReq: "CGPA ≥ 80% or top 20% of class", opens: "2027-02-01", deadline: "2027-03-15", durationLabel: "1 year language + program", url: "https://www.studyinkorea.go.kr",
  },
  {
    id: "kaist-intl", name: "KAIST International Student Scholarship", provider: "KAIST", countryCode: "KR", universityId: "kaist", source: "University", coverage: "Fully funded", type: "Admission-based", degrees: ["Master", "PhD"],
    nationalities: "All international admitted students", tuition: "Full tuition", stipend: "KRW 350,000 / month (Master)", stipendMonthly: 250, accommodation: "On-campus housing priority", travel: "Not covered", languages: ["English"],
    languageReq: "TOEFL iBT 83 or IELTS 6.5", academicReq: "Admission to a KAIST graduate program", opens: "2026-12-01", deadline: "2027-03-31", durationLabel: "Program duration", url: "https://admission.kaist.ac.kr/intl-graduate",
  },
  {
    id: "csc", name: "Chinese Government Scholarship (Type B)", provider: "China Scholarship Council", countryCode: "CN", source: "Government", coverage: "Fully funded", type: "Bilateral / university program", degrees: ["Bachelor", "Master", "PhD"],
    nationalities: "Non-Chinese citizens in good health", tuition: "Full tuition", stipend: "CNY 3,000 / month (Master)", stipendMonthly: 390, accommodation: "On-campus dormitory", travel: "Not covered", languages: ["Chinese", "English"],
    languageReq: "HSK 4 for Chinese-taught programs; IELTS 6.0 for English-taught", academicReq: "Bachelor's degree and two recommendation letters", opens: "2026-12-15", deadline: "2027-03-31", durationLabel: "Program duration", url: "https://www.campuschina.org",
  },
  {
    id: "singa", name: "Singapore International Graduate Award (SINGA)", provider: "A*STAR, NUS, NTU and SUTD", countryCode: "SG", source: "Government", coverage: "Fully funded", type: "Research", degrees: ["PhD"],
    nationalities: "International graduates with a passion for research", tuition: "Full tuition", stipend: "SGD 2,700 / month", stipendMonthly: 1850, accommodation: "One-time settling-in allowance SGD 1,000", travel: "One-time airfare grant up to SGD 1,500", languages: ["English"],
    languageReq: "IELTS 6.0 or TOEFL iBT 85", academicReq: "Bachelor's or master's with excellent results in science or engineering", opens: "2026-12-01", deadline: "2027-06-01", durationLabel: "4 years", url: "https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa",
  },
];

export const scholarships: Scholarship[] = seed.map((s) => ({
  notes: "",
  ...s,
  languages: s.languages ?? ["English"],
}));
