import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "imaji",
  description:
    "One release in, a whole launch kit out. Your own Mind writes the kit for every release you tag; imaji renders it. For solo builders who only ship.",
};

/* The theme, before the first paint. The page follows the system by default,
   so nothing is stamped on <html> unless the reader has chosen; the choice is
   read here, synchronously, so a chosen dark page never flashes light. */
const THEME = `(function(){try{var t=localStorage.getItem("imaji-theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
      </head>
      {/* colours, type and the paper grain all come from globals.css */}
      <body className="min-h-full">{children}</body>
    </html>
  );
}
