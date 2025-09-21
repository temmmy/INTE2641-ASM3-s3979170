"use client";

import { env } from "./env";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { baseSepolia } from "wagmi/chains";

if (env.chainId !== baseSepolia.id) {
  throw new Error(
    `Configured chain (${env.chainId}) does not match supported Base Sepolia chain (${baseSepolia.id})`
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "AGE Escrow",
  projectId: env.walletConnectProjectId || "",
  ssr: true,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(env.rpcUrl),
  },
});
