import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Every docs page is also available as the markdown behind it, at the page's
     own address with `.md` on the end, the way a file in the repository reads.
     The handler lives at /llms/docs/[slug] because a route segment cannot
     itself end in `.md` and stay dynamic. */
  async rewrites() {
    return [{ source: "/docs/:slug.md", destination: "/llms/docs/:slug" }];
  },

  /* Kits are private and unlisted. The layout already carries the robots meta
     tag, but a crawler that never parses the head (or a link preview bot) only
     sees the header, so the pages send it too, exactly as the file route does
     for card.png, film.mp4 and the JSON. */
  async headers() {
    return [
      {
        source: "/k/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
