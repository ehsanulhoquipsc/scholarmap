import { Detail } from "@/components/views/details/ScholarshipsDetail";

export default async function Page({ params }: PageProps<"/scholarships/[id]">) {
  const { id } = await params;
  return <Detail id={id} />;
}
