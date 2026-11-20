"use client";

import { PageHeader } from "@/components/ui/primitives";
import { ProgramBrowser } from "@/components/views/ProgramBrowser";

export default function ProgramsPage() {
  return (
    <div>
      <PageHeader title="Programs" description="Every degree program on your radar — requirements, tuition and deadlines in one table." />
      <ProgramBrowser />
    </div>
  );
}
