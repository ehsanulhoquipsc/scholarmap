import countriesLib from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import { countryByCode } from "@/data/countries";

countriesLib.registerLocale(en);

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const NAME_OVERRIDES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  KR: "South Korea",
  KP: "North Korea",
  RU: "Russia",
  IR: "Iran",
  SY: "Syria",
  VE: "Venezuela",
  BO: "Bolivia",
  TZ: "Tanzania",
  VN: "Vietnam",
  LA: "Laos",
  MD: "Moldova",
  CZ: "Czechia",
  TW: "Taiwan",
  TR: "Türkiye",
  XK: "Kosovo",
  CD: "DR Congo",
  CG: "Congo",
};

export function countryName(code?: string) {
  if (!code) return "";
  return countryByCode[code]?.name ?? NAME_OVERRIDES[code] ?? countriesLib.getName(code, "en", { select: "official" }) ?? code;
}

export function numericToAlpha2(id?: string | number) {
  if (id === undefined) return undefined;
  return countriesLib.numericToAlpha2(String(id).padStart(3, "0"));
}

export function allCountryCodes() {
  return Object.keys(countriesLib.getAlpha2Codes());
}

const TODAY = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export function daysUntil(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return Math.round((d.getTime() - TODAY().getTime()) / 86400000);
}

export function formatDate(iso: string, opts: { year?: boolean } = {}) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(opts.year === false ? {} : { year: "numeric" }) });
}

export function relativeDeadline(iso: string) {
  const n = daysUntil(iso);
  if (n < 0) return "Closed";
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n < 60) return `${n} days left`;
  return `${Math.round(n / 30)} months left`;
}

export type WindowStatus = "Open" | "Upcoming" | "Closed";
export function windowStatus(opens: string, deadline: string): WindowStatus {
  if (daysUntil(deadline) < 0) return "Closed";
  if (daysUntil(opens) > 0) return "Upcoming";
  return "Open";
}

export function formatDuration(months: number) {
  if (months % 12 === 0) return `${months / 12} year${months === 12 ? "" : "s"}`;
  return `${months} months`;
}

export function formatEUR(n: number) {
  if (n === 0) return "Free";
  return `€${n.toLocaleString("en-GB")}`;
}

/** "just now", "5 min ago", "3 h ago", "yesterday", "12 Nov" */
export function timeAgo(isoDateTime: string, now = Date.now()) {
  const t = new Date(isoDateTime).getTime();
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
