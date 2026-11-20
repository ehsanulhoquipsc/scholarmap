import { Detail } from "@/components/views/details/UniversitiesDetail";

export default async function Page({ params }: PageProps<"/universities/[id]">) {
  const { id } = await params;
  return <Detail id={id} />;
}
