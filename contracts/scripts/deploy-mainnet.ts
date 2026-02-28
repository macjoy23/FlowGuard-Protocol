import { ethers, upgrades, run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const AAVE_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("=".repeat(60));
  console.log("FlowGuard Protocol — Mainnet Deployment");
  console.log("=".repeat(60));
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} MATIC`);
  console.log(`Network: Polygon Mainnet (chainId 137)`);
  console.log(`USDC: ${USDC_ADDRESS}`);
  console.log(`Aave V3 Pool: ${AAVE_POOL}`);
  console.log("=".repeat(60));

  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 137n) {
    throw new Error(`Wrong network. Expected chainId 137, got ${network.chainId}`);
  }

  if (balance < ethers.parseEther("1")) {
    console.warn("WARNING: Low MATIC balance. Ensure sufficient gas funds.");
  }

  // 1. Deploy ComplianceRegistry
  console.log("\n[1/5] Deploying ComplianceRegistry...");
  const ComplianceRegistry = await ethers.getContractFactory("ComplianceRegistry");
  const compliance = await upgrades.deployProxy(
    ComplianceRegistry,
    [deployer.address],
    { kind: "uups", timeout: 120000 }
  );
  await compliance.waitForDeployment();
  const complianceAddr = await compliance.getAddress();
  console.log(`ComplianceRegistry deployed: ${complianceAddr}`);

  // 2. Deploy FlowGuardCore
  console.log("\n[2/5] Deploying FlowGuardCore...");
  const FlowGuardCore = await ethers.getContractFactory("FlowGuardCore");
  const core = await upgrades.deployProxy(
    FlowGuardCore,
    [USDC_ADDRESS, deployer.address],
    { kind: "uups", timeout: 120000 }
  );
  await core.waitForDeployment();
  const coreAddr = await core.getAddress();
  console.log(`FlowGuardCore deployed: ${coreAddr}`);

  // 3. Deploy StealthPayments
  console.log("\n[3/5] Deploying StealthPayments...");
  const StealthPayments = await ethers.getContractFactory("StealthPayments");
  const stealth = await upgrades.deployProxy(
    StealthPayments,
    [USDC_ADDRESS, deployer.address],
    { kind: "uups", timeout: 120000 }
  );
  await stealth.waitForDeployment();
  const stealthAddr = await stealth.getAddress();
  console.log(`StealthPayments deployed: ${stealthAddr}`);

  // 4. Deploy YieldVault
  console.log("\n[4/5] Deploying YieldVault...");
  const YieldVault = await ethers.getContractFactory("YieldVault");
  const vault = await upgrades.deployProxy(
    YieldVault,
    [USDC_ADDRESS, AAVE_POOL, deployer.address],
    { kind: "uups", timeout: 120000 }
  );
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log(`YieldVault deployed: ${vaultAddr}`);

  // 5. Deploy AgentPayGateway
  console.log("\n[5/5] Deploying AgentPayGateway...");
  const AgentPayGateway = await ethers.getContractFactory("AgentPayGateway");
  const gateway = await upgrades.deployProxy(
    AgentPayGateway,
    [USDC_ADDRESS, coreAddr, deployer.address],
    { kind: "uups", timeout: 120000 }
  );
  await gateway.waitForDeployment();
  const gatewayAddr = await gateway.getAddress();
  console.log(`AgentPayGateway deployed: ${gatewayAddr}`);

  // Get implementation addresses
  const complianceImpl = await upgrades.erc1967.getImplementationAddress(complianceAddr);
  const coreImpl = await upgrades.erc1967.getImplementationAddress(coreAddr);
  const stealthImpl = await upgrades.erc1967.getImplementationAddress(stealthAddr);
  const vaultImpl = await upgrades.erc1967.getImplementationAddress(vaultAddr);
  const gatewayImpl = await upgrades.erc1967.getImplementationAddress(gatewayAddr);

  // Verify contracts
  console.log("\nVerifying contracts on PolygonScan...");
  const implementations = [
    { name: "ComplianceRegistry", address: complianceImpl },
    { name: "FlowGuardCore", address: coreImpl },
    { name: "StealthPayments", address: stealthImpl },
    { name: "YieldVault", address: vaultImpl },
    { name: "AgentPayGateway", address: gatewayImpl },
  ];

  for (const impl of implementations) {
    try {
      await run("verify:verify", { address: impl.address, constructorArguments: [] });
      console.log(`Verified ${impl.name}: ${impl.address}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Already Verified")) {
        console.log(`${impl.name} already verified`);
      } else {
        console.error(`Failed to verify ${impl.name}: ${message}`);
      }
    }
  }

  // Save deployment addresses
  const deployment = {
    network: "polygon",
    chainId: 137,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    usdc: USDC_ADDRESS,
    aavePool: AAVE_POOL,
    contracts: {
      ComplianceRegistry: {
        proxy: complianceAddr,
        implementation: complianceImpl,
      },
      FlowGuardCore: {
        proxy: coreAddr,
        implementation: coreImpl,
      },
      StealthPayments: {
        proxy: stealthAddr,
        implementation: stealthImpl,
      },
      YieldVault: {
        proxy: vaultAddr,
        implementation: vaultImpl,
      },
      AgentPayGateway: {
        proxy: gatewayAddr,
        implementation: gatewayImpl,
      },
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(deploymentsDir, "polygon-mainnet.json"),
    JSON.stringify(deployment, null, 2)
  );

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log(JSON.stringify(deployment, null, 2));
  console.log("\nDeployment saved to: deployments/polygon-mainnet.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
