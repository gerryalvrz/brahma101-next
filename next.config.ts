import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* Strudel loads from /public/vendor/strudel (script tag) — not bundled. */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

export default nextConfig;
