const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Actualiza nombre o rol de un usuario
 * 
 * Uso:
 * npx hardhat run scripts/user-management/update-user.js --network besu -- \
 *   --userId "alice_001" \
 *   --name "Alice Smith" \
 *   --role "admin"
 */

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag) => {
    const index = args.indexOf(flag);
    return index !== -1 ? args[index + 1] : null;
  };

  const userId = getArg("--userId");
  const newName = getArg("--name");
  const newRole = getArg("--role");

  if (!userId || (!newName && !newRole)) {
    console.error("❌ Error: Missing arguments\n");
    console.log("Usage:");
    console.log('  npx hardhat run scripts/user-management/update-user.js --network besu -- \\');
    console.log('    --userId "alice_001" \\');
    console.log('    --name "Alice Smith" \\');
    console.log('    --role "admin"\n');
    process.exit(1);
  }

  console.log("📝 Updating user...\n");

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

  // Obtener valores actuales si no se especifican nuevos
  const onChainUser = await userRegistry.getUser(user.address);
  const finalName = newName || onChainUser.name;
  const finalRole = newRole || onChainUser.role;

  console.log("Current:");
  console.log(`  Name: ${onChainUser.name}`);
  console.log(`  Role: ${onChainUser.role}`);
  console.log("\nNew:");
  console.log(`  Name: ${finalName}`);
  console.log(`  Role: ${finalRole}\n`);

  // Actualizar en UserRegistry
  console.log("📝 Updating in UserRegistry...");
  const updateTx = await userRegistry.updateUser(user.address, finalName, finalRole);
  await updateTx.wait();
  console.log("✅ Updated");

  // Actualizar archivo local
  users[userId].name = finalName;
  users[userId].role = finalRole;
  users[userId].updatedAt = new Date().toISOString();

  fs.writeFileSync(
    path.join(userDataDir, "users.json"),
    JSON.stringify(users, null, 2)
  );

  console.log("\n✅ User updated successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});