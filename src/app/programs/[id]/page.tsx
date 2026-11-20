import { Detail } from "@/components/views/details/ProgramsDetail";

export default async function Page({ params }: PageProps<"/programs/[id]">) {
  const { id } = await params;
  return <Detail id={id} />;
}
