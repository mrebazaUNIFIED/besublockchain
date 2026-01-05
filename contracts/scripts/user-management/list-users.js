const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Lista todos los usuarios registrados
 */

async function main() {
  console.log("📋 Listing all users...\n");

  const userDataDir = path.join(__dirname, "..", "..", "user-data");
  const deployment = JSON.parse(fs.readFileSync(path.join(userDataDir, "deployment.json")));
  
  const usersFile = path.join(userDataDir, "users.json");
  if (!fs.existsSync(usersFile)) {
    console.log("No users found.");
    return;
  }

  const users = JSON.parse(fs.readFileSync(usersFile));
  const userRegistry = await hre.ethers.getContractAt("UserRegistry", deployment.contracts.UserRegistry);
  const usfci = await hre.ethers.getContractAt("USFCI", deployment.contracts.USFCI);

  console.log("═".repeat(80));
  console.log(`Total Users: ${Object.keys(users).length}`);
  console.log("═".repeat(80));

  for (const [key, user] of Object.entries(users)) {
    try {
      const onChainUser = await userRegistry.getUser(user.address);
      const account = await usfci.getAccountDetails(user.address);
      const balance = await usfci.getBalance(user.address);
      const ethBalance = await hre.ethers.provider.getBalance(user.address);

      console.log(`\n👤 ${user.name} (${user.userId})`);
      console.log("─".repeat(80));
      console.log(`   Organization: ${onChainUser.organization}`);
      console.log(`   Role: ${onChainUser.role}`);
      console.log(`   Address: ${user.address}`);
      console.log(`   Status: ${onChainUser.isActive ? "✅ Active" : "❌ Inactive"}`);
      console.log(`   ETH Balance: ${hre.ethers.formatEther(ethBalance)} ETH`);
      console.log(`   USFCI Balance: ${hre.ethers.formatEther(balance)} USFCI`);
      console.log(`   KYC Status: ${account.kycStatus}`);
      console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);

    } catch (error) {
      console.log(`\n👤 ${user.name} (${user.userId})`);
      console.log("   ⚠️  Error fetching data:", error.message);
    }
  }

  console.log("\n" + "═".repeat(80));

  // Estadísticas por organización
  const byOrg = {};
  for (const user of Object.values(users)) {
    byOrg[user.organization] = (byOrg[user.organization] || 0) + 1;
  }

  console.log("\n📊 Users by Organization:");
  for (const [org, count] of Object.entries(byOrg)) {
    console.log(`   ${org}: ${count} users`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});