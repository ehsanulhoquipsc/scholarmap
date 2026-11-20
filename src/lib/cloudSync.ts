"use client";

/**
 * Firestore sync for the store.
 *
 * Layout (one private space per Google account):
 *   users/{uid}/meta/state                 { saved, compare, theme, initializedAt }
 *   users/{uid}/{collection}/{recordId}    one document per record
 *
 * Catalogue collections (universities, programs, scholarships) ship as sample data in the
 * code; only records you added or edited are stored. Personal collections (applications,
 * notes, documents) are stored in full.
 *
 * Local edits are diffed against what was last synced and written in debounced batches.
 * Firestore's offline cache queues writes while offline and replays them later.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase";
import { checkAccess, type Role } from "@/lib/people";
import { universities as seedUniversities } from "@/data/universities";
import { programs as seedPrograms } from "@/data/programs";
import { scholarships as seedScholarships } from "@/data/scholarships";
import { seedApplications, seedDocuments, seedNotes } from "@/data/workspace";
import type { SyncableState } from "@/lib/store";

const CATALOGUE = ["universities", "programs", "scholarships"] as const;
const PERSONAL = ["applications", "notes", "documents"] as const;
const COLLECTIONS = [...CATALOGUE, ...PERSONAL] as const;
type Coll = (typeof COLLECTIONS)[number];
type Rec = { id: string; editedAt?: string; updatedAt?: string };

const SEEDS: Record<(typeof CATALOGUE)[number], Rec[]> = {
  universities: seedUniversities,
  programs: seedPrograms,
  scholarships: seedScholarships,
};
const SEED_IDS = new Set(Object.values(SEEDS).flatMap((l) => l.map((x) => x.id)));
const isCatalogue = (c: Coll) => (CATALOGUE as readonly string[]).includes(c);

/** Catalogue records are only stored once you've added or edited them. */
const shouldStore = (c: Coll, r: Rec) => !isCatalogue(c) || !!r.editedAt || !SEED_IDS.has(r.id);
const clean = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

const DEMO_IDS = new Set([...seedApplications, ...seedNotes, ...seedDocuments].map((x) => x.id));
export const EMPTY_SAVED = { universities: [], programs: [], scholarships: [], countries: [] };

/** A fresh account's starting point: the catalogue, minus all demo personal data. */
export function cleanStart(s: SyncableState): SyncableState {
  const mine = <T extends { id: string }>(list: T[]) => list.filter((x) => !DEMO_IDS.has(x.id));
  return {
    ...s,
    applications: mine(s.applications),
    notes: mine(s.notes),
    documents: mine(s.documents),
    saved: EMPTY_SAVED,
    compare: [],
  };
}
const metaOf = (s: SyncableState) => ({ saved: s.saved, compare: s.compare, theme: s.theme });

export type CloudUser = { uid: string; name: string; email: string; photo?: string };
export type CloudStatus = "disabled" | "loading" | "signed-out" | "no-access" | "synced" | "syncing" | "offline" | "error";

export type Cloud = {
  configured: boolean;
  status: CloudStatus;
  user: CloudUser | null;
  /** admin = can invite people; member = invited; none = signed in but not invited. */
  role: Role;
  /** Chose "use on this device only" on the sign-in screen. */
  localOnly: boolean;
  error?: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  useLocalOnly: () => void;
};

const LOCAL_ONLY_KEY = "scholarmap:local-only";

export function useCloudSync({
  state,
  setState,
  hydrated,
  toast,
  resetLocal,
}: {
  state: SyncableState;
  setState: (fn: (s: SyncableState) => SyncableState) => void;
  hydrated: boolean;
  toast: (message: string) => void;
  resetLocal: () => void;
}) {
  const [status, setStatus] = useState<CloudStatus>(isFirebaseConfigured ? "loading" : "disabled");
  const [user, setUser] = useState<CloudUser | null>(null);
  const [role, setRole] = useState<Role>("none");
  const [error, setError] = useState<string>();
  const [localOnly, setLocalOnly] = useState(false);

  const uidRef = useRef<string | null>(null);
  const initialised = useRef(false); // remote data has been merged into state
  const lastSynced = useRef(new Map<string, string>()); // "coll/id" | "meta" → JSON
  const remote = useRef<Record<Coll, Map<string, Rec>>>(Object.fromEntries(COLLECTIONS.map((c) => [c, new Map()])) as never);
  const unsubs = useRef<(() => void)[]>([]);
  const pending = useRef(0);
  const online = useRef(true);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const refreshStatus = useCallback(() => {
    if (!uidRef.current || !initialised.current) return;
    setStatus(!online.current ? "offline" : pending.current > 0 ? "syncing" : "synced");
  }, []);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalOnly(localStorage.getItem(LOCAL_ONLY_KEY) === "1");
    } catch {}
  }, []);

  /* ---------- building state from remote ---------- */

  const rebuild = useCallback((c: Coll, prev: SyncableState): SyncableState => {
    const map = remote.current[c];
    let list: Rec[];
    if (isCatalogue(c)) {
      const seed = SEEDS[c as (typeof CATALOGUE)[number]];
      const seedIds = new Set(seed.map((x) => x.id));
      const added = [...map.values()].filter((r) => !seedIds.has(r.id));
      list = [...added, ...seed.map((x) => map.get(x.id) ?? x)];
    } else {
      list = [...map.values()].sort((a, b) => (b.editedAt ?? b.updatedAt ?? "").localeCompare(a.editedAt ?? a.updatedAt ?? ""));
    }
    return { ...prev, [c]: list } as SyncableState;
  }, []);

  /* ---------- writing local changes ---------- */

  const flush = useCallback(async () => {
    const uid = uidRef.current;
    if (!uid || !initialised.current) return;
    const s = stateRef.current;
    const fb = await getFirebase();
    const { doc, writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(fb.db);
    let ops = 0;

    for (const c of COLLECTIONS) {
      const list = (s[c] as Rec[]).filter((r) => shouldStore(c, r));
      const ids = new Set<string>();
      for (const r of list) {
        ids.add(r.id);
        const key = `${c}/${r.id}`;
        const json = JSON.stringify(r);
        if (lastSynced.current.get(key) !== json) {
          batch.set(doc(fb.db, "users", uid, c, r.id), clean(r));
          lastSynced.current.set(key, json);
          remote.current[c].set(r.id, r);
          ops++;
        }
      }
      for (const key of [...lastSynced.current.keys()]) {
        if (!key.startsWith(c + "/")) continue;
        const id = key.slice(c.length + 1);
        if (!ids.has(id)) {
          batch.delete(doc(fb.db, "users", uid, c, id));
          lastSynced.current.delete(key);
          remote.current[c].delete(id);
          ops++;
        }
      }
    }
    const meta = JSON.stringify(metaOf(s));
    if (lastSynced.current.get("meta") !== meta) {
      batch.set(doc(fb.db, "users", uid, "meta", "state"), { ...clean(metaOf(s)), initializedAt: new Date().toISOString() }, { merge: true });
      lastSynced.current.set("meta", meta);
      ops++;
    }
    if (!ops) return;

    pending.current++;
    refreshStatus();
    try {
      // Resolves when the server confirms; while offline it waits in Firestore's queue.
      await batch.commit();
      setError(undefined);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus("error");
      toast(msg.includes("permission") ? "Sync blocked — check the Firestore security rules." : "Couldn't sync your last change.");
      lastSynced.current.clear(); // force a full re-diff on the next change
    } finally {
      pending.current--;
      refreshStatus();
    }
  }, [refreshStatus, toast]);

  // Debounced write after every local change
  useEffect(() => {
    if (!uidRef.current || !initialised.current) return;
    const t = setTimeout(() => void flush(), 500);
    return () => clearTimeout(t);
  }, [state, flush]);

  // Don't lose the last keystrokes when the tab is hidden or closed
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && void flush();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  useEffect(() => {
    const on = () => {
      online.current = navigator.onLine;
      refreshStatus();
    };
    on();
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, [refreshStatus]);

  /* ---------- auth + listeners ---------- */

  const stopListening = () => {
    unsubs.current.forEach((u) => u());
    unsubs.current = [];
  };

  const startListening = useCallback(
    async (uid: string) => {
      const fb = await getFirebase();
      const { collection, doc, onSnapshot } = await import("firebase/firestore");
      const firstSeen = new Set<string>();
      let metaExists: boolean | null = null;
      let metaData: Partial<SyncableState> | null = null;

      const maybeInitialise = async () => {
        if (initialised.current || metaExists === null || firstSeen.size < COLLECTIONS.length) return;
        if (!metaExists) {
          // New account: start with a clean workspace — the university, program and
          // scholarship database stays, but no demo applications, notes, documents or
          // saved items. Anything this device created itself (not demo data) is kept.
          const clean = cleanStart(stateRef.current);
          stateRef.current = clean;
          setState(() => clean);
          initialised.current = true;
          lastSynced.current.clear();
          await flush();
          toast("Welcome to ScholarMap — your workspace is ready");
        } else {
          // Account already has data: it wins over this device's copy.
          setState((prev) => {
            let next = prev;
            for (const c of COLLECTIONS) next = rebuild(c, next);
            if (metaData) next = { ...next, saved: metaData.saved ?? next.saved, compare: metaData.compare ?? next.compare, theme: metaData.theme ?? next.theme };
            return next;
          });
          if (metaData) lastSynced.current.set("meta", JSON.stringify({ saved: metaData.saved, compare: metaData.compare, theme: metaData.theme }));
          initialised.current = true;
        }
        refreshStatus();
      };

      // No connection and nothing cached yet: show this device's copy, sync once online.
      setTimeout(() => {
        if (!initialised.current && uidRef.current === uid) setStatus("offline");
      }, 8000);

      const onError = (e: Error) => {
        setError(e.message);
        setStatus("error");
      };

      unsubs.current.push(
        onSnapshot(
          doc(fb.db, "users", uid, "meta", "state"),
          (snap) => {
            // Wait for the server before deciding "this is a new account"
            if (!snap.exists() && snap.metadata.fromCache) return;
            metaExists = snap.exists();
            metaData = snap.exists() ? (snap.data() as Partial<SyncableState>) : null;
            if (initialised.current && metaData && !snap.metadata.hasPendingWrites) {
              const m = { saved: metaData.saved, compare: metaData.compare, theme: metaData.theme };
              const json = JSON.stringify(m);
              if (json !== lastSynced.current.get("meta")) {
                lastSynced.current.set("meta", json);
                setState((prev) => ({ ...prev, saved: m.saved ?? prev.saved, compare: m.compare ?? prev.compare, theme: m.theme ?? prev.theme }));
              }
            }
            void maybeInitialise();
          },
          onError,
        ),
      );

      for (const c of COLLECTIONS) {
        unsubs.current.push(
          onSnapshot(
            collection(fb.db, "users", uid, c),
            (snap) => {
              let changed = false;
              for (const ch of snap.docChanges()) {
                if (ch.doc.metadata.hasPendingWrites) {
                  // Our own write echoing back: keep the remote copy complete, but don't
                  // touch state or lastSynced (that would cause a needless rewrite).
                  if (ch.type === "removed") remote.current[c].delete(ch.doc.id);
                  else remote.current[c].set(ch.doc.id, { ...(ch.doc.data() as Rec), id: ch.doc.id });
                  continue;
                }
                const key = `${c}/${ch.doc.id}`;
                if (ch.type === "removed") {
                  remote.current[c].delete(ch.doc.id);
                  lastSynced.current.delete(key);
                } else {
                  const data = { ...(ch.doc.data() as Rec), id: ch.doc.id };
                  remote.current[c].set(ch.doc.id, data);
                  lastSynced.current.set(key, JSON.stringify(data));
                }
                changed = true;
              }
              firstSeen.add(c);
              if (initialised.current && changed) setState((prev) => rebuild(c, prev));
              void maybeInitialise();
            },
            onError,
          ),
        );
      }
    },
    [flush, rebuild, refreshStatus, setState, toast],
  );

  useEffect(() => {
    if (!isFirebaseConfigured || !hydrated) return;
    let unsubAuth: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      try {
        const fb = await getFirebase();
        const { onAuthStateChanged } = await import("firebase/auth");
        if (cancelled) return;
        unsubAuth = onAuthStateChanged(fb.auth, (u) => {
          stopListening();
          initialised.current = false;
          lastSynced.current.clear();
          COLLECTIONS.forEach((c) => remote.current[c].clear());
          if (!u) {
            uidRef.current = null;
            setUser(null);
            setRole("none");
            setStatus("signed-out");
            return;
          }
          uidRef.current = u.uid;
          setUser({ uid: u.uid, name: u.displayName ?? "You", email: u.email ?? "", photo: u.photoURL ?? undefined });
          setStatus("loading");
          // Invite-only: admins and invited people get in; everyone else sees "no access".
          const roleKey = `scholarmap:role:${u.uid}`;
          checkAccess(u)
            .then((r) => {
              try {
                localStorage.setItem(roleKey, r);
              } catch {}
              return r;
            })
            .catch(() => {
              // Offline: trust the last answer from this device, if any
              let cached: Role | null = null;
              try {
                cached = localStorage.getItem(roleKey) as Role | null;
              } catch {}
              return cached ?? "none";
            })
            .then((r) => {
              if (uidRef.current !== u.uid) return;
              setRole(r);
              if (r === "none") setStatus("no-access");
              else void startListening(u.uid);
            });
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
      unsubAuth?.();
      stopListening();
    };
  }, [hydrated, startListening]);

  /* ---------- actions ---------- */

  const signIn = useCallback(async () => {
    const fb = await getFirebase();
    const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await import("firebase/auth");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(fb.auth, provider);
      try {
        localStorage.removeItem(LOCAL_ONLY_KEY);
      } catch {}
      setLocalOnly(false);
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (code === "auth/popup-blocked") return signInWithRedirect(fb.auth, provider);
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      toast(code === "auth/unauthorized-domain" ? "This web address isn't allowed in Firebase yet (Authentication → Settings → Authorized domains)." : "Sign-in failed. Please try again.");
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    if (initialised.current) await flush();
    const fb = await getFirebase();
    const { signOut: fbSignOut } = await import("firebase/auth");
    await fbSignOut(fb.auth);
    // Remove this account's data from the device (shared computers)
    resetLocal();
    toast("Signed out — your data stays safe in your account");
  }, [flush, resetLocal, toast]);

  const useLocalOnly = useCallback(() => {
    try {
      localStorage.setItem(LOCAL_ONLY_KEY, "1");
    } catch {}
    setLocalOnly(true);
  }, []);

  const cloud = useMemo<Cloud>(
    () => ({ configured: isFirebaseConfigured, status, user, role, localOnly, error, signIn, signOut, useLocalOnly }),
    [status, user, role, localOnly, error, signIn, signOut, useLocalOnly],
  );
  // The app waits for the first remote snapshot so you never see stale data flash in.
  const ready = hydrated && status !== "loading";
  return { cloud, ready };
}
