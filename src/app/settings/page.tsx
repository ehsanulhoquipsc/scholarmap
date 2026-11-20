"use client";

import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button, Modal, PageHeader, Segmented } from "@/components/ui/primitives";
import { useStore, type Theme } from "@/lib/store";

function Row({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-line py-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-md">
        <div className="text-[14px] font-medium">{title}</div>
        <div className="mt-0.5 text-[13px] text-fg-muted">{description}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme, reset, toast, universities, programs, scholarships, notes, applications, documents } = useStore();
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Preferences for this prototype. Everything is stored locally in your browser." />

      <h2 className="t-eyebrow mb-1">Appearance</h2>
      <Row title="Theme" description="Light is the primary design. Dark mode is supported by the same design tokens.">
        <Segmented<Theme>
          value={theme}
          onChange={setTheme}
          options={[
            { value: "light", label: <><Sun /> Light</> },
            { value: "dark", label: <><Moon /> Dark</> },
            { value: "system", label: <><Monitor /> System</> },
          ]}
        />
      </Row>

      <h2 className="t-eyebrow mb-1 mt-10">Data</h2>
      <Row
        title="Prototype data"
        description={`${universities.length} universities · ${programs.length} programs · ${scholarships.length} scholarships · ${applications.length} applications · ${notes.length} notes · ${documents.length} documents`}
      >
        <Button variant="danger" onClick={() => setConfirm(true)}>
          Reset sample data
        </Button>
      </Row>
      <p className="mt-6 text-[12.5px] text-fg-faint">
        Sample figures are illustrative and based on publicly available information. Always verify details on official websites before applying.
      </p>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Reset sample data?"
        description="All records, notes and application changes you made in this browser will be replaced with the original sample data."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              className="!bg-danger !text-white"
              onClick={() => {
                reset();
                setConfirm(false);
                toast("Sample data restored");
              }}
            >
              Reset
            </Button>
          </>
        }
      >
        {null}
      </Modal>
    </div>
  );
}
