import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { AgentPayGateway, IERC20 } from "../typechain-types";

const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const USDC_WHALE = "0xe7804c37c13166fF0b37F5aE0BB07A3aEbb6e245";
const USDC_DECIMALS = 6;

function parseUSDC(amount: string): bigint {
  return ethers.parseUnits(amount, USDC_DECIMALS);
}

describe("AgentPayGateway", function () {
  let gateway: AgentPayGateway;
  let usdc: IERC20;
  let admin: SignerWithAddress;
  let agent: SignerWithAddress;
  let recipient1: SignerWithAddress;
  let recipient2: SignerWithAddress;
  let unauthorized: SignerWithAddress;
  let mockCore: SignerWithAddress;

  before(async function () {
    [admin, agent, recipient1, recipient2, unauthorized, mockCore] =
      await ethers.getSigners();

    usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);

    const whale = await ethers.getImpersonatedSigner(USDC_WHALE);
    await admin.sendTransaction({ to: USDC_WHALE, value: ethers.parseEther("10") });
    await usdc.connect(whale).transfer(admin.address, parseUSDC("10000"));
  });

  beforeEach(async function () {
    const AgentPayGateway = await ethers.getContractFactory("AgentPayGateway");
    gateway = (await upgrades.deployProxy(
      AgentPayGateway,
      [USDC_ADDRESS, mockCore.address, admin.address],
      { kind: "uups" }
    )) as unknown as AgentPayGateway;
    await gateway.waitForDeployment();
  });

  describe("Initialization", function () {
    it("should set USDC and core addresses", async function () {
      expect(await gateway.usdc()).to.equal(USDC_ADDRESS);
      expect(await gateway.flowGuardCore()).to.equal(mockCore.address);
    });

    it("should grant admin role", async function () {
      const ADMIN_ROLE = await gateway.ADMIN_ROLE();
      expect(await gateway.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });
  });

  describe("Agent Management", function () {
    it("should register an agent", async function () {
      await gateway.connect(admin).registerAgent(agent.address);
      const AGENT_ROLE = await gateway.AGENT_ROLE();
      expect(await gateway.hasRole(AGENT_ROLE, agent.address)).to.be.true;
    });

    it("should emit AgentRegistered event", async function () {
      await expect(gateway.connect(admin).registerAgent(agent.address))
        .to.emit(gateway, "AgentRegistered");
    });

    it("should revoke an agent", async function () {
      await gateway.connect(admin).registerAgent(agent.address);
      await gateway.connect(admin).revokeAgent(agent.address);
      const AGENT_ROLE = await gateway.AGENT_ROLE();
      expect(await gateway.hasRole(AGENT_ROLE, agent.address)).to.be.false;
    });

    it("should emit AgentRevoked event", async function () {
      await gateway.connect(admin).registerAgent(agent.address);
      await expect(gateway.connect(admin).revokeAgent(agent.address))
        .to.emit(gateway, "AgentRevoked");
    });

    it("should revert registering zero address", async function () {
      await expect(
        gateway.connect(admin).registerAgent(ethers.ZeroAddress)
      ).to.be.revertedWith("Agent: zero address");
    });

    it("should revert registering duplicate agent", async function () {
      await gateway.connect(admin).registerAgent(agent.address);
      await expect(
        gateway.connect(admin).registerAgent(agent.address)
      ).to.be.revertedWith("Agent: already registered");
    });

    it("should revert revoking non-existent agent", async function () {
      await expect(
        gateway.connect(admin).revokeAgent(agent.address)
      ).to.be.revertedWith("Agent: not registered");
    });

    it("should revert when unauthorized user registers agent", async function () {
      await expect(
        gateway.connect(unauthorized).registerAgent(agent.address)
      ).to.be.reverted;
    });
  });

  describe("Schedule Payroll", function () {
    it("should schedule a payroll", async function () {
      const block = await ethers.provider.getBlock("latest");
      const executeAfter = block!.timestamp + 3600;

      const tx = await gateway.connect(admin).schedulePayroll(
        [recipient1.address, recipient2.address],
        [parseUSDC("100"), parseUSDC("200")],
        executeAfter
      );
      await tx.wait();

      expect(await gateway.getTotalScheduled()).to.equal(1);
    });

    it("should emit PayrollScheduled event", async function () {
      const block = await ethers.provider.getBlock("latest");
      const executeAfter = block!.timestamp + 3600;

      await expect(
        gateway.connect(admin).schedulePayroll(
          [recipient1.address],
          [parseUSDC("100")],
          executeAfter
        )
      ).to.emit(gateway, "PayrollScheduled");
    });

    it("should revert with empty recipients", async function () {
      const block = await ethers.provider.getBlock("latest");
      await expect(
        gateway.connect(admin).schedulePayroll([], [], block!.timestamp + 3600)
      ).to.be.revertedWith("Agent: empty recipients");
    });

    it("should revert with length mismatch", async function () {
      const block = await ethers.provider.getBlock("latest");
      await expect(
        gateway.connect(admin).schedulePayroll(
          [recipient1.address],
          [parseUSDC("100"), parseUSDC("200")],
          block!.timestamp + 3600
        )
      ).to.be.revertedWith("Agent: length mismatch");
    });

    it("should revert with past execution time", async function () {
      await expect(
        gateway.connect(admin).schedulePayroll(
          [recipient1.address],
          [parseUSDC("100")],
          1
        )
      ).to.be.revertedWith("Agent: invalid schedule time");
    });
  });

  describe("Execute Scheduled Payroll", function () {
    let payrollId: string;

    beforeEach(async function () {
      await gateway.connect(admin).registerAgent(agent.address);

      const block = await ethers.provider.getBlock("latest");
      const executeAfter = block!.timestamp + 1;

      const tx = await gateway.connect(admin).schedulePayroll(
        [recipient1.address],
        [parseUSDC("500")],
        executeAfter
      );
      const receipt = await tx.wait();

      const event = receipt?.logs.find((log) => {
        try {
          return gateway.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "PayrollScheduled";
        } catch {
          return false;
        }
      });
      if (event) {
        const parsed = gateway.interface.parseLog({ topics: event.topics as string[], data: event.data });
        payrollId = parsed?.args[0];
      }

      await usdc.connect(admin).approve(await gateway.getAddress(), parseUSDC("500"));

      await ethers.provider.send("evm_increaseTime", [10]);
      await ethers.provider.send("evm_mine", []);
    });

    it("should execute a scheduled payroll with valid signature", async function () {
      const nonce = ethers.keccak256(ethers.toUtf8Bytes("nonce-1"));
      const messageHash = ethers.solidityPackedKeccak256(
        ["bytes32", "bytes32", "uint256", "address"],
        [payrollId, nonce, 137, await gateway.getAddress()]
      );
      const signature = await agent.signMessage(ethers.getBytes(messageHash));

      await gateway.connect(agent).executeScheduledPayroll(payrollId, nonce, signature);

      expect(await gateway.getTotalExecuted()).to.equal(1);
      expect(await usdc.balanceOf(recipient1.address)).to.be.gte(parseUSDC("500"));
    });

    it("should prevent replay attacks with used nonce", async function () {
      const nonce = ethers.keccak256(ethers.toUtf8Bytes("replay-nonce"));
      const messageHash = ethers.solidityPackedKeccak256(
        ["bytes32", "bytes32", "uint256", "address"],
        [payrollId, nonce, 137, await gateway.getAddress()]
      );
      const signature = await agent.signMessage(ethers.getBytes(messageHash));

      await gateway.connect(agent).executeScheduledPayroll(payrollId, nonce, signature);

      await expect(
        gateway.connect(agent).executeScheduledPayroll(payrollId, nonce, signature)
      ).to.be.revertedWith("Agent: nonce already used");
    });

    it("should revert for non-existent payroll", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      const nonce = ethers.keccak256(ethers.toUtf8Bytes("nonce-fake"));
      const messageHash = ethers.solidityPackedKeccak256(
        ["bytes32", "bytes32", "uint256", "address"],
        [fakeId, nonce, 137, await gateway.getAddress()]
      );
      const signature = await agent.signMessage(ethers.getBytes(messageHash));

      await expect(
        gateway.connect(agent).executeScheduledPayroll(fakeId, nonce, signature)
      ).to.be.revertedWith("Agent: payroll not found");
    });
  });

  describe("Pause / Unpause", function () {
    it("should pause scheduling", async function () {
      await gateway.connect(admin).pause();
      const block = await ethers.provider.getBlock("latest");
      await expect(
        gateway.connect(admin).schedulePayroll(
          [recipient1.address],
          [parseUSDC("100")],
          block!.timestamp + 3600
        )
      ).to.be.reverted;
    });

    it("should unpause and allow scheduling", async function () {
      await gateway.connect(admin).pause();
      await gateway.connect(admin).unpause();
      const block = await ethers.provider.getBlock("latest");
      await expect(
        gateway.connect(admin).schedulePayroll(
          [recipient1.address],
          [parseUSDC("100")],
          block!.timestamp + 3600
        )
      ).to.not.be.reverted;
    });

    it("should revert unauthorized pause", async function () {
      await expect(gateway.connect(unauthorized).pause()).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("should check nonce status", async function () {
      const nonce = ethers.keccak256(ethers.toUtf8Bytes("check-nonce"));
      expect(await gateway.isNonceUsed(nonce)).to.be.false;
    });
  });
});
