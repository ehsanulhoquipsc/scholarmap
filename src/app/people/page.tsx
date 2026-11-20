"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Mail, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Badge, Button, EmptyState, Field, IconButton, Input, PageHeader, SearchInput, Segmented } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import { type Invite, inviteMessage, inviteSomeone, isValidEmail, normEmail, removeInvite, restoreInvite, watchInvites } from "@/lib/people";
import { cn, timeAgo } from "@/lib/utils";

export default function PeoplePage() {
  const { cloud, toast } = useStore();

  if (!cloud.configured)
    return (
      <div>
        <PageHeader title="People" />
        <EmptyState icon={<Users />} title="Cloud sync isn't set up" description="Inviting people needs Firebase. See FIREBASE_SETUP.md." />
      </div>
    );
  if (cloud.role !== "admin")
    return (
      <div>
        <PageHeader title="People" />
        <EmptyState icon={<ShieldCheck />} title="Admins only" description="Only an admin can invite people to ScholarMap." />
      </div>
    );
  return <AdminPeople adminEmail={cloud.user?.email ?? ""} adminName={cloud.user?.name ?? ""} adminPhoto={cloud.user?.photo} toast={toast} />;
}

function AdminPeople({ adminEmail, adminName, adminPhoto, toast }: { adminEmail: string; adminName: string; adminPhoto?: string; toast: ReturnType<typeof useStore>["toast"] }) {
  const [invites, setInvites] = useState<Invite[] | null>(null);
  const [error, setError] = useState<string>();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [justInvited, setJustInvited] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "joined" | "invited">("all");
  const site = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let alive = true;
    watchInvites(
      (list) => alive && setInvites(list),
      (e) => alive && setError(e.message),
    ).then((u) => {
      if (alive) unsub = u;
      else u();
    });
    return () => {
      alive = false;
      unsub?.();
    };
  }, []);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (invites ?? []).filter((i) => (filter === "all" || i.status === filter) && (!t || [i.email, i.name, i.displayName].some((x) => x?.toLowerCase().includes(t))));
  }, [invites, q, filter]);

  const joined = invites?.filter((i) => i.status === "joined").length ?? 0;
  const pending = invites?.filter((i) => i.status === "invited").length ?? 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = normEmail(email);
    if (!isValidEmail(em)) return toast("That doesn't look like an email address.");
    if (em === normEmail(adminEmail)) return toast("That's you — you already have access.");
    setBusy(true);
    try {
      const r = await inviteSomeone(em, name, adminEmail);
      if (!r.created) toast(`${em} is already invited`);
      else toast(`Invited ${em}`);
      setJustInvited(em);
      setEmail("");
      setName("");
    } catch (err) {
      toast(err instanceof Error && err.message.includes("permission") ? "Not allowed — check the Firestore rules and your admins entry." : "Couldn't send the invite. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const copy = (em: string) => {
    navigator.clipboard?.writeText(inviteMessage(site, em, adminName.split(" ")[0]));
    toast("Invite message copied — paste it in WhatsApp, Messenger or email");
  };
  const mailto = (em: string) =>
    `mailto:${encodeURIComponent(em)}?subject=${encodeURIComponent("You're invited to ScholarMap")}&body=${encodeURIComponent(inviteMessage(site, em, adminName.split(" ")[0]))}`;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="People"
        description="ScholarMap is invite-only. Invite someone by email — they sign in with Google using that address and get their own private workspace."
      />

      {/* Invite form */}
      <form onSubmit={submit} className="rounded-xl border border-line p-5">
        <div className="mb-4 flex items-center gap-2 text-[14px] font-medium">
          <UserPlus className="size-4 text-accent" /> Invite someone
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end">
          <Field label="Google email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="friend@gmail.com" autoComplete="off" />
          </Field>
          <Field label="Name (optional)">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sara" autoComplete="off" />
          </Field>
          <Button type="submit" variant="primary" disabled={busy || !email.trim()} className="h-8">
            {busy ? "Inviting…" : "Send invite"}
          </Button>
        </div>
        {justInvited && (
          <div className="anim-fade mt-4 flex flex-col gap-3 rounded-lg bg-accent-soft/60 px-4 py-3 text-[13px] sm:flex-row sm:items-center sm:justify-between">
            <span>
              <span className="font-medium">{justInvited}</span> can now sign in. Let them know:
            </span>
            <span className="flex gap-2">
              <Button size="sm" onClick={() => copy(justInvited)}>
                <Copy /> Copy message
              </Button>
              <a href={mailto(justInvited)}>
                <Button size="sm">
                  <Mail /> Email
                </Button>
              </a>
            </span>
          </div>
        )}
        <p className="mt-3 text-[12px] text-fg-faint">
          ScholarMap doesn’t send emails itself — share the invite message any way you like. They must use a Google account with this exact email.
        </p>
      </form>

      {/* Members */}
      <div className="mb-3 mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="t-h2">
          Members <span className="tabular text-[13px] font-normal text-fg-muted">· {joined} joined · {pending} pending</span>
        </h2>
        <div className="flex items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search" className="w-[180px]" />
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "joined", label: "Joined" },
              { value: "invited", label: "Pending" },
            ]}
          />
        </div>
      </div>

      {error && <p className="mb-3 text-[13px] text-danger">Couldn’t load members: {error}</p>}

      <ul className="divide-y divide-line border-y border-line">
        {/* You */}
        <li className="flex items-center gap-3 py-3">
          <Avatar photo={adminPhoto} label={adminName || adminEmail} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-medium">{adminName || adminEmail}</div>
            <div className="truncate text-[12px] text-fg-muted">{adminEmail}</div>
          </div>
          <Badge tone="accent">Admin · you</Badge>
        </li>

        {invites === null && !error && (
          <li className="py-3">
            <div className="skeleton h-10 w-full" />
          </li>
        )}
        {invites && list.length === 0 && (
          <li className="py-8 text-center text-[13px] text-fg-muted">{invites.length === 0 ? "No one invited yet." : "No members match."}</li>
        )}
        {list.map((inv) => (
          <li key={inv.email} className="group flex items-center gap-3 py-3">
            <Avatar photo={inv.photo} label={inv.displayName || inv.name || inv.email} muted={inv.status === "invited"} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px]">{inv.displayName || inv.name || inv.email}</div>
              <div className="truncate text-[12px] text-fg-muted">
                {inv.email}
                {" · "}
                {inv.status === "joined"
                  ? inv.lastSeenAt
                    ? `active ${timeAgo(inv.lastSeenAt)}`
                    : "joined"
                  : `invited ${timeAgo(inv.invitedAt)}`}
              </div>
            </div>
            <Badge tone={inv.status === "joined" ? "success" : "warning"}>{inv.status === "joined" ? "Joined" : "Pending"}</Badge>
            <div className="flex items-center opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
              {inv.status === "invited" && (
                <IconButton label="Copy invite message" onClick={() => copy(inv.email)}>
                  <Copy />
                </IconButton>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-fg-muted hover:text-danger"
                onClick={() => {
                  const snapshot = inv;
                  if (justInvited === inv.email) setJustInvited(null);
                  void removeInvite(inv.email)
                    .then(() => toast(`Removed access for ${inv.email}`, { label: "Undo", onClick: () => void restoreInvite(snapshot) }, 6000))
                    .catch(() => toast("Couldn't remove — try again."));
                }}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[12px] text-fg-faint">
        Removing someone blocks their access straight away. Their saved research is kept, so re-inviting the same email brings it back.
      </p>
    </div>
  );
}

function Avatar({ photo, label, muted }: { photo?: string; label: string; muted?: boolean }) {
  if (photo)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt="" referrerPolicy="no-referrer" className="size-8 shrink-0 rounded-full object-cover" />;
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium", muted ? "border border-dashed border-line-strong text-fg-faint" : "bg-muted")}>
      {label.slice(0, 1).toUpperCase()}
    </span>
  );
}
