const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Desactiva un usuario
 * 
 * Uso:
 * npx hardhat run scripts/user-management/deactivate-user.js --network besu -- --userId "alice_001"
 */

async function main() {
  const args = process.argv.slice(2);
  const userId = args[args.indexOf("--userId") + 1];

  if (!userId) {
    console.error("❌ Error: Missing --userId argument");
    process.exit(1);
  }

  console.log(`🚫 Deactivating user: ${userId}\n`);

  const userDataDir = path.join(__dirname, "..", "..", "user-data");
  const deployment = JSON.parse(fs.readFileSync(path.join(userDataDir, "deployment.json")));
  const users = JSON.parse(fs.readFileSync(path.join(userDataDir, "users.json")));

  if (!users[userId]) {
    console.error(`❌ Error: User "${userId}" not found`);
    process.exit(1);
  }

  const user = users[userId];
  const [admin] = await hre.ethers.getSigners();
  const userRegistry = await hre.ethers.getContractAt("UserRegistry", deployment.contracts.UserRegistry);

  console.log(`User: ${user.name}`);
  console.log(`Address: ${user.address}\n`);

  const deactivateTx = await userRegistry.deactivateUser(user.address);
  await deactivateTx.wait();

  console.log("✅ User deactivated");
  console.log("\nNote: User data remains in blockchain (immutable)");
  console.log("      but user cannot perform any operations");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});