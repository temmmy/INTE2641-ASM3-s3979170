import { env } from "./env";
import { ageEscrowAbi } from "./ageEscrowAbi";

export const contracts = {
  ageEscrow: {
    address: env.escrowAddress,
    abi: ageEscrowAbi,
  } as const,
};
