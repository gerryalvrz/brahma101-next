import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/music",
        destination: "/metacognitive-music",
        permanent: true,
      },
      {
        source: "/music/archive",
        destination: "/metacognitive-music/archive",
        permanent: true,
      },
    ];
  },
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
