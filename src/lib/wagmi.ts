"use client";

import { env } from "./env";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

if (env.chainId !== sepolia.id) {
  throw new Error(
    `Configured chain (${env.chainId}) does not match supported Sepolia chain (${sepolia.id})`
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "AGE Escrow",
  projectId: env.walletConnectProjectId,
  ssr: true,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(env.rpcUrl),
  },
});
