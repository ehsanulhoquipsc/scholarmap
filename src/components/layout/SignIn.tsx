"use client";

import { useState } from "react";
import { CloudOff, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import type { Cloud, CloudStatus } from "@/lib/cloudSync";
import { cn } from "@/lib/utils";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-[18px]" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function GoogleButton({ cloud, className }: { cloud: Cloud; className?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      className={cn("h-10 gap-2.5 px-4 text-[14px]", className)}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await cloud.signIn();
        } finally {
          setBusy(false);
        }
      }}
    >
      <GoogleMark /> {busy ? "Opening Google…" : "Continue with Google"}
    </Button>
  );
}

/** Full-screen welcome shown when Firebase is set up and nobody is signed in. */
export function SignInScreen({ cloud }: { cloud: Cloud }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-subtle px-4">
      <div className="anim-fade w-full max-w-[400px] rounded-2xl border border-line bg-bg p-8 text-center shadow-pop sm:p-10">
        <span className="mx-auto mb-6 flex size-11 items-center justify-center rounded-full border-2 border-fg">
          <span className="relative flex size-full items-center justify-center">
            <span className="absolute h-full w-[18px] rounded-[50%] border-2 border-fg" />
            <span className="absolute h-[2px] w-full bg-fg" />
            <span className="absolute right-[3px] top-[3px] size-[9px] rounded-full bg-accent" />
          </span>
        </span>
        <h1 className="t-h1">ScholarMap</h1>
        <p className="mx-auto mt-2 max-w-[300px] text-[14px] text-fg-muted">
          Sign in to keep your research, applications and documents in sync across your devices.
        </p>
        <GoogleButton cloud={cloud} className="mt-8 w-full" />
        <button onClick={cloud.useLocalOnly} className="mt-4 text-[13px] text-fg-muted hover:text-fg">
          Use on this device only
        </button>
        <p className="mt-8 text-[11.5px] leading-relaxed text-fg-faint">
          Your data is private to your Google account. Nothing is shared or published.
        </p>
      </div>
    </div>
  );
}

const STATUS_COPY: Record<CloudStatus, { label: string; tone: string }> = {
  disabled: { label: "This device only", tone: "bg-fg-faint" },
  "signed-out": { label: "Not signed in", tone: "bg-fg-faint" },
  loading: { label: "Connecting…", tone: "bg-warning" },
  synced: { label: "All changes saved", tone: "bg-success" },
  syncing: { label: "Saving…", tone: "bg-warning" },
  offline: { label: "Offline — will sync", tone: "bg-fg-faint" },
  error: { label: "Sync problem", tone: "bg-danger" },
};

export function SyncStatus({ cloud, compact = false }: { cloud: Cloud; compact?: boolean }) {
  const s = STATUS_COPY[cloud.status];
  const Icon = cloud.status === "offline" ? CloudOff : cloud.status === "error" ? TriangleAlert : cloud.status === "syncing" ? RefreshCw : null;
  if (compact)
    return <span title={s.label} aria-label={s.label} className={cn("block size-2 rounded-full ring-2 ring-bg", s.tone, cloud.status === "syncing" && "animate-pulse")} />;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-fg-muted">
      {Icon ? <Icon className={cn("size-3.5", cloud.status === "syncing" && "animate-spin", cloud.status === "error" && "text-danger")} /> : <span className={cn("size-1.5 rounded-full", s.tone)} />}
      {s.label}
    </span>
  );
}
