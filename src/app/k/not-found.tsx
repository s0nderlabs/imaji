import Link from "next/link";

import KitHeader from "@/components/KitHeader";

export default function KitNotFound() {
  return (
    <>
      <KitHeader />
      <main className="flex flex-1 flex-col justify-center py-16">
        <h1 className="t-xl">Nothing lives here.</h1>
        <p className="measure mt-4 text-ink-2">
          Either the address is wrong, or this release never got a kit. Kit
          pages are private, so a single mistyped character is enough to land
          you here.
        </p>
        <p className="mt-8">
          <Link href="/" className="quiet-link text-link t-sm">
            Back to the front door
          </Link>
        </p>
      </main>
    </>
  );
}
