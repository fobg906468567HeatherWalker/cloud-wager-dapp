/**
 * Hardhat Configuration for WeatherWager
 *
 * This configuration enables FHE contract development and deployment
 * to Sepolia testnet with proper fhEVM plugin support
 */

require("@nomicfoundation/hardhat-toolbox");
// require("@fhevm/hardhat-plugin"); // Temporarily disabled for deployment
require("dotenv/config");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      metadata: {
        bytecodeHash: "none",
      },
      optimizer: {
        enabled: true,
        runs: 800,
      },
      evmVersion: "cancun",
    },
  },

  networks: {
    sepolia: {
      // Use PRIVATE_KEY if available, otherwise fall back to MNEMONIC
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : {
            mnemonic: process.env.MNEMONIC || "test test test test test test test test test test test junk",
            path: "m/44'/60'/0'/0/",
            count: 10,
          },
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
    },
    hardhat: {
      accounts: process.env.PRIVATE_KEY
        ? {
            accountsBalance: "10000000000000000000000", // 10000 ETH
            accounts: [{
              privateKey: process.env.PRIVATE_KEY,
              balance: "10000000000000000000000"
            }]
          }
        : {
            mnemonic: process.env.MNEMONIC || "test test test test test test test test test test test junk",
          },
      chainId: 31337,
    },
  },

  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
    },
  },

  fhEVM: {
    gatewayUrl: process.env.FHE_GATEWAY_URL || "https://gateway.fhenet.io",
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
