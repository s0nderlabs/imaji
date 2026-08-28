import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kits",
  robots: { index: false, follow: false },
};

/* The shell every kit page sits in: one warm column on paper. The header
   belongs to the page rather than the shell, because it carries the repo
   name and only the page knows it. */
export default function KitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[760px] flex-col px-4 sm:px-6">
      {children}
      <footer className="mt-auto pt-16 pb-8">
        <p className="measure t-xs text-ink-3">
          Unlisted and not indexed. Anyone with the link can read this page.
        </p>
      </footer>
    </div>
  );
}
