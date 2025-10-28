/**
 * Hardhat Configuration for WeatherWager
 *
 * This configuration enables FHE contract development and deployment
 * to Sepolia testnet with proper fhEVM plugin support
 */

require("@nomicfoundation/hardhat-toolbox");
require("@fhevm/hardhat-plugin");
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
      accounts: {
        mnemonic: process.env.MNEMONIC || "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0/",
        count: 10,
      },
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
    },
    hardhat: {
      accounts: {
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

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
