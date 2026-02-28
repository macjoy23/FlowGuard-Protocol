import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ComplianceRegistry } from "../typechain-types";

describe("ComplianceRegistry", function () {
  let registry: ComplianceRegistry;
  let admin: SignerWithAddress;
  let officer: SignerWithAddress;
  let entity: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  beforeEach(async function () {
    [admin, officer, entity, unauthorized] = await ethers.getSigners();

    const ComplianceRegistry = await ethers.getContractFactory("ComplianceRegistry");
    registry = (await upgrades.deployProxy(ComplianceRegistry, [admin.address], {
      kind: "uups",
    })) as unknown as ComplianceRegistry;
    await registry.waitForDeployment();

    const COMPLIANCE_OFFICER_ROLE = await registry.COMPLIANCE_OFFICER_ROLE();
    await registry.connect(admin).grantRole(COMPLIANCE_OFFICER_ROLE, officer.address);
  });

  describe("Initialization", function () {
    it("should grant admin roles", async function () {
      const ADMIN_ROLE = await registry.ADMIN_ROLE();
      expect(await registry.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("should grant compliance officer role to admin", async function () {
      const COMPLIANCE_OFFICER_ROLE = await registry.COMPLIANCE_OFFICER_ROLE();
      expect(await registry.hasRole(COMPLIANCE_OFFICER_ROLE, admin.address)).to.be.true;
    });

    it("should revert on zero admin", async function () {
      const ComplianceRegistry = await ethers.getContractFactory("ComplianceRegistry");
      await expect(
        upgrades.deployProxy(ComplianceRegistry, [ethers.ZeroAddress], { kind: "uups" })
      ).to.be.revertedWith("Compliance: zero admin");
    });
  });

  describe("Document Registration", function () {
    it("should register a document", async function () {
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("tax-doc-2026"));
      const ipfsCid = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";

      await registry.connect(officer).registerDocument(docHash, ipfsCid);

      const doc = await registry.getDocument(docHash);
      expect(doc.ipfsCid).to.equal(ipfsCid);
      expect(doc.registeredBy).to.equal(officer.address);
      expect(doc.verified).to.be.false;
      expect(await registry.getTotalDocuments()).to.equal(1);
    });

    it("should emit DocumentRegistered event", async function () {
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("doc-event"));
      const ipfsCid = "QmTestCid123";

      await expect(registry.connect(officer).registerDocument(docHash, ipfsCid))
        .to.emit(registry, "DocumentRegistered");
    });

    it("should revert on zero hash", async function () {
      await expect(
        registry.connect(officer).registerDocument(ethers.ZeroHash, "QmTest")
      ).to.be.revertedWith("Compliance: zero hash");
    });

    it("should revert on empty CID", async function () {
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("empty-cid"));
      await expect(
        registry.connect(officer).registerDocument(docHash, "")
      ).to.be.revertedWith("Compliance: empty CID");
    });

    it("should revert on duplicate registration", async function () {
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("dupe-doc"));
      await registry.connect(officer).registerDocument(docHash, "QmDupe");
      await expect(
        registry.connect(officer).registerDocument(docHash, "QmDupe2")
      ).to.be.revertedWith("Compliance: already registered");
    });

    it("should revert when unauthorized user registers", async function () {
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("unauth"));
      await expect(
        registry.connect(unauthorized).registerDocument(docHash, "QmUnauth")
      ).to.be.reverted;
    });
  });

  describe("Document Verification", function () {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("verify-doc"));

    beforeEach(async function () {
      await registry.connect(officer).registerDocument(docHash, "QmVerify");
    });

    it("should verify a document", async function () {
      await registry.connect(officer).verifyDocument(docHash);
      const doc = await registry.getDocument(docHash);
      expect(doc.verified).to.be.true;
      expect(await registry.getVerifiedDocuments()).to.equal(1);
    });

    it("should emit DocumentVerified event", async function () {
      await expect(registry.connect(officer).verifyDocument(docHash))
        .to.emit(registry, "DocumentVerified");
    });

    it("should revert on non-existent document", async function () {
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("nonexistent"));
      await expect(
        registry.connect(officer).verifyDocument(fakeHash)
      ).to.be.revertedWith("Compliance: not registered");
    });

    it("should revert on double verification", async function () {
      await registry.connect(officer).verifyDocument(docHash);
      await expect(
        registry.connect(officer).verifyDocument(docHash)
      ).to.be.revertedWith("Compliance: already verified");
    });
  });

  describe("Entity Verification", function () {
    it("should set entity verification to true", async function () {
      await registry.connect(officer).setEntityVerification(entity.address, true);
      expect(await registry.isEntityVerified(entity.address)).to.be.true;
    });

    it("should set entity verification to false", async function () {
      await registry.connect(officer).setEntityVerification(entity.address, true);
      await registry.connect(officer).setEntityVerification(entity.address, false);
      expect(await registry.isEntityVerified(entity.address)).to.be.false;
    });

    it("should emit EntityVerificationUpdated event", async function () {
      await expect(registry.connect(officer).setEntityVerification(entity.address, true))
        .to.emit(registry, "EntityVerificationUpdated");
    });

    it("should revert on zero entity address", async function () {
      await expect(
        registry.connect(officer).setEntityVerification(ethers.ZeroAddress, true)
      ).to.be.revertedWith("Compliance: zero entity");
    });

    it("should return full entity status", async function () {
      await registry.connect(officer).setEntityVerification(entity.address, true);
      const status = await registry.getEntityStatus(entity.address);
      expect(status.isVerified).to.be.true;
      expect(status.verifiedBy).to.equal(officer.address);
    });
  });

  describe("Entity Documents", function () {
    it("should track documents per entity", async function () {
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("entity-doc-1"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("entity-doc-2"));

      await registry.connect(officer).registerDocument(hash1, "QmDoc1");
      await registry.connect(officer).registerDocument(hash2, "QmDoc2");

      const docs = await registry.getEntityDocuments(officer.address);
      expect(docs.length).to.equal(2);
    });
  });

  describe("Pagination", function () {
    it("should paginate document hashes", async function () {
      for (let i = 0; i < 5; i++) {
        const hash = ethers.keccak256(ethers.toUtf8Bytes(`page-doc-${i}`));
        await registry.connect(officer).registerDocument(hash, `QmPage${i}`);
      }

      const page1 = await registry.getDocumentHashes(0, 3);
      expect(page1.length).to.equal(3);

      const page2 = await registry.getDocumentHashes(3, 3);
      expect(page2.length).to.equal(2);
    });
  });
});
