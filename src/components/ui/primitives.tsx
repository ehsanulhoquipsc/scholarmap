"use client";

import Link from "next/link";
import { forwardRef, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bookmark, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Button ---------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }
>(function Button({ variant = "secondary", size = "md", className, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-[15px] [&_svg]:shrink-0",
        size === "sm" ? "h-7 px-2.5 text-[12.5px]" : "h-8 px-3 text-[13px]",
        variant === "primary" && "bg-accent text-white hover:bg-accent-hover",
        variant === "secondary" && "border border-line bg-bg text-fg hover:border-line-strong hover:bg-subtle",
        variant === "ghost" && "text-fg-muted hover:bg-muted hover:text-fg",
        variant === "danger" && "text-danger hover:bg-muted",
        className,
      )}
      {...props}
    />
  );
});

export function IconButton({
  label,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-muted hover:text-fg [&_svg]:size-[17px]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------- Form controls ---------- */

const controlBase =
  "w-full rounded-md border border-line bg-bg px-2.5 text-[13px] text-fg placeholder:text-fg-faint transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus-visible:outline-none";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(controlBase, "h-8", className)} {...props} />;
});

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlBase, "min-h-[88px] py-2 leading-relaxed", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("relative", className)}>
      <select className={cn(controlBase, "h-8 appearance-none pr-7")} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-fg-muted" />
    </div>
  );
}

export function Field({ label, children, hint, className }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[12px] font-medium text-fg-muted">{label}</span>
      {children}
      {hint && <span className="text-[11.5px] text-fg-faint">{hint}</span>}
    </label>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-fg-faint" />
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(controlBase, "h-8 pl-8 pr-7")}
      />
      {value && (
        <button
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-fg-faint hover:text-fg"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/* ---------- Badge ---------- */

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "outline";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded px-1.5 text-[11.5px] font-medium",
        tone === "neutral" && "bg-muted text-fg-muted",
        tone === "accent" && "bg-accent-soft text-accent",
        tone === "success" && "bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-success",
        tone === "warning" && "bg-[color-mix(in_srgb,var(--warning)_13%,transparent)] text-warning",
        tone === "danger" && "bg-[color-mix(in_srgb,var(--danger)_11%,transparent)] text-danger",
        tone === "outline" && "border border-line text-fg-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({ tone }: { tone: "open" | "upcoming" | "closed" }) {
  return (
    <span
      className={cn(
        "inline-block size-1.5 rounded-full",
        tone === "open" && "bg-success",
        tone === "upcoming" && "bg-warning",
        tone === "closed" && "bg-fg-faint",
      )}
    />
  );
}

/* ---------- Flag ---------- */

export function Flag({ code, size = 20, className }: { code?: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!code) return null;
  const h = Math.round(size * 0.72);
  if (failed)
    return (
      <span
        style={{ width: size, height: h, fontSize: Math.max(8, size * 0.38) }}
        className={cn("inline-flex shrink-0 items-center justify-center rounded-[3px] bg-muted font-medium text-fg-muted", className)}
      >
        {code}
      </span>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
      alt=""
      width={size}
      height={h}
      onError={() => setFailed(true)}
      style={{ width: size, height: h }}
      className={cn("shrink-0 rounded-[3px] object-cover ring-1 ring-black/5", className)}
    />
  );
}

/* ---------- Save (bookmark) toggle ---------- */

export function SaveToggle({ saved, onToggle, withLabel = false, className }: { saved: boolean; onToggle: () => void; withLabel?: boolean; className?: string }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save"}
      title={saved ? "Saved" : "Save"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md transition-colors",
        withLabel ? "h-8 border border-line px-3 text-[13px] font-medium hover:border-line-strong" : "size-8 hover:bg-muted",
        saved ? "text-accent" : "text-fg-muted hover:text-fg",
        className,
      )}
    >
      <Bookmark className={cn("size-[16px]", saved && "fill-current")} />
      {withLabel && (saved ? "Saved" : "Save")}
    </button>
  );
}

/* ---------- Tabs ---------- */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("thin-scroll flex gap-5 overflow-x-auto overflow-y-hidden border-b border-line", className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "relative -mb-px flex h-10 shrink-0 items-center gap-1.5 border-b text-[13.5px] transition-colors",
            value === t.value ? "border-fg text-fg" : "border-transparent text-fg-muted hover:text-fg",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="tabular text-[12px] text-fg-faint">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: React.ReactNode; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex h-8 items-center rounded-md bg-muted p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-[12.5px] transition-all [&_svg]:size-[14px]",
            value === o.value ? "bg-bg text-fg shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-fg-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Modal ---------- */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 560,
  side = false,
  header,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  /** Render as a right-hand side panel instead of a centred dialog. */
  side?: boolean;
  /** Extra controls next to the close button (side panels). */
  header?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  if (side)
    return createPortal(
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="anim-fade absolute inset-0 bg-black/15" onClick={onClose} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          style={{ maxWidth: width }}
          className="anim-slide relative flex h-full w-full flex-col border-l border-line bg-bg shadow-pop"
        >
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5 sm:px-6">
            <div className="min-w-0 pt-1">
              <h2 className="t-h2 leading-snug">{title}</h2>
              {description && <p className="mt-0.5 text-[12.5px] text-fg-muted">{description}</p>}
            </div>
            <div className="-mr-2 flex shrink-0 items-center gap-0.5">
              {header}
              <IconButton label="Close panel" onClick={onClose}>
                <X />
              </IconButton>
            </div>
          </div>
          <div className="thin-scroll flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:px-6">{footer}</div>}
        </div>
      </div>,
      document.body,
    );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-start sm:pt-[10vh]">
      <div className="anim-fade absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ maxWidth: width }}
        className="anim-pop relative flex max-h-[88vh] w-full flex-col rounded-t-xl border border-line bg-bg shadow-pop sm:mx-4 sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-5">
          <div>
            <h2 className="t-h2">{title}</h2>
            {description && <p className="mt-1 text-[13px] text-fg-muted">{description}</p>}
          </div>
          <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1">
            <X />
          </IconButton>
        </div>
        <div className="thin-scroll overflow-y-auto px-6 pb-6">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ---------- Dropdown menu ---------- */

export function Dropdown({
  trigger,
  children,
  align = "end",
  width = 220,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "start" | "end";
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          style={{ width }}
          className={cn(
            "anim-pop absolute top-[calc(100%+6px)] z-40 rounded-lg border border-line bg-bg p-1 shadow-pop",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  active,
  tone,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  tone?: "danger";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-muted [&_svg]:size-[15px] [&_svg]:text-fg-muted",
        active && "text-accent",
        tone === "danger" ? "text-danger" : "text-fg",
      )}
    >
      {children}
    </button>
  );
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-fg-faint">{children}</div>;
}

/* ---------- Layout helpers ---------- */

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="t-h1">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[14px] text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-14 text-center", className)}>
      {icon && <div className="mb-3 text-fg-faint [&_svg]:size-6">{icon}</div>}
      <p className="text-[14px] font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-fg-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function KeyValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(120px,170px)_1fr] gap-4 border-b border-line py-3 text-[13.5px] last:border-0">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children || <span className="text-fg-faint">—</span>}</dd>
    </div>
  );
}

export function Section({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("mt-10", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="t-h2">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: { id: number; message: string; action?: { label: string; href?: string; onClick?: () => void } }[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-5"
    >
      {toasts.map((t) => (
        <div key={t.id} className="anim-pop pointer-events-auto flex max-w-full items-center gap-3 rounded-lg bg-fg py-2 pl-3.5 pr-2 text-[13px] text-bg shadow-pop">
          <span className="truncate">{t.message}</span>
          {t.action &&
            (t.action.href ? (
              <Link
                href={t.action.href}
                onClick={() => onDismiss(t.id)}
                className="shrink-0 rounded-md px-2 py-1 font-medium text-[var(--toast-action)] hover:bg-white/10"
              >
                {t.action.label}
              </Link>
            ) : (
              <button
                onClick={() => {
                  t.action?.onClick?.();
                  onDismiss(t.id);
                }}
                className="shrink-0 rounded-md px-2 py-1 font-medium text-[var(--toast-action)] hover:bg-white/10"
              >
                {t.action.label}
              </button>
            ))}
          {!t.action && <span className="w-1.5" />}
        </div>
      ))}
    </div>
  );
}
