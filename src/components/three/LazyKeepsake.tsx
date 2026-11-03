"use client";

import dynamic from "next/dynamic";
import type { KeepsakeSceneProps } from "./KeepsakeScene";

const Scene = dynamic(() => import("./KeepsakeScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[inherit] bg-sand/60" />,
});

export default function LazyKeepsake(props: KeepsakeSceneProps) {
  return <Scene {...props} />;
}
