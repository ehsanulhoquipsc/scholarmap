"use client";

import { PageHeader } from "@/components/ui/primitives";
import { UniversityBrowser } from "@/components/views/UniversityBrowser";

export default function UniversitiesPage() {
  return (
    <div>
      <PageHeader title="Universities" description="Institutions your group is researching, with their programs and funding." />
      <UniversityBrowser />
    </div>
  );
}
