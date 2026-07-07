/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "uysipsegizbixwgvwdzl.supabase.co" },
      { protocol: "https", hostname: "insight.citiplug.com" }
    ]
  }
};

export default nextConfig;
