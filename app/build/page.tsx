import { BuildPageClient } from "../../components/build-page-client";

export default function BuildPage({ searchParams }: { searchParams: { style?: string } }) {
  const kind = searchParams.style === "gift" ? "ready-to-gift" : "build-your-own";
  return <BuildPageClient kind={kind} />;
}
