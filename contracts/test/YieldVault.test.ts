import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { YieldVault, IERC20 } from "../typechain-types";

const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const AAVE_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
const USDC_WHALE = "0xe7804c37c13166fF0b37F5aE0BB07A3aEbb6e245";
const USDC_DECIMALS = 6;

function parseUSDC(amount: string): bigint {
  return ethers.parseUnits(amount, USDC_DECIMALS);
}

describe("YieldVault", function () {
  let vault: YieldVault;
  let usdc: IERC20;
  let admin: SignerWithAddress;
  let depositor1: SignerWithAddress;
  let depositor2: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  before(async function () {
    [admin, depositor1, depositor2, unauthorized] = await ethers.getSigners();
    usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);

    const whale = await ethers.getImpersonatedSigner(USDC_WHALE);
    await admin.sendTransaction({ to: USDC_WHALE, value: ethers.parseEther("10") });
    await usdc.connect(whale).transfer(depositor1.address, parseUSDC("10000"));
    await usdc.connect(whale).transfer(depositor2.address, parseUSDC("10000"));
  });

  beforeEach(async function () {
    const YieldVault = await ethers.getContractFactory("YieldVault");
    vault = (await upgrades.deployProxy(
      YieldVault,
      [USDC_ADDRESS, AAVE_POOL, admin.address],
      { kind: "uups" }
    )) as unknown as YieldVault;
    await vault.waitForDeployment();
  });

  describe("Initialization", function () {
    it("should set USDC and Aave pool addresses", async function () {
      expect(await vault.usdc()).to.equal(USDC_ADDRESS);
      expect(await vault.aavePool()).to.equal(AAVE_POOL);
    });

    it("should have a valid aToken address", async function () {
      const aTokenAddr = await vault.aToken();
      expect(aTokenAddr).to.not.equal(ethers.ZeroAddress);
    });

    it("should revert on zero addresses", async function () {
      const YieldVault = await ethers.getContractFactory("YieldVault");
      await expect(
        upgrades.deployProxy(YieldVault, [ethers.ZeroAddress, AAVE_POOL, admin.address], { kind: "uups" })
      ).to.be.revertedWith("Vault: zero USDC address");
    });
  });

  describe("Deposit", function () {
    it("should deposit USDC into Aave V3", async function () {
      const amount = parseUSDC("1000");
      await usdc.connect(depositor1).approve(await vault.getAddress(), amount);
      await vault.connect(depositor1).deposit(amount);

      expect(await vault.getDeposit(depositor1.address)).to.equal(amount);
      expect(await vault.getTotalDeposits()).to.equal(amount);
    });

    it("should emit Deposited event", async function () {
      const amount = parseUSDC("500");
      await usdc.connect(depositor1).approve(await vault.getAddress(), amount);
      await expect(vault.connect(depositor1).deposit(amount))
        .to.emit(vault, "Deposited");
    });

    it("should revert on zero deposit", async function () {
      await expect(vault.connect(depositor1).deposit(0))
        .to.be.revertedWith("Vault: zero deposit");
    });

    it("should track multiple depositors", async function () {
      await usdc.connect(depositor1).approve(await vault.getAddress(), parseUSDC("1000"));
      await usdc.connect(depositor2).approve(await vault.getAddress(), parseUSDC("2000"));

      await vault.connect(depositor1).deposit(parseUSDC("1000"));
      await vault.connect(depositor2).deposit(parseUSDC("2000"));

      expect(await vault.getDeposit(depositor1.address)).to.equal(parseUSDC("1000"));
      expect(await vault.getDeposit(depositor2.address)).to.equal(parseUSDC("2000"));
      expect(await vault.getTotalDeposits()).to.equal(parseUSDC("3000"));
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      await usdc.connect(depositor1).approve(await vault.getAddress(), parseUSDC("5000"));
      await vault.connect(depositor1).deposit(parseUSDC("5000"));
    });

    it("should withdraw USDC from Aave V3", async function () {
      const balBefore = await usdc.balanceOf(depositor1.address);
      await vault.connect(depositor1).withdraw(parseUSDC("2000"));
      const balAfter = await usdc.balanceOf(depositor1.address);

      expect(balAfter - balBefore).to.equal(parseUSDC("2000"));
      expect(await vault.getDeposit(depositor1.address)).to.equal(parseUSDC("3000"));
    });

    it("should emit Withdrawn event", async function () {
      await expect(vault.connect(depositor1).withdraw(parseUSDC("1000")))
        .to.emit(vault, "Withdrawn");
    });

    it("should revert on zero withdrawal", async function () {
      await expect(vault.connect(depositor1).withdraw(0))
        .to.be.revertedWith("Vault: zero withdrawal");
    });

    it("should revert on insufficient deposit", async function () {
      await expect(vault.connect(depositor1).withdraw(parseUSDC("10000")))
        .to.be.revertedWith("Vault: insufficient deposit");
    });

    it("should allow full withdrawal", async function () {
      await vault.connect(depositor1).withdraw(parseUSDC("5000"));
      expect(await vault.getDeposit(depositor1.address)).to.equal(0);
      expect(await vault.getTotalDeposits()).to.equal(0);
    });
  });

  describe("Yield Calculation", function () {
    it("should return zero yield for no deposits", async function () {
      expect(await vault.getYield(depositor1.address)).to.equal(0);
    });

    it("should return zero yield immediately after deposit", async function () {
      await usdc.connect(depositor1).approve(await vault.getAddress(), parseUSDC("1000"));
      await vault.connect(depositor1).deposit(parseUSDC("1000"));
      const yield_ = await vault.getYield(depositor1.address);
      expect(yield_).to.be.gte(0);
    });
  });

  describe("Pause / Unpause", function () {
    it("should pause deposits", async function () {
      await vault.connect(admin).pause();
      await usdc.connect(depositor1).approve(await vault.getAddress(), parseUSDC("100"));
      await expect(vault.connect(depositor1).deposit(parseUSDC("100"))).to.be.reverted;
    });

    it("should pause withdrawals", async function () {
      await usdc.connect(depositor1).approve(await vault.getAddress(), parseUSDC("1000"));
      await vault.connect(depositor1).deposit(parseUSDC("1000"));
      await vault.connect(admin).pause();
      await expect(vault.connect(depositor1).withdraw(parseUSDC("500"))).to.be.reverted;
    });

    it("should unpause and allow operations", async function () {
      await vault.connect(admin).pause();
      await vault.connect(admin).unpause();
      await usdc.connect(depositor1).approve(await vault.getAddress(), parseUSDC("100"));
      await expect(vault.connect(depositor1).deposit(parseUSDC("100"))).to.not.be.reverted;
    });
  });
});
