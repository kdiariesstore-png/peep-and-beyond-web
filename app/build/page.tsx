import { BuildPageClient } from "../../components/build-page-client";

// The Ready-to-Gift box was removed from the shop, so every /build link (including old
// shared ?style=gift ones) opens the build-your-own builder.
export default function BuildPage() {
  return <BuildPageClient kind="build-your-own" />;
}
