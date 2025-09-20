/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from "chai";
import "@nomicfoundation/hardhat-chai-matchers";
import * as hre from "hardhat";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import type { Contract } from "ethers";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const { ethers } = hre;

const ZERO_BYTES32 = ethers.ZeroHash;
const abiCoder = ethers.AbiCoder.defaultAbiCoder();

type AgeEscrowContract = Contract & {
  connect: (signer: HardhatEthersSigner) => AgeEscrowContract;
  createTask: (...args: any[]) => Promise<any>;
  fundTask: (...args: any[]) => Promise<any>;
  submitWork: (...args: any[]) => Promise<any>;
  releasePayment: (...args: any[]) => Promise<any>;
  refund: (...args: any[]) => Promise<any>;
  isFunded: (taskId: number) => Promise<boolean>;
  tasks: (taskId: number) => Promise<any>;
};

type MockEASContract = Contract & {
  connect: (signer: HardhatEthersSigner) => MockEASContract;
  setAttestation: (attestation: any) => Promise<any>;
};

type TestTokenContract = Contract & {
  connect: (signer: HardhatEthersSigner) => TestTokenContract;
  getAddress: () => Promise<string>;
  mint: (to: string, amount: bigint) => Promise<any>;
  approve: (spender: string, amount: bigint) => Promise<any>;
  balanceOf: (address: string) => Promise<bigint>;
};

interface DeployResult {
  escrow: AgeEscrowContract;
  eas: MockEASContract;
  client: HardhatEthersSigner;
  worker: HardhatEthersSigner;
  attestor: HardhatEthersSigner;
  stranger: HardhatEthersSigner;
  schemaUid: string;
}

describe("AgeEscrow", () => {
  async function deployFixture(): Promise<DeployResult> {
    const [client, worker, attestor, stranger] = await ethers.getSigners();

    const schemaUid = ethers.id("TASK_COMPLETED_SCHEMA_UID");

    const MockEAS = await ethers.getContractFactory("MockEAS");
    const eas = (await MockEAS.deploy()) as MockEASContract;
    await eas.waitForDeployment();

    const AgeEscrow = await ethers.getContractFactory("AgeEscrow");
    const escrow = (await AgeEscrow.deploy(
      await eas.getAddress(),
      schemaUid
    )) as AgeEscrowContract;
    await escrow.waitForDeployment();

    return { escrow, eas, client, worker, attestor, stranger, schemaUid };
  }

  async function createDefaultTask(
    context: DeployResult,
    overrides: Partial<{
      token: string;
      amount: bigint;
      deadline: number;
      attestor: string;
      worker: string;
    }> = {}
  ) {
    const { escrow, client, worker, attestor } = context;
    const amount = overrides.amount ?? ethers.parseEther("1");
    const deadline =
      overrides.deadline ?? (await time.latest()) + 7 * 24 * 60 * 60;

    await escrow
      .connect(client)
      .createTask(
        1,
        overrides.worker ?? worker.address,
        overrides.attestor ?? attestor.address,
        overrides.token ?? ethers.ZeroAddress,
        amount,
        deadline
      );

    return { amount, deadline };
  }

  async function fundETH(context: DeployResult, taskId = 1, amount?: bigint) {
    const { escrow, client } = context;
    const fundAmount = amount ?? ethers.parseEther("1");
    await escrow.connect(client).fundTask(taskId, { value: fundAmount });
  }

  async function encodeAttestationData(
    taskId: bigint | number,
    worker: string,
    client: string,
    options: { qualityScore?: number; comment?: string } = {}
  ) {
    return abiCoder.encode(
      ["uint256", "uint8", "string", "address", "address"],
      [
        BigInt(taskId),
        options.qualityScore ?? 5,
        options.comment ?? "looks good",
        worker,
        client,
      ]
    );
  }

  async function seedAttestation(
    context: DeployResult,
    params: {
      taskId: bigint | number;
      uid?: string;
      worker?: string;
      client?: string;
      attestor?: string;
      schemaUid?: string;
      expirationTime?: bigint;
      revocationTime?: bigint;
      data?: string;
    }
  ): Promise<string> {
    const {
      eas,
      attestor: defaultAttestor,
      worker: defaultWorker,
      client: defaultClient,
      schemaUid,
    } = context;
    const uid = params.uid ?? ethers.id(`attestation-${Math.random()}`);
    const worker = params.worker ?? defaultWorker.address;
    const client = params.client ?? defaultClient.address;
    const attestorAddress = params.attestor ?? defaultAttestor.address;
    const attestationTaskId = BigInt(params.taskId);
    const data =
      params.data ??
      (await encodeAttestationData(attestationTaskId, worker, client, {
        qualityScore: 10,
        comment: "ship it",
      }));

    const attestation = {
      uid,
      schema: params.schemaUid ?? schemaUid,
      time: BigInt(await time.latest()),
      expirationTime: params.expirationTime ?? BigInt(0),
      revocationTime: params.revocationTime ?? BigInt(0),
      refUID: ZERO_BYTES32,
      recipient: worker,
      attester: attestorAddress,
      revocable: false,
      data,
    };

    await eas.setAttestation(attestation);
    return uid;
  }

  describe("creation", () => {
    it("stores task details", async () => {
      const context = await loadFixture(deployFixture);
      await createDefaultTask(context);

      const task = await context.escrow.tasks(1);
      expect(task.client).to.equal(context.client.address);
      expect(task.worker).to.equal(context.worker.address);
      expect(task.attestor).to.equal(context.attestor.address);
      expect(task.token).to.equal(ethers.ZeroAddress);
      expect(task.amount).to.equal(ethers.parseEther("1"));
      expect(task.status).to.equal(0); // Open
    });

    it("reverts for invalid parameters", async () => {
      const { escrow, client, worker, attestor } = await loadFixture(
        deployFixture
      );
      const futureDeadline = (await time.latest()) + 1;

      await expect(
        escrow
          .connect(client)
          .createTask(
            1,
            ethers.ZeroAddress,
            attestor.address,
            ethers.ZeroAddress,
            ethers.parseEther("1"),
            futureDeadline
          )
      ).to.be.revertedWithCustomError(escrow, "InvalidWorker");

      await expect(
        escrow
          .connect(client)
          .createTask(
            1,
            worker.address,
            ethers.ZeroAddress,
            ethers.ZeroAddress,
            ethers.parseEther("1"),
            futureDeadline
          )
      ).to.be.revertedWithCustomError(escrow, "InvalidAttestor");

      await expect(
        escrow
          .connect(client)
          .createTask(
            1,
            worker.address,
            attestor.address,
            ethers.ZeroAddress,
            0,
            futureDeadline
          )
      ).to.be.revertedWithCustomError(escrow, "InvalidAmount");

      await expect(
        escrow
          .connect(client)
          .createTask(
            1,
            worker.address,
            attestor.address,
            ethers.ZeroAddress,
            ethers.parseEther("1"),
            await time.latest()
          )
      ).to.be.revertedWithCustomError(escrow, "InvalidDeadline");
    });
  });

  describe("funding", () => {
    it("accepts ETH funding", async () => {
      const context = await loadFixture(deployFixture);
      await createDefaultTask(context);
      await fundETH(context);

      expect(await context.escrow.isFunded(1)).to.equal(true);
    });

    it("reverts when wrong amount sent", async () => {
      const context = await loadFixture(deployFixture);
      await createDefaultTask(context);

      await expect(
        context.escrow
          .connect(context.client)
          .fundTask(1, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(context.escrow, "WrongAmount");
    });

    it("funds ERC20 tasks", async () => {
      const context = await loadFixture(deployFixture);
      const TestToken = await ethers.getContractFactory("TestToken");
      const token = (await TestToken.deploy()) as TestTokenContract;
      await token.waitForDeployment();

      const amount = ethers.parseEther("5");
      await context.escrow
        .connect(context.client)
        .createTask(
          2,
          context.worker.address,
          context.attestor.address,
          await token.getAddress(),
          amount,
          (await time.latest()) + 1000
        );

      await token
        .connect(context.client)
        .approve(await context.escrow.getAddress(), amount);
      await context.escrow.connect(context.client).fundTask(2);

      expect(await context.escrow.isFunded(2)).to.equal(true);
      expect(await token.balanceOf(await context.escrow.getAddress())).to.equal(
        amount
      );
    });
  });

  describe("work submission", () => {
    it("allows funded worker to submit", async () => {
      const context = await loadFixture(deployFixture);
      await createDefaultTask(context);
      await fundETH(context);

      await expect(
        context.escrow.connect(context.worker).submitWork(1, "ipfs://cid")
      )
        .to.emit(context.escrow, "WorkSubmitted")
        .withArgs(1, "ipfs://cid");

      const task = await context.escrow.tasks(1);
      expect(task.status).to.equal(1); // Submitted
      expect(task.workUri).to.equal("ipfs://cid");
    });

    it("prevents submission when unfunded", async () => {
      const context = await loadFixture(deployFixture);
      await createDefaultTask(context);

      await expect(
        context.escrow.connect(context.worker).submitWork(1, "ipfs://cid")
      ).to.be.revertedWithCustomError(context.escrow, "NotFunded");
    });
  });

  describe("release payment", () => {
    it("pays out with valid attestation (ETH)", async () => {
      const context = await loadFixture(deployFixture);
      await createDefaultTask(context);
      await fundETH(context);
      await context.escrow.connect(context.worker).submitWork(1, "ipfs://cid");

      const uid = await seedAttestation(context, { taskId: 1 });

      const before = await ethers.provider.getBalance(context.worker.address);
      const tx = await context.escrow.releasePayment(1, uid);
      const receipt = await tx.wait();
      const gasUsed = BigInt(receipt?.gasUsed ?? 0);
      const effectivePrice = BigInt(receipt?.gasPrice ?? 0);

      const after = await ethers.provider.getBalance(context.worker.address);
      expect(after - before).to.equal(
        ethers.parseEther("1") - gasUsed * effectivePrice
      );

      const task = await context.escrow.tasks(1);
      expect(task.status).to.equal(2); // Paid
      expect(task.attestationUid).to.equal(uid);
    });

    it("validates attestation schema", async () => {
      const context = await loadFixture(deployFixture);
      await createDefaultTask(context);
      await fundETH(context);
      await context.escrow.connect(context.worker).submitWork(1, "ipfs://cid");

      const uid = await seedAttestation(context, {
        taskId: 1,
        schemaUid: ethers.id("wrong"),
      });

      await expect(
        context.escrow.releasePayment(1, uid)
      ).to.be.revertedWithCustomError(
        context.escrow,
        "InvalidAttestationProvided"
      );
    });

    it("validates task binding", async () => {
      const context = await loadFixture(deployFixture);
      await createDefaultTask(context);
      await fundETH(context);
      await context.escrow.connect(context.worker).submitWork(1, "ipfs://cid");

      const badData = await encodeAttestationData(
        99,
        context.worker.address,
        context.client.address
      );
      const uid = await seedAttestation(context, { taskId: 1, data: badData });

      await expect(
        context.escrow.releasePayment(1, uid)
      ).to.be.revertedWithCustomError(
        context.escrow,
        "InvalidAttestationProvided"
      );
    });

    it("rejects expired attestations", async () => {
      const context = await loadFixture(deployFixture);
      await createDefaultTask(context);
      await fundETH(context);
      await context.escrow.connect(context.worker).submitWork(1, "ipfs://cid");

      const now = BigInt(await time.latest());
      const uid = await seedAttestation(context, {
        taskId: 1,
        expirationTime: now - BigInt(1),
      });

      await expect(
        context.escrow.releasePayment(1, uid)
      ).to.be.revertedWithCustomError(
        context.escrow,
        "InvalidAttestationProvided"
      );
    });
  });

  describe("refund", () => {
    it("refunds client after deadline", async () => {
      const context = await loadFixture(deployFixture);
      await createDefaultTask(context);
      await fundETH(context);

      await time.increaseTo((await time.latest()) + 8 * 24 * 60 * 60);

      const before = await ethers.provider.getBalance(context.client.address);
      const tx = await context.escrow.connect(context.client).refund(1);
      const receipt = await tx.wait();
      const gasUsed = BigInt(receipt?.gasUsed ?? 0);
      const effectivePrice = BigInt(receipt?.gasPrice ?? 0);
      const after = await ethers.provider.getBalance(context.client.address);

      expect(after).to.equal(
        before + ethers.parseEther("1") - gasUsed * effectivePrice
      );

      const task = await context.escrow.tasks(1);
      expect(task.status).to.equal(3); // Refunded
    });

    it("prevents refund before deadline", async () => {
      const context = await loadFixture(deployFixture);
      await createDefaultTask(context);
      await fundETH(context);

      await expect(
        context.escrow.connect(context.client).refund(1)
      ).to.be.revertedWithCustomError(context.escrow, "DeadlineNotPassed");
    });
  });

  describe("ERC20 release", () => {
    it("pays ERC20 worker", async () => {
      const context = await loadFixture(deployFixture);
      const TestToken = await ethers.getContractFactory("TestToken");
      const token = (await TestToken.deploy()) as TestTokenContract;
      await token.waitForDeployment();

      const amount = ethers.parseEther("5");
      await token.mint(context.client.address, amount);
      await context.escrow
        .connect(context.client)
        .createTask(
          3,
          context.worker.address,
          context.attestor.address,
          await token.getAddress(),
          amount,
          (await time.latest()) + 1000
        );

      await token
        .connect(context.client)
        .approve(await context.escrow.getAddress(), amount);
      await context.escrow.connect(context.client).fundTask(3);
      await context.escrow.connect(context.worker).submitWork(3, "cid");

      const uid = await seedAttestation(context, {
        taskId: 3,
        worker: context.worker.address,
        client: context.client.address,
        attestor: context.attestor.address,
      });

      await context.escrow.releasePayment(3, uid);

      expect(await token.balanceOf(context.worker.address)).to.equal(amount);
      const task = await context.escrow.tasks(3);
      expect(task.status).to.equal(2);
    });
  });
});
