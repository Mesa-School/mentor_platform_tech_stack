import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  async redirects() {
    return [
      {
        // `/admin` is a namespace, not a screen.
        //
        // Doing this here rather than with a `redirect()` in a page matters: a
        // statically prerendered page can't return a 307, so Next falls back to
        // a `<meta http-equiv="refresh" content="1;...">` — a full second of
        // blank screen. A config redirect is handled before rendering, costs no
        // JS, and is a real HTTP redirect.
        source: "/admin",
        destination: "/admin/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
