import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-4 text-5xl">This page has wandered off.</h1>
      <p className="mt-3 max-w-md text-ink-soft">It may have moved, or it may be private. Memory pages are only visible to the people they&apos;ve been shared with.</p>
      <Link href="/" className="btn btn-primary mt-8">Back home</Link>
    </div>
  );
}
