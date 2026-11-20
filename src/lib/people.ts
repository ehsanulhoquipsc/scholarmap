"use client";

import { getFirebase } from "@/lib/firebase";

export type Role = "admin" | "member" | "none";

export type Invite = {
  email: string;
  name?: string;
  invitedBy: string;
  invitedAt: string;
  status: "invited" | "joined";
  joinedAt?: string;
  lastSeenAt?: string;
  uid?: string;
  displayName?: string;
  photo?: string;
};

export const normEmail = (e: string) => e.trim().toLowerCase();
export const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/**
 * Decide whether a signed-in Google account may use the app, and record that an
 * invited person has joined (or was just active).
 */
export async function checkAccess(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }): Promise<Role> {
  if (!user.email) return "none";
  const email = normEmail(user.email);
  const { db } = await getFirebase();
  const { doc, getDoc, updateDoc } = await import("firebase/firestore");

  const admin = await getDoc(doc(db, "admins", email));
  if (admin.exists()) return "admin";

  const inviteRef = doc(db, "invites", email);
  const invite = await getDoc(inviteRef);
  if (!invite.exists()) return "none";

  const now = new Date().toISOString();
  const data = invite.data() as Invite;
  // Best effort — access doesn't depend on this succeeding.
  void updateDoc(inviteRef, {
    status: "joined",
    joinedAt: data.joinedAt ?? now,
    lastSeenAt: now,
    uid: user.uid,
    displayName: user.displayName ?? "",
    photo: user.photoURL ?? "",
  }).catch(() => {});
  return "member";
}

export async function inviteSomeone(email: string, name: string, invitedBy: string) {
  const { db } = await getFirebase();
  const { doc, getDoc, setDoc } = await import("firebase/firestore");
  const id = normEmail(email);
  const ref = doc(db, "invites", id);
  const existing = await getDoc(ref);
  if (existing.exists()) return { created: false as const };
  const invite: Invite = { email: id, invitedBy: normEmail(invitedBy), invitedAt: new Date().toISOString(), status: "invited", ...(name.trim() ? { name: name.trim() } : {}) };
  await setDoc(ref, invite);
  return { created: true as const };
}

export async function restoreInvite(invite: Invite) {
  const { db } = await getFirebase();
  const { doc, setDoc } = await import("firebase/firestore");
  await setDoc(doc(db, "invites", invite.email), JSON.parse(JSON.stringify(invite)));
}

export async function removeInvite(email: string) {
  const { db } = await getFirebase();
  const { doc, deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(db, "invites", normEmail(email)));
}

/** Live list of invites (admins only). Returns an unsubscribe function. */
export async function watchInvites(onChange: (list: Invite[]) => void, onError: (e: Error) => void) {
  const { db } = await getFirebase();
  const { collection, onSnapshot } = await import("firebase/firestore");
  return onSnapshot(
    collection(db, "invites"),
    (snap) => onChange(snap.docs.map((d) => d.data() as Invite).sort((a, b) => b.invitedAt.localeCompare(a.invitedAt))),
    onError,
  );
}

export function inviteMessage(siteUrl: string, email: string, from?: string) {
  return [
    `Hi! ${from ? from + " has" : "You've been"} invited you to ScholarMap — a private workspace for researching universities, programs and scholarships.`,
    ``,
    `1. Open ${siteUrl}`,
    `2. Click "Continue with Google" and sign in with ${email}`,
    ``,
    `Your research stays private to your own account.`,
  ].join("\n");
}
