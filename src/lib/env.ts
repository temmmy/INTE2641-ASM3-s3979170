export const env = {
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
  easAddress: process.env.NEXT_PUBLIC_EAS_ADDRESS,
  schemaUid: process.env.NEXT_PUBLIC_SCHEMA_UID,
  escrowAddress: process.env.NEXT_PUBLIC_ESCROW_ADDRESS,
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
};

export type AppEnv = typeof env;
