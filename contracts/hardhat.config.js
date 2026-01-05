require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
      viaIR: true,
      evmVersion: "paris",
      metadata: {
        bytecodeHash: "none"
      }
    },
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    besu: {
      url: "http://localhost:8545",
      accounts: [
        "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63",  // FCI Deployer
        "0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f"   // FCI Secondary
      ],
      chainId: 12345,
      gas: 20000000,
      gasPrice: 0,
      timeout: 60000
    }
  }
};