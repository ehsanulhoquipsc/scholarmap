"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export function DetailShell({
  back,
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  aside,
  provenance,
}: {
  back: { href: string; label: string };
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
  provenance?: React.ReactNode;
}) {
  return (
    <div>
      <Link href={back.href} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg">
        <ArrowLeft className="size-3.5" /> {back.label}
      </Link>
      <header className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px] text-fg-muted">{eyebrow}</div>}
          <h1 className="t-display max-w-3xl">{title}</h1>
          {subtitle && <div className="mt-2.5 text-[14px] text-fg-muted">{subtitle}</div>}
          {provenance && <div className="mt-3">{provenance}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="grid gap-12 pt-8 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">{children}</div>
        {aside && <aside className="space-y-8 text-[13px] lg:pt-1">{aside}</aside>}
      </div>
    </div>
  );
}

export function ExternalLinkRow({ href, label }: { href: string; label: string }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="group flex items-center justify-between border-b border-line py-2.5 text-[13px] last:border-0 hover:text-accent">
      {label}
      <ArrowUpRight className="size-3.5 text-fg-faint group-hover:text-accent" />
    </a>
  );
}

export function NotFound({ what, href }: { what: string; href: string }) {
  return (
    <div className="py-24 text-center">
      <p className="t-h2">This {what} doesn’t exist or was removed.</p>
      <Link href={href} className="mt-3 inline-block text-[13px] text-accent">
        Back to all {what === "university" ? "universities" : what + "s"}
      </Link>
    </div>
  );
}

export function AsideBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="t-eyebrow mb-2">{title}</div>
      {children}
    </div>
  );
}
