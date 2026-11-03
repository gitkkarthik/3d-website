"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * Procedural "studio sculpt" figurines. These are illustrative renders of the
 * style and finish — every real keepsake is sculpted by an artist from the
 * customer's own photos.
 */

export type Coat = { main: string; accent: string; dark?: string };
export const COATS: Record<string, Coat> = {
  fawn: { main: "#c99868", accent: "#f2e4cd" },
  tuxedo: { main: "#2f2b2a", accent: "#f3ebdf" },
  golden: { main: "#d9a659", accent: "#f4dfb4" },
  tabby: { main: "#8f877f", accent: "#efe6da", dark: "#5f5852" },
  ginger: { main: "#d08a4c", accent: "#f6e2c7" },
  cream: { main: "#eadbc3", accent: "#fbf4e8" },
  chocolate: { main: "#6b4a37", accent: "#d9b998" },
};

function useMat(color: string, opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}) {
  return useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.55,
        metalness: 0,
        clearcoat: 0.25,
        clearcoatRoughness: 0.6,
        sheen: 0.4,
        sheenRoughness: 0.8,
        sheenColor: new THREE.Color("#fff3e3"),
        ...opts,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color],
  );
}

type V3 = [number, number, number];

function Blob({ p, s = [1, 1, 1], r = 1, rot = [0, 0, 0], mat }: { p: V3; s?: V3; r?: number; rot?: V3; mat: THREE.Material }) {
  return (
    <mesh position={p} rotation={rot} scale={s.map((x) => x * r) as V3} material={mat} castShadow receiveShadow>
      <sphereGeometry args={[1, 48, 32]} />
    </mesh>
  );
}

function Capsule({ p, len, r, rot = [0, 0, 0], mat }: { p: V3; len: number; r: number; rot?: V3; mat: THREE.Material }) {
  return (
    <mesh position={p} rotation={rot} material={mat} castShadow receiveShadow>
      <capsuleGeometry args={[r, len, 12, 32]} />
    </mesh>
  );
}

function Tube({ pts, r, mat }: { pts: V3[]; r: number; mat: THREE.Material }) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(pts.map((x) => new THREE.Vector3(...x)));
    return new THREE.TubeGeometry(curve, 48, r, 20, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pts), r]);
  return (
    <group>
      <mesh geometry={geo} material={mat} castShadow />
      <Blob p={pts[pts.length - 1]} r={r} mat={mat} />
    </group>
  );
}

function Ear({ p, rot, mat, h = 0.3, r = 0.13 }: { p: V3; rot: V3; mat: THREE.Material; h?: number; r?: number }) {
  return (
    <mesh position={p} rotation={rot} scale={[1, 1, 0.45]} material={mat} castShadow>
      <coneGeometry args={[r, h, 32]} />
    </mesh>
  );
}

function useCommon() {
  const nose = useMat("#2a2321", { roughness: 0.35, clearcoat: 0.8 });
  const eye = useMat("#18130f", { roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.1 });
  const collar = useMat("#9c4f36");
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9a25e", metalness: 0.85, roughness: 0.3 }), []);
  return { nose, eye, collar, brass };
}

/* ─────────────── Sitting dog ─────────────── */
export function SittingDog({ coat = COATS.fawn, withBall = false, headTilt = 0.12 }: { coat?: Coat; withBall?: boolean; headTilt?: number }) {
  const main = useMat(coat.main);
  const acc = useMat(coat.accent);
  const { nose, eye, collar, brass } = useCommon();
  const ball = useMat("#7d8b6f");
  return (
    <group>
      {/* haunches & back feet */}
      <Blob p={[0.24, 0.3, -0.14]} s={[0.82, 0.78, 1.02]} r={0.37} mat={main} />
      <Blob p={[-0.24, 0.3, -0.14]} s={[0.82, 0.78, 1.02]} r={0.37} mat={main} />
      <Blob p={[0.33, 0.07, 0.13]} s={[0.85, 0.55, 1.5]} r={0.13} mat={acc} />
      <Blob p={[-0.33, 0.07, 0.13]} s={[0.85, 0.55, 1.5]} r={0.13} mat={acc} />
      {/* torso & chest */}
      <Blob p={[0, 0.76, -0.02]} s={[0.86, 1.25, 0.85]} r={0.44} rot={[-0.22, 0, 0]} mat={main} />
      <Blob p={[0, 0.8, 0.24]} s={[0.78, 1.15, 0.6]} r={0.3} rot={[-0.2, 0, 0]} mat={acc} />
      {/* front legs & paws */}
      <Capsule p={[0.13, 0.36, 0.28]} len={0.44} r={0.09} rot={[0.08, 0, 0.03]} mat={main} />
      <Capsule p={[-0.13, 0.36, 0.28]} len={0.44} r={0.09} rot={[0.08, 0, -0.03]} mat={main} />
      <Blob p={[0.14, 0.06, 0.35]} s={[1, 0.62, 1.3]} r={0.11} mat={acc} />
      <Blob p={[-0.14, 0.06, 0.35]} s={[1, 0.62, 1.3]} r={0.11} mat={acc} />
      {/* tail curled around */}
      <Tube pts={[[0, 0.22, -0.48], [0.38, 0.1, -0.42], [0.58, 0.06, -0.08], [0.5, 0.06, 0.22]]} r={0.06} mat={main} />
      {/* collar */}
      <mesh position={[0, 1.15, 0.07]} rotation={[1.42, 0, 0]} material={collar} castShadow>
        <torusGeometry args={[0.215, 0.026, 16, 48]} />
      </mesh>
      <mesh position={[0, 1.05, 0.29]} rotation={[Math.PI / 2 - 0.35, 0, 0]} material={brass} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.014, 32]} />
      </mesh>
      {/* head */}
      <group position={[0, 1.42, 0.1]} rotation={[0.05, 0.12, headTilt]}>
        <Blob p={[0, 0, 0]} s={[1, 0.94, 0.98]} r={0.34} mat={main} />
        <Blob p={[0, -0.09, 0.27]} s={[0.92, 0.72, 1.15]} r={0.2} mat={acc} />
        <Blob p={[0, -0.03, 0.48]} s={[1.3, 0.92, 1]} r={0.06} mat={nose} />
        <Blob p={[0.13, 0.08, 0.28]} r={0.042} mat={eye} />
        <Blob p={[-0.13, 0.08, 0.28]} r={0.042} mat={eye} />
        <Ear p={[0.2, 0.32, -0.06]} rot={[-0.15, 0, -0.38]} mat={main} />
        <Ear p={[-0.2, 0.32, -0.06]} rot={[-0.15, 0, 0.38]} mat={main} />
      </group>
      {withBall && <Blob p={[0, 0.13, 0.66]} r={0.13} mat={ball} />}
    </group>
  );
}

/* ─────────────── Sleeping dog (curled) ─────────────── */
export function SleepingDog({ coat = COATS.golden }: { coat?: Coat }) {
  const main = useMat(coat.main);
  const acc = useMat(coat.accent);
  const { nose } = useCommon();
  const lid = useMat("#3a2f29");
  return (
    <group rotation={[0, -0.35, 0]}>
      <Blob p={[0, 0.27, -0.05]} s={[1.35, 0.6, 0.95]} r={0.5} mat={main} />
      <Blob p={[0.42, 0.25, 0.05]} s={[0.9, 0.7, 1]} r={0.36} mat={main} />
      {/* front paws stretched forward */}
      <Capsule p={[-0.18, 0.08, 0.42]} len={0.5} r={0.085} rot={[0, 0, Math.PI / 2]} mat={main} />
      <Capsule p={[-0.12, 0.08, 0.56]} len={0.44} r={0.085} rot={[0, 0.15, Math.PI / 2]} mat={main} />
      <Blob p={[-0.5, 0.07, 0.44]} s={[1.3, 0.6, 1]} r={0.1} mat={acc} />
      <Blob p={[-0.42, 0.07, 0.6]} s={[1.3, 0.6, 1]} r={0.1} mat={acc} />
      {/* head resting on paws */}
      <group position={[-0.36, 0.3, 0.48]} rotation={[0.1, -0.5, -0.12]}>
        <Blob p={[0, 0, 0]} s={[1, 0.85, 1]} r={0.27} mat={main} />
        <Blob p={[-0.08, -0.07, 0.2]} s={[0.9, 0.7, 1.15]} r={0.15} mat={acc} />
        <Blob p={[-0.11, -0.04, 0.36]} s={[1.3, 0.9, 1]} r={0.05} mat={nose} />
        {/* closed eyes */}
        <mesh position={[0.07, 0.07, 0.22]} rotation={[0, 0, 0.2]} material={lid}>
          <torusGeometry args={[0.04, 0.009, 8, 24, Math.PI]} />
        </mesh>
        <mesh position={[-0.13, 0.06, 0.22]} rotation={[0, 0, -0.1]} material={lid}>
          <torusGeometry args={[0.04, 0.009, 8, 24, Math.PI]} />
        </mesh>
        {/* soft floppy ears */}
        <Blob p={[0.2, 0.0, -0.05]} s={[0.45, 1, 0.8]} r={0.17} rot={[0, 0, 0.5]} mat={main} />
        <Blob p={[-0.18, 0.06, -0.12]} s={[0.45, 1, 0.8]} r={0.17} rot={[0, 0, -0.4]} mat={main} />
      </group>
      <Tube pts={[[0.7, 0.18, -0.1], [0.62, 0.08, 0.38], [0.25, 0.06, 0.62], [-0.02, 0.06, 0.66]]} r={0.07} mat={main} />
    </group>
  );
}

/* ─────────────── Cat loaf ─────────────── */
export function CatLoaf({ coat = COATS.tabby }: { coat?: Coat }) {
  const main = useMat(coat.main);
  const acc = useMat(coat.accent);
  const stripe = useMat(coat.dark ?? coat.main);
  const { nose, eye } = useCommon();
  const pink = useMat("#d99a8e");
  return (
    <group rotation={[0, 0.25, 0]}>
      <Blob p={[0, 0.34, -0.08]} s={[0.95, 0.72, 1.25]} r={0.46} mat={main} />
      <Blob p={[0, 0.3, 0.26]} s={[0.8, 0.7, 0.5]} r={0.34} mat={acc} />
      {[-0.2, 0.0, 0.2].map((z, i) => (
        <mesh key={i} position={[0, 0.66, z - 0.1]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.5]} material={stripe}>
          <torusGeometry args={[0.36, 0.025, 8, 32, Math.PI * 0.9]} />
        </mesh>
      ))}
      {/* tucked paws */}
      <Blob p={[0.12, 0.06, 0.48]} s={[1, 0.6, 1.2]} r={0.09} mat={acc} />
      <Blob p={[-0.12, 0.06, 0.48]} s={[1, 0.6, 1.2]} r={0.09} mat={acc} />
      <group position={[0, 0.86, 0.3]} rotation={[0.1, -0.15, 0.06]}>
        <Blob p={[0, 0, 0]} s={[1.1, 0.92, 0.95]} r={0.3} mat={main} />
        <Blob p={[0, -0.09, 0.2]} s={[1, 0.7, 0.7]} r={0.14} mat={acc} />
        <Blob p={[0, -0.04, 0.3]} s={[1.3, 0.8, 0.8]} r={0.032} mat={pink} />
        <Blob p={[0.12, 0.05, 0.24]} s={[1, 1.2, 0.6]} r={0.05} mat={eye} />
        <Blob p={[-0.12, 0.05, 0.24]} s={[1, 1.2, 0.6]} r={0.05} mat={eye} />
        <Ear p={[0.19, 0.27, -0.02]} rot={[-0.1, 0, -0.32]} mat={main} h={0.24} r={0.12} />
        <Ear p={[-0.19, 0.27, -0.02]} rot={[-0.1, 0, 0.32]} mat={main} h={0.24} r={0.12} />
        <Blob p={[0, -0.18, 0.12]} s={[1, 0.4, 0.5]} r={0.02} mat={nose} />
      </group>
      <Tube pts={[[0, 0.18, -0.62], [0.45, 0.08, -0.4], [0.5, 0.06, 0.12], [0.25, 0.06, 0.45]]} r={0.07} mat={main} />
    </group>
  );
}

/* ─────────────── Person + dog ─────────────── */
export function Together({ coat = COATS.tuxedo }: { coat?: Coat }) {
  const skin = useMat("#b98262");
  const hair = useMat("#231c19", { roughness: 0.4 });
  const top = useMat("#8a977c");
  const trousers = useMat("#e6dccd");
  const shoe = useMat("#5a4636");
  const { eye } = useCommon();
  const mouth = useMat("#7a4a3a");
  return (
    <group>
      {/* person standing, hand resting on the dog's head */}
      <group position={[-0.42, 0, -0.08]} rotation={[0, 0.3, 0]}>
        <Blob p={[0.13, 0.06, 0.06]} s={[0.9, 0.6, 1.5]} r={0.1} mat={shoe} />
        <Blob p={[-0.13, 0.06, 0.06]} s={[0.9, 0.6, 1.5]} r={0.1} mat={shoe} />
        <Capsule p={[0.13, 0.42, 0]} len={0.5} r={0.11} mat={trousers} />
        <Capsule p={[-0.13, 0.42, 0]} len={0.5} r={0.11} mat={trousers} />
        <Blob p={[0, 0.78, 0]} s={[1, 0.55, 0.75]} r={0.28} mat={trousers} />
        <Blob p={[0, 1.08, 0]} s={[0.92, 1.05, 0.72]} r={0.32} mat={top} />
        {/* left arm relaxed */}
        <Capsule p={[-0.33, 1.0, 0]} len={0.36} r={0.08} rot={[0, 0, -0.18]} mat={top} />
        <Blob p={[-0.37, 0.74, 0.02]} r={0.075} mat={skin} />
        {/* right arm down to the dog */}
        <Capsule p={[0.37, 1.02, 0.08]} len={0.36} r={0.08} rot={[-0.25, 0, 0.55]} mat={top} />
        <Blob p={[0.5, 0.82, 0.16]} r={0.075} mat={skin} />
        <Capsule p={[0, 1.4, 0]} len={0.05} r={0.07} mat={skin} />
        <group position={[0, 1.66, 0.02]} rotation={[0.08, 0.2, 0.06]}>
          <Blob p={[0, 0, 0]} s={[0.95, 1.05, 0.95]} r={0.26} mat={skin} />
          <Blob p={[0, 0.08, -0.05]} s={[1.03, 0.95, 1.0]} r={0.27} mat={hair} />
          <Blob p={[0, -0.04, -0.2]} s={[1.0, 1.15, 0.55]} r={0.24} mat={hair} />
          <Blob p={[0.09, -0.03, 0.235]} r={0.027} mat={eye} />
          <Blob p={[-0.09, -0.03, 0.235]} r={0.027} mat={eye} />
          <mesh position={[0, -0.12, 0.225]} rotation={[0, 0, Math.PI]} material={mouth}>
            <torusGeometry args={[0.04, 0.009, 8, 24, Math.PI]} />
          </mesh>
          <Blob p={[0.25, -0.03, 0]} s={[0.4, 0.8, 0.6]} r={0.06} mat={skin} />
          <Blob p={[-0.25, -0.03, 0]} s={[0.4, 0.8, 0.6]} r={0.06} mat={skin} />
        </group>
      </group>
      <group position={[0.42, 0, 0.12]} scale={0.66} rotation={[0, -0.3, 0]}>
        <SittingDog coat={coat} headTilt={-0.22} />
      </group>
    </group>
  );
}

export type FigureKey = "dog-sitting" | "dog-play" | "dog-sleeping" | "cat-loaf" | "together";

export function Figure({ kind, coat }: { kind: FigureKey; coat?: Coat }) {
  switch (kind) {
    case "dog-play":
      return <SittingDog coat={coat ?? COATS.tuxedo} withBall headTilt={0.28} />;
    case "dog-sleeping":
      return <SleepingDog coat={coat} />;
    case "cat-loaf":
      return <CatLoaf coat={coat} />;
    case "together":
      return <Together coat={coat} />;
    default:
      return <SittingDog coat={coat} />;
  }
}
