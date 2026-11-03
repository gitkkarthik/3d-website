import type { Metadata } from "next";
import RenderStage from "./stage";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Internal page used by `npm run renders` to produce the catalogue stills. */
export default async function RenderPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  return <RenderStage {...sp} />;
}
