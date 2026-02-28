import { ethers } from "hardhat";

/**
 * Grant PAYER_ROLE and ADMIN_ROLE on FlowGuardCore to a given address.
 *
 * Usage:
 *   GRANT_TO=0xYourMetaMaskAddress npx hardhat run scripts/grant-roles.ts --network polygon
 *
 * The deployer (DEPLOYER_PRIVATE_KEY in .env) must be the current DEFAULT_ADMIN.
 */
async function main() {
  const targetAddress = process.env.GRANT_TO;
  if (!targetAddress) {
    throw new Error("Set GRANT_TO=0x... with the wallet address to grant roles to");
  }

  const FLOWGUARD_CORE = "0x14fE638867383b162B8C08B97Dd7eBE15a9819BE";

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer (admin): ${deployer.address}`);
  console.log(`Granting roles to: ${targetAddress}`);

  const core = await ethers.getContractAt("FlowGuardCore", FLOWGUARD_CORE);

  const PAYER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAYER_ROLE"));
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));

  const hasPayer = await core.hasRole(PAYER_ROLE, targetAddress);
  const hasAdmin = await core.hasRole(ADMIN_ROLE, targetAddress);

  if (hasPayer && hasAdmin) {
    console.log("Address already has both PAYER_ROLE and ADMIN_ROLE. Nothing to do.");
    return;
  }

  if (!hasPayer) {
    console.log("Granting PAYER_ROLE...");
    const tx1 = await core.grantRole(PAYER_ROLE, targetAddress);
    await tx1.wait();
    console.log(`PAYER_ROLE granted (tx: ${tx1.hash})`);
  } else {
    console.log("PAYER_ROLE already assigned.");
  }

  if (!hasAdmin) {
    console.log("Granting ADMIN_ROLE...");
    const tx2 = await core.grantRole(ADMIN_ROLE, targetAddress);
    await tx2.wait();
    console.log(`ADMIN_ROLE granted (tx: ${tx2.hash})`);
  } else {
    console.log("ADMIN_ROLE already assigned.");
  }

  console.log("\nDone! The address can now execute payroll and manage recipients.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
