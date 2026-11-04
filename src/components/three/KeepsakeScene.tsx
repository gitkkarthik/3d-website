"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Figure, COATS, type FigureKey } from "./Figurines";

import type { BaseStyle } from "./baseStyle";
export type { BaseStyle } from "./baseStyle";
export { baseStyleFromLabel } from "./baseStyle";

const BASES: Record<BaseStyle, { color: string; ink: string; roughness: number; grain: boolean }> = {
  oak: { color: "#c9a77c", ink: "#5a3f27", roughness: 0.7, grain: true },
  walnut: { color: "#6e4a33", ink: "#e9d6b8", roughness: 0.55, grain: true },
  ivory: { color: "#efe7da", ink: "#7a6450", roughness: 0.45, grain: false },
  slate: { color: "#3b3836", ink: "#d9c7a8", roughness: 0.6, grain: false },
};

function grainTexture(color: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = color;
  g.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 70; i++) {
    const y = Math.random() * 128;
    g.strokeStyle = `rgba(40,25,15,${0.04 + Math.random() * 0.07})`;
    g.lineWidth = 0.6 + Math.random() * 1.6;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x / 60 + i) * 2.5);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function engravingTexture(name: string, line2: string, ink: string, fontReady: boolean) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 200;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = ink;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const family = fontReady ? "'Fraunces Variable', Georgia, serif" : "Georgia, serif";
  const display = name.trim() || " ";
  let size = 96;
  g.font = `italic 500 ${size}px ${family}`;
  while (g.measureText(display).width > 900 && size > 40) {
    size -= 4;
    g.font = `italic 500 ${size}px ${family}`;
  }
  g.fillText(display, 512, line2 ? 80 : 100);
  if (line2) {
    g.font = `500 34px ${fontReady ? "'Instrument Sans Variable', Arial, sans-serif" : "Arial, sans-serif"}`;
    g.letterSpacing = "6px";
    g.fillText(line2.toUpperCase(), 512, 158);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function Plinth({ style, engraving, line2 }: { style: BaseStyle; engraving: string; line2: string }) {
  const b = BASES[style];
  const [fontReady, setFontReady] = useState(false);
  useEffect(() => {
    document.fonts?.ready.then(() => setFontReady(true));
  }, []);
  const mat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ color: b.grain ? "#ffffff" : b.color, roughness: b.roughness, clearcoat: style === "ivory" ? 0.6 : 0.3, clearcoatRoughness: 0.35 });
    if (b.grain) m.map = grainTexture(b.color);
    return m;
  }, [style, b]);
  const tex = useMemo(() => engravingTexture(engraving, line2, b.ink, fontReady), [engraving, line2, b.ink, fontReady]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <group position={[0, -0.25, 0]}>
      <RoundedBox args={[2.5, 0.5, 1.75]} radius={0.12} smoothness={6} material={mat} castShadow receiveShadow />
      <mesh position={[0, -0.005, 0.8755]}>
        <planeGeometry args={[2.1, 0.41]} />
        <meshStandardMaterial map={tex} transparent roughness={0.8} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
    </group>
  );
}

const LOW: FigureKey[] = ["dog-sleeping", "cat-loaf"];

function Rig({ framing, figure }: { framing: "hero" | "card" | "wizard"; figure: FigureKey }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    const low = LOW.includes(figure);
    const dist = { hero: 8.6, card: 7.2, wizard: 7.6 }[framing] * (low ? 0.82 : 1);
    const dir = new THREE.Vector3(0.43, 0.3, 0.85).normalize();
    const target = new THREE.Vector3(0, low ? 0.3 : 0.72, 0);
    camera.position.copy(target.clone().add(dir.multiplyScalar(dist)));
    camera.lookAt(target);
    invalidate();
  }, [camera, framing, figure, invalidate]);
  return null;
}

export type KeepsakeSceneProps = {
  figure?: FigureKey;
  coat?: keyof typeof COATS;
  base?: BaseStyle;
  engraving?: string;
  line2?: string;
  autoRotate?: boolean;
  interactive?: boolean;
  framing?: "hero" | "card" | "wizard";
  onReady?: () => void;
  preserveDrawingBuffer?: boolean;
  yaw?: number;
};

export default function KeepsakeScene({
  figure = "dog-sitting",
  coat,
  base = "walnut",
  engraving = "Bruno",
  line2 = "",
  autoRotate = true,
  interactive = true,
  framing = "hero",
  onReady,
  preserveDrawingBuffer = false,
  yaw = 0,
}: KeepsakeSceneProps) {
  return (
    <Canvas
      shadows
      // Without auto-rotation, only redraw when something changes (drag, name, base): kinder to phone batteries.
      frameloop={autoRotate ? "always" : "demand"}
      dpr={[1, 2]}
      camera={{ fov: 28, near: 0.1, far: 50, position: [2.6, 1.9, 5.4] }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        onReady?.();
      }}
      style={{ touchAction: interactive ? "pan-y" : "auto" }}
      aria-hidden
    >
      <Rig framing={framing} figure={figure} />
      <ambientLight intensity={0.35} color="#fff4e6" />
      <directionalLight
        position={[3.5, 5, 4]}
        intensity={1.9}
        color="#fff1dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <directionalLight position={[-4, 3, -3]} intensity={0.9} color="#ffe2c4" />
      <Suspense fallback={null}>
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={2.2} color="#fff6ea" position={[0, 5, 2]} scale={[8, 4, 1]} />
          <Lightformer form="rect" intensity={1.2} color="#ffdcbc" position={[-5, 2, 1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
          <Lightformer form="rect" intensity={0.8} color="#f1e7da" position={[5, 1, -1]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
          <Lightformer form="circle" intensity={1.4} color="#ffffff" position={[0, 2, -6]} scale={3} />
        </Environment>
      </Suspense>
      <group position={[0, 0.1, 0]} rotation={[0, yaw, 0]}>
        <Plinth style={base} engraving={engraving} line2={line2} />
        <Figure kind={figure} coat={coat ? COATS[coat] : undefined} />
      </group>
      <ContactShadows position={[0, -0.16, 0]} opacity={0.45} scale={7} blur={2.6} far={2} color="#4a3a2c" />
      <OrbitControls
        enabled={interactive}
        enablePan={false}
        enableZoom={false}
        autoRotate={autoRotate}
        autoRotateSpeed={0.9}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, LOW.includes(figure) ? 0.3 : 0.72, 0]}
        enableDamping
      />
    </Canvas>
  );
}
