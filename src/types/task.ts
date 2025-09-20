export type Address = `0x${string}`;

export enum TaskStatus {
  Open = 0,
  Submitted = 1,
  Paid = 2,
  Refunded = 3,
}

export type Task = {
  id: bigint;
  client: Address;
  worker: Address;
  attestor: Address;
  token: Address | null;
  amount: bigint;
  deadline: number;
  status: TaskStatus;
  workUri?: string;
  attestationUid?: `0x${string}`;
};

export type CreateTaskInput = {
  id: bigint;
  worker: Address;
  attestor: Address;
  token: Address | null;
  amount: bigint;
  deadline: number;
};

export type SubmitWorkInput = {
  id: bigint;
  workUri: string;
};

export type ReleasePaymentInput = {
  id: bigint;
  attestationUid: `0x${string}`;
};
