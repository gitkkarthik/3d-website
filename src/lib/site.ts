export const SITE = {
  name: "Pawsome Memories",
  tagline: "Not just a miniature. A little piece of them, forever.",
  description:
    "Personalised, hand-finished 3D pet figurines made in India from your photos and stories. Approve your design before we make it. Custom dog and cat miniatures, pet memorial keepsakes and gifts.",
  url: process.env.APP_URL || "http://localhost:3000",
};

export function absoluteUrl(path = "/") {
  return new URL(path, SITE.url).toString();
}
