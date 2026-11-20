"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Select } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export type FilterDef = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  hidden?: boolean;
};

/** Compact row of select filters. "" means "any". */
export function FilterBar({
  filters,
  values,
  onChange,
  search,
  trailing,
}: {
  filters: FilterDef[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  search?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const visible = filters.filter((f) => !f.hidden);
  const activeCount = visible.filter((f) => values[f.key]).length;
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center gap-2">
        {search && <div className="min-w-[200px] flex-1 sm:max-w-[300px]">{search}</div>}
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[13px] transition-colors md:hidden",
            activeCount ? "border-accent-line bg-accent-soft text-accent" : "border-line text-fg-muted",
          )}
        >
          <SlidersHorizontal className="size-3.5" /> Filters{activeCount ? ` · ${activeCount}` : ""}
        </button>
        <div className={cn("w-full flex-wrap items-center gap-2 md:flex md:w-auto", open ? "grid grid-cols-2" : "hidden")}>
          {visible.map((f) => (
            <Select
              key={f.key}
              aria-label={f.label}
              value={values[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
              className={cn("md:w-auto md:max-w-[190px]", values[f.key] && "[&_select]:border-accent-line [&_select]:bg-accent-soft/50 [&_select]:text-accent")}
            >
              <option value="">{f.label}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          ))}
          {activeCount > 0 && (
            <button
              onClick={() => visible.forEach((f) => onChange(f.key, ""))}
              className="flex h-8 items-center gap-1 px-1.5 text-[12.5px] text-fg-muted hover:text-fg"
            >
              <X className="size-3.5" /> Clear
            </button>
          )}
        </div>
        {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
      </div>
    </div>
  );
}

export function useFilters(initial: Record<string, string> = {}) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  // Allow deep links like ?saved=1 or ?country=DE without a Suspense boundary
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl: Record<string, string> = {};
    params.forEach((v, k) => (fromUrl[k] = v));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (Object.keys(fromUrl).length) setValues((s) => ({ ...s, ...fromUrl }));
  }, []);
  return [values, (key: string, value: string) => setValues((s) => ({ ...s, [key]: value }))] as const;
}

export function ResultCount({ shown, total, noun }: { shown: number; total: number; noun: string }) {
  return (
    <p className="mb-2 text-[12.5px] text-fg-muted tabular">
      {shown === total ? `${total} ${noun}` : `${shown} of ${total} ${noun}`}
    </p>
  );
}

export function SortHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  return (
    <button onClick={onClick} className={cn("inline-flex items-center gap-1 hover:text-fg", active && "text-fg", className)}>
      {label}
      <span className={cn("text-[10px]", !active && "opacity-0")}>{dir === "asc" ? "↑" : "↓"}</span>
    </button>
  );
}
