import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Inclui as fontes no bundle das serverless functions (necessário para react-pdf no Vercel)
  outputFileTracingIncludes: {
    '/api/obras/[id]/orcamento-pdf': ['./public/fonts/**'],
  },
};

export default nextConfig;
