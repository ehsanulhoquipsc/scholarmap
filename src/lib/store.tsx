"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { universities as seedUniversities } from "@/data/universities";
import { programs as seedPrograms } from "@/data/programs";
import { scholarships as seedScholarships } from "@/data/scholarships";
import { seedApplications, seedDocuments, seedNotes, seedSaved } from "@/data/workspace";
import type { Application, CompareItem, DocumentRecord, Note, Program, Scholarship, University } from "@/lib/types";
import { type Cloud, useCloudSync } from "@/lib/cloudSync";

export type SavedKind = "universities" | "programs" | "scholarships" | "countries";

export type Theme = "light" | "dark" | "system";

type State = {
  universities: University[];
  programs: Program[];
  scholarships: Scholarship[];
  applications: Application[];
  notes: Note[];
  documents: DocumentRecord[];
  saved: Record<SavedKind, string[]>;
  compare: CompareItem[];
  theme: Theme;
};

export type SyncableState = State;

const initialState: State = {
  universities: seedUniversities,
  programs: seedPrograms,
  scholarships: seedScholarships,
  applications: seedApplications,
  notes: seedNotes,
  documents: seedDocuments,
  saved: seedSaved,
  compare: [
    { kind: "scholarship", id: "daad-epos" },
    { kind: "scholarship", id: "si-sisgp" },
    { kind: "scholarship", id: "eth-esop" },
  ],
  theme: "light",
};

export const STORAGE_KEY = "scholarmap:v1";

export type ToastAction = { label: string; href?: string; onClick?: () => void };
export type Toast = { id: number; message: string; action?: ToastAction };

/** Ids that ship with the prototype — anything else was added by you. */
export const SAMPLE_IDS = new Set<string>([
  ...seedUniversities.map((x) => x.id),
  ...seedPrograms.map((x) => x.id),
  ...seedScholarships.map((x) => x.id),
  ...seedApplications.map((x) => x.id),
  ...seedNotes.map((x) => x.id),
  ...seedDocuments.map((x) => x.id),
]);

type Store = State & {
  hydrated: boolean;
  /** Saved data (and, when signed in, your cloud data) has loaded. */
  ready: boolean;
  cloud: Cloud;
  toggleSaved: (kind: SavedKind, id: string) => void;
  isSaved: (kind: SavedKind, id: string) => boolean;
  upsertUniversity: (u: University) => void;
  upsertProgram: (p: Program) => void;
  upsertScholarship: (s: Scholarship) => void;
  upsertApplication: (a: Application) => void;
  removeApplication: (id: string) => void;
  upsertNote: (n: Note) => void;
  removeNote: (id: string) => void;
  upsertDocument: (d: DocumentRecord) => void;
  removeDocument: (id: string) => void;
  toggleCompare: (item: CompareItem) => void;
  setCompare: (items: CompareItem[]) => void;
  setTheme: (t: Theme) => void;
  reset: () => void;
  toast: (message: string, action?: ToastAction, ms?: number) => void;
  /** Run a change and offer Undo, restoring only the listed parts of state. */
  undoable: (message: string, keys: (keyof State)[], change: () => void) => void;
  dismissToast: (id: number) => void;
  toasts: Toast[];
};

const StoreContext = createContext<Store | null>(null);

function upsert<T extends { id: string }>(list: T[], item: T) {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [item, ...list];
  const next = list.slice();
  next[i] = item;
  return next;
}

const stamp = <T,>(x: T): T => ({ ...x, editedAt: new Date().toISOString() });

const SAVED_COPY: Record<SavedKind, { saved: string; removed: string; href: string }> = {
  universities: { saved: "University saved", removed: "University removed from saved", href: "/universities?saved=1" },
  programs: { saved: "Program saved", removed: "Program removed from saved", href: "/programs?saved=1" },
  scholarships: { saved: "Scholarship saved", removed: "Scholarship removed from saved", href: "/scholarships?saved=1" },
  countries: { saved: "Added to favourites", removed: "Removed from favourites", href: "/countries?scope=favourites" },
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load persisted prototype state after mount (keeps SSR markup consistent).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<State>;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState((s) => ({ ...s, ...parsed }));
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  // Theme: applied as data-theme on <html> (an inline script in <head> sets it before first paint).
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    const apply = () => {
      const dark = state.theme === "dark" || (state.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    if (state.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [state.theme, hydrated]);

  const resetLocal = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setState(initialState);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message: string, action?: ToastAction, ms?: number) => {
      const id = ++toastId.current;
      // keep at most three on screen
      setToasts((t) => [...t.slice(-2), { id, message, action }]);
      setTimeout(() => dismissToast(id), ms ?? (action ? 5000 : 2600));
    },
    [dismissToast],
  );

  const undoable = useCallback(
    (message: string, keys: (keyof State)[], change: () => void) => {
      const snapshot = Object.fromEntries(keys.map((k) => [k, stateRef.current[k]])) as Partial<State>;
      change();
      toast(message, { label: "Undo", onClick: () => setState((s) => ({ ...s, ...snapshot })) }, 6000);
    },
    [toast],
  );

  const toggleSaved = useCallback(
    (kind: SavedKind, id: string) => {
      const has = stateRef.current.saved[kind].includes(id);
      const apply = () =>
        setState((s) => {
          const list = s.saved[kind];
          return { ...s, saved: { ...s.saved, [kind]: has ? list.filter((x) => x !== id) : [id, ...list] } };
        });
      if (has) undoable(SAVED_COPY[kind].removed, ["saved"], apply);
      else {
        apply();
        toast(SAVED_COPY[kind].saved, { label: "View saved", href: SAVED_COPY[kind].href });
      }
    },
    [toast, undoable],
  );

  const toggleCompare = useCallback(
    (item: CompareItem) => {
      const s = stateRef.current;
      const has = s.compare.some((c) => c.kind === item.kind && c.id === item.id);
      if (has) {
        undoable("Removed from comparison", ["compare"], () =>
          setState((st) => ({ ...st, compare: st.compare.filter((c) => !(c.kind === item.kind && c.id === item.id)) })),
        );
        return;
      }
      if (s.compare.length >= 3) {
        toast("You can compare up to three items.", { label: "Open compare", href: "/compare" });
        return;
      }
      setState((st) => ({ ...st, compare: [...st.compare, item] }));
      toast(`Added to comparison (${s.compare.length + 1}/3)`, { label: "Compare", href: "/compare" });
    },
    [toast, undoable],
  );

  const { cloud, ready } = useCloudSync({ state, setState, hydrated, toast, resetLocal });

  const value = useMemo<Store>(
    () => ({
      ...state,
      hydrated,
      ready,
      cloud,
      toasts,
      toast,
      undoable,
      dismissToast,
      toggleSaved,
      isSaved: (kind, id) => state.saved[kind].includes(id),
      upsertUniversity: (u) => setState((s) => ({ ...s, universities: upsert(s.universities, stamp(u)) })),
      upsertProgram: (p) => setState((s) => ({ ...s, programs: upsert(s.programs, stamp(p)) })),
      upsertScholarship: (x) => setState((s) => ({ ...s, scholarships: upsert(s.scholarships, stamp(x)) })),
      upsertApplication: (a) => setState((s) => ({ ...s, applications: upsert(s.applications, stamp(a)) })),
      removeApplication: (id) =>
        undoable("Application removed", ["applications"], () =>
          setState((s) => ({ ...s, applications: s.applications.filter((a) => a.id !== id) })),
        ),
      upsertNote: (n) => setState((s) => ({ ...s, notes: upsert(s.notes, stamp(n)) })),
      removeNote: (id) => undoable("Note deleted", ["notes"], () => setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }))),
      upsertDocument: (d) => setState((s) => ({ ...s, documents: upsert(s.documents, stamp(d)) })),
      removeDocument: (id) =>
        undoable("Document deleted", ["documents", "applications"], () =>
          setState((s) => ({
            ...s,
            documents: s.documents.filter((d) => d.id !== id),
            // unlink from any application checklist
            applications: s.applications.map((a) => ({
              ...a,
              checklist: a.checklist.map((c) => (c.documentId === id ? { ...c, documentId: undefined } : c)),
            })),
          })),
        ),
      toggleCompare,
      setCompare: (items) => setState((s) => ({ ...s, compare: items.slice(0, 3) })),
      setTheme: (theme) => setState((s) => ({ ...s, theme })),
      reset: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        setState(initialState);
      },
    }),
    [state, hydrated, ready, cloud, toasts, toast, undoable, dismissToast, toggleSaved, toggleCompare],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

/** Lookups and derived data used across pages. */
export function useLookups() {
  const { universities, programs, scholarships, notes, saved } = useStore();
  return useMemo(() => {
    const uniById = Object.fromEntries(universities.map((u) => [u.id, u]));
    const programById = Object.fromEntries(programs.map((p) => [p.id, p]));
    const scholarshipById = Object.fromEntries(scholarships.map((s) => [s.id, s]));

    // Countries with any saved research (drives the map indicator + "explored" stat)
    const researched = new Set<string>(saved.countries);
    saved.universities.forEach((id) => uniById[id] && researched.add(uniById[id].countryCode));
    saved.programs.forEach((id) => {
      const u = programById[id] && uniById[programById[id].universityId];
      if (u) researched.add(u.countryCode);
    });
    saved.scholarships.forEach((id) => scholarshipById[id] && researched.add(scholarshipById[id].countryCode));
    notes.forEach((n) => n.countryCode && researched.add(n.countryCode));

    const programCountry = (p: Program) => uniById[p.universityId]?.countryCode;
    return { uniById, programById, scholarshipById, researched, programCountry };
  }, [universities, programs, scholarships, notes, saved]);
}
