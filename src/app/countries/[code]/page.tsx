import { CountryWorkspace } from "@/components/views/CountryWorkspace";

export default async function CountryPage({ params }: PageProps<"/countries/[code]">) {
  const { code } = await params;
  return <CountryWorkspace code={code.toUpperCase()} />;
}
