export const ageEscrowAbi = [
  {
    inputs: [
      {
        internalType: "contract IEAS",
        name: "eas_",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "schemaUid_",
        type: "bytes32",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AlreadyFunded",
    type: "error",
  },
  {
    inputs: [],
    name: "BadStatus",
    type: "error",
  },
  {
    inputs: [],
    name: "DeadlineNotPassed",
    type: "error",
  },
  {
    inputs: [],
    name: "DeadlinePassed",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAmount",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAttestationProvided",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAttestor",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidDeadline",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidEAS",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSchema",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidTask",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidWorker",
    type: "error",
  },
  {
    inputs: [],
    name: "NotClient",
    type: "error",
  },
  {
    inputs: [],
    name: "NotFunded",
    type: "error",
  },
  {
    inputs: [],
    name: "NotWorker",
    type: "error",
  },
  {
    inputs: [],
    name: "TaskExists",
    type: "error",
  },
  {
    inputs: [],
    name: "TransferFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "WrongAmount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "client",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "worker",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "attestor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint64",
        name: "deadline",
        type: "uint64",
      },
    ],
    name: "TaskCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "funder",
        type: "address",
      },
    ],
    name: "TaskFunded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "workUri",
        type: "string",
      },
    ],
    name: "WorkSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "attestationUid",
        type: "bytes32",
      },
    ],
    name: "Paid",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "Refunded",
    type: "event",
  },
  {
    inputs: [],
    name: "eas",
    outputs: [
      {
        internalType: "contract IEAS",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isFunded",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "taskCompletedSchemaUid",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "taskId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "worker",
        type: "address",
      },
      {
        internalType: "address",
        name: "attestor",
        type: "address",
      },
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint64",
        name: "deadline",
        type: "uint64",
      },
    ],
    name: "createTask",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "taskId",
        type: "uint256",
      },
    ],
    name: "fundTask",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "taskId",
        type: "uint256",
      },
    ],
    name: "refund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "taskId",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "attestationUid",
        type: "bytes32",
      },
    ],
    name: "releasePayment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "taskId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "workUri",
        type: "string",
      },
    ],
    name: "submitWork",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "tasks",
    outputs: [
      {
        internalType: "address",
        name: "client",
        type: "address",
      },
      {
        internalType: "address",
        name: "worker",
        type: "address",
      },
      {
        internalType: "address",
        name: "attestor",
        type: "address",
      },
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint64",
        name: "deadline",
        type: "uint64",
      },
      {
        internalType: "uint8",
        name: "status",
        type: "uint8",
      },
      {
        internalType: "string",
        name: "workUri",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "attestationUid",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export type AgeEscrowAbi = typeof ageEscrowAbi;
