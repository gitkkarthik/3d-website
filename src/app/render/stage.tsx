"use client";

import { useEffect, useState } from "react";
import LazyKeepsake from "@/components/three/LazyKeepsake";
import type { FigureKey } from "@/components/three/Figurines";
import type { BaseStyle } from "@/components/three/baseStyle";

export default function RenderStage(p: Record<string, string>) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
  }, []);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => document.body.setAttribute("data-rendered", "1"), 1500);
    return () => clearTimeout(t);
  }, [ready]);
  return (
    <div style={{ width: "100vw", height: "100vh", background: p.bg ?? "transparent" }}>
      <LazyKeepsake
        figure={(p.figure as FigureKey) ?? "dog-sitting"}
        coat={p.coat as never}
        base={(p.base as BaseStyle) ?? "walnut"}
        engraving={p.name ?? "Bruno"}
        line2={p.line2 ?? ""}
        autoRotate={false}
        interactive={false}
        framing="card"
        preserveDrawingBuffer
        yaw={Number(p.yaw ?? 0)}
        onReady={() => setReady(true)}
      />
    </div>
  );
}
