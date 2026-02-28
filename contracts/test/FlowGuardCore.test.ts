import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { FlowGuardCore, IERC20 } from "../typechain-types";

const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const USDC_WHALE = "0xe7804c37c13166fF0b37F5aE0BB07A3aEbb6e245";
const USDC_DECIMALS = 6;

function parseUSDC(amount: string): bigint {
  return ethers.parseUnits(amount, USDC_DECIMALS);
}

describe("FlowGuardCore", function () {
  let core: FlowGuardCore;
  let usdc: IERC20;
  let admin: SignerWithAddress;
  let payer: SignerWithAddress;
  let recipient1: SignerWithAddress;
  let recipient2: SignerWithAddress;
  let recipient3: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  before(async function () {
    [admin, payer, recipient1, recipient2, recipient3, unauthorized] =
      await ethers.getSigners();

    usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);

    const whale = await ethers.getImpersonatedSigner(USDC_WHALE);
    const fundAmount = parseUSDC("10000");

    await admin.sendTransaction({ to: USDC_WHALE, value: ethers.parseEther("10") });
    await usdc.connect(whale).transfer(admin.address, fundAmount);
    await usdc.connect(whale).transfer(payer.address, fundAmount);
  });

  beforeEach(async function () {
    const FlowGuardCore = await ethers.getContractFactory("FlowGuardCore");
    core = (await upgrades.deployProxy(FlowGuardCore, [USDC_ADDRESS, admin.address], {
      kind: "uups",
    })) as unknown as FlowGuardCore;
    await core.waitForDeployment();

    const PAYER_ROLE = await core.PAYER_ROLE();
    await core.connect(admin).grantRole(PAYER_ROLE, payer.address);
  });

  describe("Initialization", function () {
    it("should set USDC address correctly", async function () {
      expect(await core.usdc()).to.equal(USDC_ADDRESS);
    });

    it("should grant admin roles to deployer", async function () {
      const ADMIN_ROLE = await core.ADMIN_ROLE();
      const DEFAULT_ADMIN_ROLE = await core.DEFAULT_ADMIN_ROLE();
      expect(await core.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
      expect(await core.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("should revert on zero USDC address", async function () {
      const FlowGuardCore = await ethers.getContractFactory("FlowGuardCore");
      await expect(
        upgrades.deployProxy(FlowGuardCore, [ethers.ZeroAddress, admin.address], { kind: "uups" })
      ).to.be.revertedWith("FlowGuard: zero USDC address");
    });

    it("should revert on zero admin address", async function () {
      const FlowGuardCore = await ethers.getContractFactory("FlowGuardCore");
      await expect(
        upgrades.deployProxy(FlowGuardCore, [USDC_ADDRESS, ethers.ZeroAddress], { kind: "uups" })
      ).to.be.revertedWith("FlowGuard: zero admin address");
    });
  });

  describe("Recipient Management", function () {
    it("should add recipients", async function () {
      await core.connect(admin).addRecipient(recipient1.address, "Employee 1");
      expect(await core.isRecipient(recipient1.address)).to.be.true;
      expect(await core.getRecipientLabel(recipient1.address)).to.equal("Employee 1");
    });

    it("should remove recipients", async function () {
      await core.connect(admin).addRecipient(recipient1.address, "Employee 1");
      await core.connect(admin).removeRecipient(recipient1.address);
      expect(await core.isRecipient(recipient1.address)).to.be.false;
    });

    it("should revert adding duplicate recipient", async function () {
      await core.connect(admin).addRecipient(recipient1.address, "Employee 1");
      await expect(
        core.connect(admin).addRecipient(recipient1.address, "Employee 1")
      ).to.be.revertedWith("FlowGuard: already registered");
    });

    it("should revert removing non-existent recipient", async function () {
      await expect(
        core.connect(admin).removeRecipient(recipient1.address)
      ).to.be.revertedWith("FlowGuard: not registered");
    });

    it("should revert adding zero address", async function () {
      await expect(
        core.connect(admin).addRecipient(ethers.ZeroAddress, "Zero")
      ).to.be.revertedWith("FlowGuard: zero address");
    });

    it("should correctly return all recipients", async function () {
      await core.connect(admin).addRecipient(recipient1.address, "Emp 1");
      await core.connect(admin).addRecipient(recipient2.address, "Emp 2");
      await core.connect(admin).addRecipient(recipient3.address, "Emp 3");

      const recipients = await core.getRecipients();
      expect(recipients.length).to.equal(3);
      expect(recipients).to.include(recipient1.address);
      expect(recipients).to.include(recipient2.address);
      expect(recipients).to.include(recipient3.address);
    });

    it("should handle remove + re-add correctly", async function () {
      await core.connect(admin).addRecipient(recipient1.address, "Emp 1");
      await core.connect(admin).addRecipient(recipient2.address, "Emp 2");
      await core.connect(admin).removeRecipient(recipient1.address);
      await core.connect(admin).addRecipient(recipient1.address, "Emp 1 v2");

      const recipients = await core.getRecipients();
      expect(recipients.length).to.equal(2);
      expect(await core.getRecipientLabel(recipient1.address)).to.equal("Emp 1 v2");
    });

    it("should revert when unauthorized user adds recipient", async function () {
      await expect(
        core.connect(unauthorized).addRecipient(recipient1.address, "Unauthorized")
      ).to.be.reverted;
    });
  });

  describe("Payroll Execution", function () {
    it("should execute a batch payroll", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [parseUSDC("100"), parseUSDC("200")];
      const totalAmount = parseUSDC("300");

      await usdc.connect(payer).approve(await core.getAddress(), totalAmount);

      const tx = await core.connect(payer).executePayroll(recipients, amounts);
      const receipt = await tx.wait();

      expect(await core.getBatchCount()).to.equal(1);
      expect(await core.getTotalDisbursed()).to.equal(totalAmount);
      expect(await usdc.balanceOf(recipient1.address)).to.equal(parseUSDC("100"));
      expect(await usdc.balanceOf(recipient2.address)).to.equal(parseUSDC("200"));
    });

    it("should emit PayrollExecuted event", async function () {
      const recipients = [recipient1.address];
      const amounts = [parseUSDC("50")];
      await usdc.connect(payer).approve(await core.getAddress(), parseUSDC("50"));

      await expect(core.connect(payer).executePayroll(recipients, amounts))
        .to.emit(core, "PayrollExecuted");
    });

    it("should revert with empty recipients", async function () {
      await expect(
        core.connect(payer).executePayroll([], [])
      ).to.be.revertedWith("FlowGuard: empty recipients");
    });

    it("should revert with length mismatch", async function () {
      await expect(
        core.connect(payer).executePayroll([recipient1.address], [parseUSDC("100"), parseUSDC("200")])
      ).to.be.revertedWith("FlowGuard: length mismatch");
    });

    it("should revert with zero recipient address", async function () {
      await usdc.connect(payer).approve(await core.getAddress(), parseUSDC("100"));
      await expect(
        core.connect(payer).executePayroll([ethers.ZeroAddress], [parseUSDC("100")])
      ).to.be.revertedWith("FlowGuard: zero recipient");
    });

    it("should revert with zero amount", async function () {
      await expect(
        core.connect(payer).executePayroll([recipient1.address], [0])
      ).to.be.revertedWith("FlowGuard: zero amount");
    });

    it("should revert if caller lacks PAYER_ROLE", async function () {
      await expect(
        core.connect(unauthorized).executePayroll([recipient1.address], [parseUSDC("100")])
      ).to.be.reverted;
    });

    it("should track batch IDs correctly", async function () {
      await usdc.connect(payer).approve(await core.getAddress(), parseUSDC("500"));
      await core.connect(payer).executePayroll([recipient1.address], [parseUSDC("250")]);
      await core.connect(payer).executePayroll([recipient2.address], [parseUSDC("250")]);

      const batchIds = await core.getBatchIds(0, 10);
      expect(batchIds.length).to.equal(2);

      const batch1 = await core.getBatch(batchIds[0]);
      expect(batch1.payer).to.equal(payer.address);
      expect(batch1.totalAmount).to.equal(parseUSDC("250"));
    });
  });

  describe("Pause / Unpause", function () {
    it("should pause and prevent payroll execution", async function () {
      await core.connect(admin).pause();
      await usdc.connect(payer).approve(await core.getAddress(), parseUSDC("100"));
      await expect(
        core.connect(payer).executePayroll([recipient1.address], [parseUSDC("100")])
      ).to.be.reverted;
    });

    it("should unpause and allow payroll execution", async function () {
      await core.connect(admin).pause();
      await core.connect(admin).unpause();
      await usdc.connect(payer).approve(await core.getAddress(), parseUSDC("100"));
      await expect(
        core.connect(payer).executePayroll([recipient1.address], [parseUSDC("100")])
      ).to.not.be.reverted;
    });

    it("should revert when unauthorized user pauses", async function () {
      await expect(core.connect(unauthorized).pause()).to.be.reverted;
    });
  });

  describe("UUPS Upgrade", function () {
    it("should be upgradeable by admin", async function () {
      const FlowGuardCoreV2 = await ethers.getContractFactory("FlowGuardCore");
      const upgraded = await upgrades.upgradeProxy(await core.getAddress(), FlowGuardCoreV2);
      expect(await upgraded.getAddress()).to.equal(await core.getAddress());
    });

    it("should revert upgrade by non-admin", async function () {
      const FlowGuardCoreV2 = await ethers.getContractFactory("FlowGuardCore", unauthorized);
      await expect(
        upgrades.upgradeProxy(await core.getAddress(), FlowGuardCoreV2)
      ).to.be.reverted;
    });
  });
});
