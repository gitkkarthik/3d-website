export type BaseStyle = "oak" | "walnut" | "ivory" | "slate";

export function baseStyleFromLabel(label?: string | null): BaseStyle {
  const l = (label ?? "").toLowerCase();
  if (l.includes("walnut")) return "walnut";
  if (l.includes("ivory") || l.includes("marble") || l.includes("stone")) return "ivory";
  if (l.includes("slate") || l.includes("charcoal")) return "slate";
  return "oak";
}
