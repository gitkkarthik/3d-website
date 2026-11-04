/** Editorial content shared across pages (and structured data). */

export const FAQS: { q: string; a: string }[] = [
  {
    q: "How does the sound on the keepsake work?",
    a: "Send us a recording: a bark, a purr, a WhatsApp voice note, even you calling their name. We engrave its waveform into the base next to a small QR code. Point any phone camera at the code and their sound plays, with their photos and story. No app needed.",
  },
  {
    q: "Will the QR code keep working? Is there a subscription?",
    a: "There's no subscription, ever. The code is part of what you buy, and it doesn't stop working because a plan lapsed. You can also download every photo and recording from your memory page at any time, so your memories never depend on us.",
  },
  {
    q: "Who can hear it when the code is scanned?",
    a: "Anyone holding the keepsake, which is the point: family, friends, guests. The page is never listed or searchable. You can pause scanning whenever you like, and your separate private link can be shared or kept to yourself.",
  },
  {
    q: "I don't have a recording. Can I still order?",
    a: "Of course. The sound is optional, and you can add one later from your memory page, as long as it reaches us before you approve the design. Many people find a forgotten voice note or video once they start looking; we can use the audio from a video too.",
  },
  {
    q: "How do you make a figurine that actually looks like my pet?",
    a: "A real artist studies your photos and the details you share (markings, ear shape, the way they sit) and sculpts a 3D design by hand. We send you a preview to approve before anything is printed. If something isn't right, tell us and we'll revise it.",
  },
  {
    q: "What photos should I upload?",
    a: "3 to 5 clear, well-lit photos: one straight-on of the face, one from the side, one full body, and any that show special markings. Natural daylight works best. Phone photos are perfect.",
  },
  {
    q: "Is anything made before I approve it?",
    a: "No. Production only starts after you approve the design preview. Our system won't let an order go to the printer without your approval on record.",
  },
  {
    q: "How long does it take?",
    a: "You'll usually see your first design preview within 3–5 working days. After you approve it, printing, hand-painting, quality checks and delivery take roughly 7–14 days depending on the edition. Each edition page shows its estimate.",
  },
  {
    q: "What is it made of?",
    a: "Your figurine is 3D printed in high-detail resin by our production partner, then hand-painted and sealed. Bases are finished to match the style you choose. It's a display keepsake: sturdy, but not a toy for pets or small children.",
  },
  {
    q: "What is a digital memory page?",
    a: "A private, elegant page for your pet's photos, videos, voice recordings and stories, included with every keepsake. Scanning the QR on the base opens it; your separate private link is yours to share or keep. It's never listed or searchable.",
  },
  {
    q: "Can I cancel or get a refund?",
    a: "Because every piece is made just for you, you can cancel for a full refund any time before you approve your design. After approval, materials and artist time are committed, but if your keepsake arrives damaged we'll remake it. See Shipping & returns for details.",
  },
  {
    q: "Do you deliver across India?",
    a: "Yes, we ship across India with tracked courier. You'll get tracking details on your order page as soon as it ships.",
  },
  {
    q: "I've lost my pet. Can you still make something?",
    a: "Yes, and we're so sorry. Many families come to us with only a few photos. Share what you have; our artist will be honest about what's possible and will take all the time needed until it feels right.",
  },
];

export const STEPS = [
  {
    n: "01",
    title: "Tell us about them",
    body: "Upload 3–5 photos and answer a few questions: the toy they love, the way they sleep, the moment you'd freeze forever.",
    time: "About 5 minutes",
  },
  {
    n: "02",
    title: "Our artist sculpts the design",
    body: "A real person studies your photos and sculpts a 3D design by hand. No templates, no automatic filters.",
    time: "3–5 working days",
  },
  {
    n: "03",
    title: "You approve it, or we refine it",
    body: "We send you a preview. Approve it, or tell us what's not quite them. Nothing is made until you say yes.",
    time: "Your pace",
  },
  {
    n: "04",
    title: "Printed, hand-painted, delivered",
    body: "Printed in fine resin, painted by hand to match their colours, checked against your photos, and gift-wrapped.",
    time: "7–14 days after approval",
  },
];

export const WHY = [
  { title: "Made from your photos, not a catalogue", body: "Every keepsake starts from scratch: your pet's markings, proportions and personality." },
  { title: "You approve before we make", body: "You see the design first. Your approval is recorded before anything goes to print." },
  { title: "Finished by hand", body: "Printed in detailed resin, then painted and sealed by hand. Small variations are part of the charm." },
  { title: "Private by design", body: "Your photos are stored privately and only seen by you and our studio. Memory pages are never public or searchable." },
  { title: "Honest about how it's made", body: "We use trusted 3D printing partners and our own painters, and we show you each stage of your order." },
  { title: "Gentle with goodbyes", body: "Memorial orders get unlimited revisions, a single point of contact, and no rush." },
];

export const EXAMPLES = [
  { src: "/renders/cat-tabby.webp", name: "Mishti", note: "For the cat who only ever sleeps in a perfect loaf.", style: "Personality · Charcoal slate" },
  { src: "/renders/forever.webp", name: "Laddoo", note: "An Indie with one ear that never quite stands up.", style: "Forever · Walnut plinth" },
  { src: "/renders/together.webp", name: "Maya & Coco", note: "Coco leans on Maya's leg on every single walk.", style: "Together · Natural oak" },
  { src: "/renders/memorial.webp", name: "Simba", note: "Asleep in the sun, the way he spent every afternoon.", style: "Memorial · Ivory stone" },
  { src: "/renders/cat-ginger.webp", name: "Mango", note: "Ginger, loud, and absolutely in charge.", style: "Personality · Walnut" },
  { src: "/renders/dog-chocolate.webp", name: "Coffee", note: "Sits like this at 7:59 pm, waiting for dinner.", style: "Forever · Ivory stone" },
];

export const RENDER_FOR: Record<string, { main: string; alt: string }> = {
  "personality-edition": { main: "/renders/personality.webp", alt: "/renders/personality-2.webp" },
  "forever-edition": { main: "/renders/forever.webp", alt: "/renders/forever-2.webp" },
  "together-edition": { main: "/renders/together.webp", alt: "/renders/together-2.webp" },
  "forever-in-our-hearts-edition": { main: "/renders/memorial.webp", alt: "/renders/memorial-2.webp" },
};
