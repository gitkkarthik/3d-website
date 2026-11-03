/**
 * Subtle fade-and-rise as content scrolls into view. Pure CSS (scroll-driven
 * animations) so content is always visible where unsupported or without JS.
 */
export function Reveal({ children, className = "", delay = 0, as: Tag = "div" }: { children: React.ReactNode; className?: string; delay?: number; as?: "div" | "li" | "section" }) {
  return (
    <Tag className={`reveal ${className}`} style={delay ? ({ "--reveal-delay": `${delay / 10}%` } as React.CSSProperties) : undefined}>
      {children}
    </Tag>
  );
}
