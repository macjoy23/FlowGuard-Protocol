import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { StealthPayments, IERC20 } from "../typechain-types";

const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const USDC_WHALE = "0xe7804c37c13166fF0b37F5aE0BB07A3aEbb6e245";
const USDC_DECIMALS = 6;

function parseUSDC(amount: string): bigint {
  return ethers.parseUnits(amount, USDC_DECIMALS);
}

describe("StealthPayments", function () {
  let stealth: StealthPayments;
  let usdc: IERC20;
  let admin: SignerWithAddress;
  let sender: SignerWithAddress;
  let claimer: SignerWithAddress;
  let recipient: SignerWithAddress;

  before(async function () {
    [admin, sender, claimer, recipient] = await ethers.getSigners();
    usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);

    const whale = await ethers.getImpersonatedSigner(USDC_WHALE);
    await admin.sendTransaction({ to: USDC_WHALE, value: ethers.parseEther("10") });
    await usdc.connect(whale).transfer(sender.address, parseUSDC("5000"));
  });

  beforeEach(async function () {
    const StealthPayments = await ethers.getContractFactory("StealthPayments");
    stealth = (await upgrades.deployProxy(StealthPayments, [USDC_ADDRESS, admin.address], {
      kind: "uups",
    })) as unknown as StealthPayments;
    await stealth.waitForDeployment();
  });

  describe("Initialization", function () {
    it("should set USDC address", async function () {
      expect(await stealth.usdc()).to.equal(USDC_ADDRESS);
    });

    it("should grant admin role", async function () {
      const ADMIN_ROLE = await stealth.ADMIN_ROLE();
      expect(await stealth.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });
  });

  describe("Send Stealth Payment", function () {
    it("should send a stealth payment", async function () {
      const amount = parseUSDC("500");
      const ephemeralKey = ethers.keccak256(ethers.toUtf8Bytes("ephemeral-key-1"));
      const metadata = ethers.keccak256(ethers.toUtf8Bytes("stealth-meta-1"));

      await usdc.connect(sender).approve(await stealth.getAddress(), amount);
      const tx = await stealth.connect(sender).sendStealthPayment(amount, ephemeralKey, metadata);
      await tx.wait();

      expect(await stealth.getPaymentCount()).to.equal(1);
      expect(await stealth.getTotalStealthVolume()).to.equal(amount);
      expect(await usdc.balanceOf(await stealth.getAddress())).to.equal(amount);
    });

    it("should emit StealthPaymentSent event", async function () {
      const amount = parseUSDC("100");
      const ephemeralKey = ethers.keccak256(ethers.toUtf8Bytes("key-2"));
      const metadata = ethers.keccak256(ethers.toUtf8Bytes("meta-2"));

      await usdc.connect(sender).approve(await stealth.getAddress(), amount);
      await expect(stealth.connect(sender).sendStealthPayment(amount, ephemeralKey, metadata))
        .to.emit(stealth, "StealthPaymentSent");
    });

    it("should revert on zero amount", async function () {
      const ephemeralKey = ethers.keccak256(ethers.toUtf8Bytes("key"));
      const metadata = ethers.keccak256(ethers.toUtf8Bytes("meta"));
      await expect(
        stealth.connect(sender).sendStealthPayment(0, ephemeralKey, metadata)
      ).to.be.revertedWith("Stealth: zero amount");
    });

    it("should revert on zero ephemeral key", async function () {
      await usdc.connect(sender).approve(await stealth.getAddress(), parseUSDC("100"));
      await expect(
        stealth.connect(sender).sendStealthPayment(parseUSDC("100"), ethers.ZeroHash, ethers.ZeroHash)
      ).to.be.revertedWith("Stealth: zero ephemeral key");
    });
  });

  describe("Claim Stealth Payment", function () {
    let paymentId: string;

    beforeEach(async function () {
      const amount = parseUSDC("1000");
      const ephemeralKey = ethers.keccak256(ethers.toUtf8Bytes("claim-key"));
      const metadata = ethers.keccak256(ethers.toUtf8Bytes("claim-meta"));

      await usdc.connect(sender).approve(await stealth.getAddress(), amount);
      const tx = await stealth.connect(sender).sendStealthPayment(amount, ephemeralKey, metadata);
      const receipt = await tx.wait();

      const event = receipt?.logs.find((log) => {
        try {
          return stealth.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "StealthPaymentSent";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = stealth.interface.parseLog({ topics: event.topics as string[], data: event.data });
        paymentId = parsed?.args[0];
      }
    });

    it("should claim a stealth payment with valid signature", async function () {
      const messageHash = ethers.solidityPackedKeccak256(
        ["bytes32", "address", "uint256"],
        [paymentId, recipient.address, 137]
      );
      const signature = await claimer.signMessage(ethers.getBytes(messageHash));

      await stealth.connect(claimer).claimStealthPayment(paymentId, recipient.address, signature);

      const payment = await stealth.getPayment(paymentId);
      expect(payment.claimed).to.be.true;
      expect(await usdc.balanceOf(recipient.address)).to.equal(parseUSDC("1000"));
    });

    it("should revert on double claim", async function () {
      const messageHash = ethers.solidityPackedKeccak256(
        ["bytes32", "address", "uint256"],
        [paymentId, recipient.address, 137]
      );
      const signature = await claimer.signMessage(ethers.getBytes(messageHash));

      await stealth.connect(claimer).claimStealthPayment(paymentId, recipient.address, signature);
      await expect(
        stealth.connect(claimer).claimStealthPayment(paymentId, recipient.address, signature)
      ).to.be.revertedWith("Stealth: already claimed");
    });

    it("should revert with zero recipient", async function () {
      const messageHash = ethers.solidityPackedKeccak256(
        ["bytes32", "address", "uint256"],
        [paymentId, ethers.ZeroAddress, 137]
      );
      const signature = await claimer.signMessage(ethers.getBytes(messageHash));

      await expect(
        stealth.connect(claimer).claimStealthPayment(paymentId, ethers.ZeroAddress, signature)
      ).to.be.revertedWith("Stealth: zero recipient");
    });

    it("should revert with non-existent payment ID", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      const messageHash = ethers.solidityPackedKeccak256(
        ["bytes32", "address", "uint256"],
        [fakeId, recipient.address, 137]
      );
      const signature = await claimer.signMessage(ethers.getBytes(messageHash));

      await expect(
        stealth.connect(claimer).claimStealthPayment(fakeId, recipient.address, signature)
      ).to.be.revertedWith("Stealth: payment not found");
    });
  });

  describe("View Functions", function () {
    it("should return payment IDs with pagination", async function () {
      const ephemeralKey = ethers.keccak256(ethers.toUtf8Bytes("batch-key"));
      const metadata = ethers.keccak256(ethers.toUtf8Bytes("batch-meta"));

      await usdc.connect(sender).approve(await stealth.getAddress(), parseUSDC("300"));
      await stealth.connect(sender).sendStealthPayment(parseUSDC("100"), ephemeralKey, metadata);

      const ephemeralKey2 = ethers.keccak256(ethers.toUtf8Bytes("batch-key-2"));
      await stealth.connect(sender).sendStealthPayment(parseUSDC("200"), ephemeralKey2, metadata);

      const ids = await stealth.getPaymentIds(0, 10);
      expect(ids.length).to.equal(2);
    });
  });
});
