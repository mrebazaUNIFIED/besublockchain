const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script para crear MÚLTIPLES usuarios desde un archivo JSON
 * 
 * Uso:
 * 1. Crear archivo: user-data/new-users.json
 * 2. Ejecutar: npx hardhat run scripts/user-management/create-multiple-users.js --network besu
 */

async function main() {
  console.log("👥 Creating multiple users from file...\n");

  // Cargar archivo de usuarios a crear
  const newUsersFile = path.join(__dirname, "..", "..", "user-data", "new-users.json");
  
  if (!fs.existsSync(newUsersFile)) {
    console.error("❌ Error: File not found: user-data/new-users.json\n");
    console.log("Create the file with this format:");
    console.log(JSON.stringify([
      {
        userId: "alice_001",
        name: "Alice Johnson",
        organization: "FCI",
        role: "operator",
        initialBalance: 250
      },
      {
        userId: "bob_002",
        name: "Bob Smith",
        organization: "Sunwest",
        role: "operator",
        initialBalance: 300
      }
    ], null, 2));
    process.exit(1);
  }

  const newUsers = JSON.parse(fs.readFileSync(newUsersFile));
  
  if (!Array.isArray(newUsers) || newUsers.length === 0) {
    console.error("❌ Error: new-users.json must contain an array of users");
    process.exit(1);
  }

  console.log(`Found ${newUsers.length} users to create\n`);

  // Cargar deployment y usuarios existentes
  const userDataDir = path.join(__dirname, "..", "..", "user-data");
  const deployment = JSON.parse(fs.readFileSync(path.join(userDataDir, "deployment.json")));
  
  let existingUsers = {};
  const usersFile = path.join(userDataDir, "users.json");
  if (fs.existsSync(usersFile)) {
    existingUsers = JSON.parse(fs.readFileSync(usersFile));
  }

  const [admin, funder] = await hre.ethers.getSigners();
  const userRegistry = await hre.ethers.getContractAt("UserRegistry", deployment.contracts.UserRegistry);
  const usfci = await hre.ethers.getContractAt("USFCI", deployment.contracts.USFCI);

  let successCount = 0;
  let errorCount = 0;

  for (const userData of newUsers) {
    try {
      console.log(`\n👤 Creating user: ${userData.name}`);
      
      // Validar
      if (existingUsers[userData.userId]) {
        console.error(`   ⚠️  Skipping: User ID "${userData.userId}" already exists`);
        errorCount++;
        continue;
      }

      // Generar wallet
      const wallet = hre.ethers.Wallet.createRandom();
      console.log(`   Address: ${wallet.address}`);

      // Financiar
      const fundTx = await funder.sendTransaction({
        to: wallet.address,
        value: hre.ethers.parseEther((userData.initialBalance || 100).toString())
      });
      await fundTx.wait();

      // Registrar en UserRegistry
      const regTx = await userRegistry.registerUser(
        wallet.address,
        userData.userId,
        userData.name,
        userData.organization,
        userData.role || "operator"
      );
      await regTx.wait();

      // Registrar en USFCI
      const walletConnected = new hre.ethers.Wallet(wallet.privateKey, hre.ethers.provider);
      const usfciWithSigner = usfci.connect(walletConnected);
      
      const mspId = userData.organization === "Sunwest" ? "SunwestMSP" : "FCIMSP";
      const accountType = userData.role === "admin" ? "institutional" : "individual";
      
      const usfciRegTx = await usfciWithSigner.registerWallet(mspId, userData.userId, accountType);
      await usfciRegTx.wait();

      // Aprobar KYC
      const kycTx = await usfci.connect(admin).updateComplianceStatus(wallet.address, "approved", "low");
      await kycTx.wait();

      // Guardar
      existingUsers[userData.userId] = {
        userId: userData.userId,
        name: userData.name,
        organization: userData.organization,
        role: userData.role || "operator",
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase,
        initialBalance: userData.initialBalance || 100,
        createdAt: new Date().toISOString()
      };

      console.log(`   ✅ Created successfully`);
      successCount++;

    } catch (error) {
      console.error(`   ❌ Error creating user: ${error.message}`);
      errorCount++;
    }
  }

  // Guardar todos los usuarios
  fs.writeFileSync(usersFile, JSON.stringify(existingUsers, null, 2));

  console.log("\n" + "═".repeat(50));
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Errors: ${errorCount} users`);
  console.log("═".repeat(50));
  console.log("\n📁 All users saved to: user-data/users.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});