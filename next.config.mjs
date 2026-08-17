/** @type {import('next').NextConfig} */
const nextConfig = {
  // The digital-download route builds its PDF file path at runtime
  // (path.join(process.cwd(), "content", "digital-products", fileName)), which Vercel's
  // static file tracer (@vercel/nft) is not guaranteed to pick up on its own — a missed
  // file means every download 500s in production, AFTER the customer has already paid.
  // This project pins Next 14.2.x, where outputFileTracingIncludes still lives under
  // `experimental` (it moved to top-level config in Next 15).
  experimental: {
    outputFileTracingIncludes: {
      "/api/digital-download": ["./content/digital-products/**"],
    },
  },
};
export default nextConfig;
