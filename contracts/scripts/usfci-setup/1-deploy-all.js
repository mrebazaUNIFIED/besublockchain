const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying all contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy UserRegistry
  console.log("📝 Deploying UserRegistry...");
  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy(deployer.address);
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log("✅ UserRegistry:", userRegistryAddress);

  // Deploy USFCI
  console.log("\n📝 Deploying USFCI...");
  const USFCI = await hre.ethers.getContractFactory("USFCI");
  const usfci = await USFCI.deploy(deployer.address);
  await usfci.waitForDeployment();
  const usfciAddress = await usfci.getAddress();
  console.log("✅ USFCI:", usfciAddress);

  // Deploy LoanNFT
  console.log("\n📝 Deploying LoanRegistry...");
  const LoanRegistry = await hre.ethers.getContractFactory("LoanRegistry");
  const loanRegistry = await LoanRegistry.deploy(deployer.address);
  await loanRegistry.waitForDeployment();
  const loanRegistryAddress = await loanRegistry.getAddress();
  console.log("✅ LoanRegistry:", loanRegistryAddress);

  console.log("\n📝 Deploying ShareLoans...");
  const ShareLoans = await hre.ethers.getContractFactory("ShareLoans");
  const shareLoans = await ShareLoans.deploy(deployer.address);
  await shareLoans.waitForDeployment();
  const shareLoansAddress = await shareLoans.getAddress();
  console.log("✅ ShareLoans:", shareLoansAddress);

  // Deploy Portfolio
  console.log("\n📝 Deploying Portfolio...");
  const Portfolio = await hre.ethers.getContractFactory("Portfolio");
  const portfolio = await Portfolio.deploy(deployer.address);
  await portfolio.waitForDeployment();
  const portfolioAddress = await portfolio.getAddress();
  console.log("✅ Portfolio:", portfolioAddress);

  // Initialize USFCI
  console.log("\n📝 Initializing USFCI ledger...");
  const initTx = await usfci.initLedger();
  await initTx.wait();
  console.log("✅ Ledger initialized");

  // Save deployment
  const deployment = {
    network: "besu",
    chainId: 12345,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      UserRegistry: userRegistryAddress,
      USFCI: usfciAddress,
      LoanRegistry: loanRegistryAddress, 
      ShareLoans: shareLoansAddress,      
      Portfolio: portfolioAddress
    }
  };

  const userDataDir = path.join(__dirname, "..", "..", "user-data");
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(userDataDir, "deployment.json"),
    JSON.stringify(deployment, null, 2)
  );

  console.log("\n✅ Deployment complete!");
  console.log("Info saved to: user-data/deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});