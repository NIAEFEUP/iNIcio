import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/candidates",
        permanent: false,
      },
      {
        source: "/admin/interviews",
        destination: "/admin/bookings",
        permanent: false,
      },
      {
        source: "/recruiter",
        destination: "/candidates",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
