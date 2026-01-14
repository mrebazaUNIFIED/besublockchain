const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("⚙️  Setting up users in contracts...\n");

  const deployment = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "user-data", "deployment.json")));
  const users = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "user-data", "users.json")));

  const [admin] = await hre.ethers.getSigners();
  const userRegistry = await hre.ethers.getContractAt("UserRegistry", deployment.contracts.UserRegistry);
  const usfci = await hre.ethers.getContractAt("USFCI", deployment.contracts.USFCI);

  let sunwestWallet; // Para usar después en minting

  for (const [key, user] of Object.entries(users)) {
    console.log(`\n👤 Setting up: ${user.name}`);

    console.log("   📝 Registering in UserRegistry...");
    const regTx = await userRegistry.registerUser(user.address, user.userId, user.name, user.organization, user.role);
    await regTx.wait();
    console.log("   ✅ Registered");

    console.log("   📝 Registering in USFCI...");
    const wallet = new hre.ethers.Wallet(user.privateKey, hre.ethers.provider);
    const usfciWithSigner = usfci.connect(wallet);
    
    const mspId = user.organization === "Sunwest" ? "SunwestMSP" : "FCIMSP";
    const accountType = user.role === "admin" ? "institutional" : "individual";
    
    const usfciRegTx = await usfciWithSigner.registerWallet(mspId, user.userId, accountType);
    await usfciRegTx.wait();
    console.log("   ✅ Registered in USFCI");

    console.log("   ✅ Approving KYC...");
    const kycTx = await usfci.connect(admin).updateComplianceStatus(user.address, "approved", "low");
    await kycTx.wait();
    console.log("   ✅ KYC approved");

    if (user.userId === "a1b2c3d4-e5f6-4789-1011-121314151617") {
      console.log("   🔑 Granting special roles to Sunwest...");
      
      const MINTER_ROLE = await usfci.MINTER_ROLE();
      const BURNER_ROLE = await usfci.BURNER_ROLE();
      const COMPLIANCE_ROLE = await usfci.COMPLIANCE_ROLE();
      
      await (await usfci.grantRole(MINTER_ROLE, user.address)).wait();
      await (await usfci.grantRole(BURNER_ROLE, user.address)).wait();
      await (await usfci.grantRole(COMPLIANCE_ROLE, user.address)).wait();
      
      console.log("   ✅ Roles granted");

      sunwestWallet = wallet; // Guardar para minting
    }
  }

  // Minting tokens después de setup
  console.log("\n💰 Minting initial USFCI tokens...");
  const usfciWithMinter = usfci.connect(sunwestWallet);
  const reserveProof = "initial_reserve_proof_2026"; // Prueba de reserva de ejemplo (ajusta si necesitas real)

  for (const [key, user] of Object.entries(users)) {
    const mintAmount = hre.ethers.parseUnits("10000", 18); // 10,000 USFCI por usuario (ajusta según decimals y necesidades)
    console.log(`   Minting ${hre.ethers.formatUnits(mintAmount, 18)} USFCI to ${user.name}...`);
    const mintTx = await usfciWithMinter.mintTokens(user.address, mintAmount, reserveProof);
    await mintTx.wait();
    console.log(`   ✅ Minted to ${user.address}`);
  }

  console.log("\n✅ All users setup and tokens minted!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});