import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || "84532",
    NEXT_PUBLIC_ALCHEMY_API_KEY:
      process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "",
    NEXT_PUBLIC_EAS_ADDRESS:
      process.env.NEXT_PUBLIC_EAS_ADDRESS || "",
    NEXT_PUBLIC_SCHEMA_UID:
      process.env.NEXT_PUBLIC_SCHEMA_UID || "",
    NEXT_PUBLIC_ESCROW_ADDRESS:
      process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "",
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
  },
};

export default nextConfig;
