const { ethers } = require('ethers');
require('dotenv').config();

// Provider de Besu
const provider = new ethers.JsonRpcProvider(
  process.env.BESU_RPC_URL || 'http://localhost:8545',
  {
    chainId: parseInt(process.env.CHAIN_ID) || 12345,
    name: 'besu-network',
    ensAddress: null
  }
);

// Addresses de contratos
const CONTRACTS = {
  UserRegistry: process.env.USER_REGISTRY_ADDRESS,
  USFCI: process.env.USFCI_ADDRESS,
  LoanRegistry: process.env.LOAN_REGISTRY_ADDRESS,
  ShareLoans: process.env.SHARE_LOANS_ADDRESS,
  Portfolio: process.env.PORTFOLIO_ADDRESS,
  FCICorporate: process.env.FCI_CORPORATE_ADDRESS
};

// ABIs - Cargar desde artifacts
let UserRegistryABI, USFCIABI, LoanRegistryABI, ShareLoansABI, PortfolioABI;

try {
  UserRegistryABI = require('../contracts/UserRegistry.json').abi || require('../contracts/UserRegistry.json');
  USFCIABI = require('../contracts/USFCI.json').abi || require('../contracts/USFCI.json');
  LoanRegistryABI = require('../contracts/LoanRegistry.json').abi || require('../contracts/LoanRegistry.json');
  ShareLoansABI = require('../contracts/ShareLoans.json').abi || require('../contracts/ShareLoans.json');
  PortfolioABI = require('../contracts/Portfolio.json').abi || require('../contracts/Portfolio.json');
} catch (error) {
  console.error('Error loading ABIs:', error.message);
  console.log('Make sure to copy ABI files from contracts/artifacts to api/contracts/');
}

module.exports = {
  provider,
  CONTRACTS,
  ABIs: {
    UserRegistry: UserRegistryABI,
    USFCI: USFCIABI,
    LoanRegistry: LoanRegistryABI,
    ShareLoans: ShareLoansABI,
    Portfolio: PortfolioABI
  }
};