/** Client-side file exports: CSV for lists, iCalendar (.ics) for deadlines. */

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- CSV ---------- */

export type CsvColumn<T> = { header: string; value: (row: T) => string | number | undefined | null };

function csvCell(v: string | number | undefined | null) {
  const s = v === undefined || v === null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV<T>(rows: T[], columns: CsvColumn<T>[]) {
  const head = columns.map((c) => csvCell(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => csvCell(c.value(r))).join(","));
  // BOM so Excel opens UTF-8 (accents, €, ü) correctly
  return "\uFEFF" + [head, ...body].join("\r\n");
}

export function exportCSV<T>(filename: string, rows: T[], columns: CsvColumn<T>[]) {
  downloadFile(filename, toCSV(rows, columns), "text/csv;charset=utf-8");
}

/* ---------- iCalendar ---------- */

export type CalendarEvent = {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd, all-day
  description?: string;
  url?: string;
  /** Days before the date to remind. */
  reminders?: number[];
};

function icsEscape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// RFC 5545: lines longer than 75 octets are folded
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  out.push(rest);
  return out.join("\r\n");
}

const compact = (iso: string) => iso.replace(/-/g, "");
function nextDay(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function buildICS(events: CalendarEvent[], calName = "ScholarMap deadlines") {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ScholarMap//Prototype//EN", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${icsEscape(calName)}`];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@scholarmap.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(e.date)}`,
      `DTEND;VALUE=DATE:${compact(nextDay(e.date))}`,
      `SUMMARY:${icsEscape(e.title)}`,
    );
    if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    for (const days of e.reminders ?? [7, 1]) {
      lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEscape(e.title)}`, `TRIGGER:-P${days}D`, "END:VALARM");
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function exportICS(filename: string, events: CalendarEvent[]) {
  downloadFile(filename, buildICS(events), "text/calendar;charset=utf-8");
}

export function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "export";
}
