import Link from "next/link";
import { Wordmark } from "./Wordmark";

export function SiteFooter({ contactEmail }: { contactEmail: string }) {
  return (
    <footer className="border-t border-line bg-sand/50">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div className="max-w-sm">
          <Wordmark />
          <p className="mt-4 font-display text-xl leading-snug text-ink-soft">
            Not just a miniature. <em className="italic-soft">A little piece of them, forever.</em>
          </p>
          <p className="mt-4 text-sm text-ink-mute">
            Sculpted from your photos, finished by hand, shipped across India.
          </p>
        </div>
        <FooterCol
          title="Keepsakes"
          links={[
            ["/editions/personality-edition", "Personality Edition"],
            ["/editions/forever-edition", "Forever Edition"],
            ["/editions/together-edition", "Together Edition"],
            ["/editions/forever-in-our-hearts-edition", "Memorial Edition"],
          ]}
        />
        <FooterCol
          title="Studio"
          links={[
            ["/#how-it-works", "How it works"],
            ["/memory-pages", "Digital memory pages"],
            ["/gifts/custom-dog-figurine", "Custom dog figurines"],
            ["/gifts/custom-cat-figurine", "Custom cat figurines"],
            ["/gifts/pet-memorial-gifts", "Pet memorial gifts"],
          ]}
        />
        <FooterCol
          title="Help"
          links={[
            ["/#faq", "FAQ"],
            ["/shipping-and-returns", "Shipping & returns"],
            ["/privacy", "Privacy"],
            ["/terms", "Terms"],
            [`mailto:${contactEmail}`, contactEmail],
          ]}
        />
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-ink-mute sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Pawsome Memories. Made with care in India.</p>
          <p>Figurine images on this site are illustrative studio renders, not photographs of customer orders.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="eyebrow !text-ink-mute">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-ink-soft hover:text-ink">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
