"use client";

import { PageHeader } from "@/components/ui/primitives";
import { ScholarshipBrowser } from "@/components/views/ScholarshipBrowser";

export default function ScholarshipsPage() {
  return (
    <div>
      <PageHeader title="Scholarships" description="Government, university and foundation funding. Save what fits, and add up to three to compare." />
      <ScholarshipBrowser />
    </div>
  );
}
