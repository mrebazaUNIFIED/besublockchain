const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("👥 Creating 3 users...\n");

  const [funder] = await hre.ethers.getSigners();

  const usersToCreate = [
    { userId: "sunwest_001", name: "Sunwest", organization: "Sunwest", role: "admin", initialBalance: 1000 },
    { userId: "mike_001", name: "Mike", organization: "FCI", role: "operator", initialBalance: 500 },
    { userId: "fci_corporate", name: "FCI Corporate Account", organization: "FCI", role: "operator", initialBalance: 500 }
  ];

  const createdUsers = {};

  for (const userData of usersToCreate) {
    console.log(`\n🔐 Creating user: ${userData.name}`);
    
    const wallet = hre.ethers.Wallet.createRandom();
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Private Key: ${wallet.privateKey}`);

    console.log(`   💸 Funding with ${userData.initialBalance} ETH...`);
    const tx = await funder.sendTransaction({
      to: wallet.address,
      value: hre.ethers.parseEther(userData.initialBalance.toString())
    });
    await tx.wait();
    console.log(`   ✅ Funded`);

    createdUsers[userData.userId] = {
      userId: userData.userId,
      name: userData.name,
      organization: userData.organization,
      role: userData.role,
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic.phrase,
      initialBalance: userData.initialBalance,
      createdAt: new Date().toISOString()
    };
  }

  const userDataDir = path.join(__dirname, "..", "..", "user-data");
  fs.writeFileSync(
    path.join(userDataDir, "users.json"),
    JSON.stringify(createdUsers, null, 2)
  );

  fs.writeFileSync(
    path.join(userDataDir, ".gitignore"),
    "# NO commitear private keys\nusers.json\n*.json\n!deployment.json\n"
  );

  console.log("\n✅ All users created!");
  console.log("📁 Saved to: user-data/users.json");
  console.log("⚠️  IMPORTANT: Backup users.json securely!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});