const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script para crear UN usuario nuevo
 * 
 * Uso:
 * npx hardhat run scripts/user-management/create-single-user.js --network besu -- \
 *   --userId "alice_001" \
 *   --name "Alice Johnson" \
 *   --organization "FCI" \
 *   --role "operator" \
 *   --balance 250
 */

async function main() {
  // Parsear argumentos
  const args = process.argv.slice(2);
  const getArg = (flag) => {
    const index = args.indexOf(flag);
    return index !== -1 ? args[index + 1] : null;
  };

  const userId = getArg("--userId");
  const name = getArg("--name");
  const organization = getArg("--organization");
  const role = getArg("--role") || "operator";
  const balance = parseFloat(getArg("--balance") || "100");

  // Validaciones
  if (!userId || !name || !organization) {
    console.error("❌ Error: Missing required arguments\n");
    console.log("Usage:");
    console.log('  npx hardhat run scripts/user-management/create-single-user.js --network besu -- \\');
    console.log('    --userId "alice_001" \\');
    console.log('    --name "Alice Johnson" \\');
    console.log('    --organization "FCI" \\');
    console.log('    --role "operator" \\');
    console.log('    --balance 250\n');
    process.exit(1);
  }

  console.log("👤 Creating new user...\n");
  console.log("User Details:");
  console.log("  User ID:", userId);
  console.log("  Name:", name);
  console.log("  Organization:", organization);
  console.log("  Role:", role);
  console.log("  Initial Balance:", balance, "ETH\n");

  // Cargar deployment y usuarios existentes
  const userDataDir = path.join(__dirname, "..", "..", "user-data");
  const deployment = JSON.parse(fs.readFileSync(path.join(userDataDir, "deployment.json")));
  
  let existingUsers = {};
  const usersFile = path.join(userDataDir, "users.json");
  if (fs.existsSync(usersFile)) {
    existingUsers = JSON.parse(fs.readFileSync(usersFile));
  }

  // Verificar que userId no existe
  if (existingUsers[userId]) {
    console.error(`❌ Error: User ID "${userId}" already exists!`);
    process.exit(1);
  }

  const [admin, funder] = await hre.ethers.getSigners();

  // 1. Generar wallet
  console.log("🔐 Generating wallet...");
  const wallet = hre.ethers.Wallet.createRandom();
  console.log(`   Address: ${wallet.address}`);

  // 2. Financiar wallet
  console.log(`💸 Funding wallet with ${balance} ETH...`);
  const fundTx = await funder.sendTransaction({
    to: wallet.address,
    value: hre.ethers.parseEther(balance.toString())
  });
  await fundTx.wait();
  console.log("✅ Funded");

  // 3. Registrar en UserRegistry
  console.log("📝 Registering in UserRegistry...");
  const userRegistry = await hre.ethers.getContractAt("UserRegistry", deployment.contracts.UserRegistry);
  const regTx = await userRegistry.registerUser(wallet.address, userId, name, organization, role);
  await regTx.wait();
  console.log("✅ Registered in UserRegistry");

  // 4. Registrar en USFCI
  console.log("📝 Registering in USFCI...");
  const usfci = await hre.ethers.getContractAt("USFCI", deployment.contracts.USFCI);
  const walletConnected = new hre.ethers.Wallet(wallet.privateKey, hre.ethers.provider);
  const usfciWithSigner = usfci.connect(walletConnected);
  
  const mspId = organization === "Sunwest" ? "SunwestMSP" : "FCIMSP";
  const accountType = role === "admin" ? "institutional" : "individual";
  
  const usfciRegTx = await usfciWithSigner.registerWallet(mspId, userId, accountType);
  await usfciRegTx.wait();
  console.log("✅ Registered in USFCI");

  // 5. Aprobar KYC
  console.log("✅ Approving KYC...");
  const kycTx = await usfci.connect(admin).updateComplianceStatus(wallet.address, "approved", "low");
  await kycTx.wait();
  console.log("✅ KYC approved");

  // 6. Si es admin de Sunwest, dar roles especiales
  if (role === "admin" && organization === "Sunwest") {
    console.log("🔑 Granting admin roles...");
    
    const MINTER_ROLE = await usfci.MINTER_ROLE();
    const BURNER_ROLE = await usfci.BURNER_ROLE();
    const COMPLIANCE_ROLE = await usfci.COMPLIANCE_ROLE();
    
    await (await usfci.grantRole(MINTER_ROLE, wallet.address)).wait();
    await (await usfci.grantRole(BURNER_ROLE, wallet.address)).wait();
    await (await usfci.grantRole(COMPLIANCE_ROLE, wallet.address)).wait();
    
    console.log("✅ Admin roles granted");
  }

  // 7. Guardar usuario
  existingUsers[userId] = {
    userId: userId,
    name: name,
    organization: organization,
    role: role,
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
    initialBalance: balance,
    createdAt: new Date().toISOString()
  };

  fs.writeFileSync(usersFile, JSON.stringify(existingUsers, null, 2));

  console.log("\n✅ User created successfully!");
  console.log("\n📋 User Summary:");
  console.log("  User ID:", userId);
  console.log("  Name:", name);
  console.log("  Address:", wallet.address);
  console.log("  Organization:", organization);
  console.log("  Role:", role);
  console.log("\n⚠️  IMPORTANT: Private key saved in user-data/users.json");
  console.log("   Backup this file securely!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});