# Deployment Configuration Notes

## Current Status

The WeatherWager smart contract has been updated for proper fhEVM deployment to Sepolia testnet.

## Changes Made

### 1. Hardhat Configuration (`hardhat.config.cjs`)
- ✅ Updated to use **mnemonic-based account configuration** (required by @fhevm/hardhat-plugin)
- ✅ Uses standard Ethereum derivation path: `m/44'/60'/0'/0/`
- ✅ Proper Sepolia network configuration with chainId 11155111
- ✅ Optimized compiler settings (800 runs, Cancun EVM)

### 2. Smart Contract (`contracts/WeatherWagerBook.sol`)
- ✅ Now inherits from **SepoliaConfig** (required for fhEVM functionality on Sepolia)
- ✅ All FHE operations properly configured for Sepolia testnet
- ✅ Contract compiles successfully with typings generated

### 3. Environment Configuration (`.env`)
- ✅ Added `.env` to `.gitignore` (security)
- ✅ Added `MNEMONIC` variable requirement
- ✅ Git author configured from `.env` (fobg906468567HeatherWalker)

## ⚠️ Action Required

### Mnemonic Configuration

**The current MNEMONIC in `.env` is a test mnemonic that does NOT match your private key address.**

- **Test mnemonic generates**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (0 ETH balance)
- **Your private key address**: `0xA4CDb88D0547c9905FCFcF3b77A79dEE789BdDf8`

**To deploy, you must:**

1. **Option A**: Update `MNEMONIC` in `.env` with the actual 12-word seed phrase from your wallet (MetaMask/etc) that generates address `0xA4CDb88D0547c9905FCFcF3b77A79dEE789BdDf8`

2. **Option B**: If you don't have the mnemonic, create a new wallet:
   ```bash
   # Install wallet generator if needed
   npm install -g @ethereumjs/wallet

   # Generate new wallet and import to MetaMask
   # Then fund it with Sepolia ETH from faucet
   # Update both MNEMONIC and PRIVATE_KEY in .env
   ```

3. **Get Sepolia Test ETH** from faucets:
   - https://sepoliafaucet.com/
   - https://www.alchemy.com/faucets/ethereum-sepolia
   - https://faucet.quicknode.com/ethereum/sepolia

### Verify Configuration

Run this script to verify your mnemonic matches your intended deployment address:

```bash
node check-account.js
```

You should see:
```
✅ Mnemonic and private key match!
💰 Balance (from mnemonic): X.XX ETH  # Should be > 0.1 ETH
```

## Deployment Commands

Once the mnemonic is correctly configured:

```bash
# 1. Compile contracts (already done)
npm run hardhat:compile

# 2. Deploy to Sepolia
npm run deploy:sepolia

# 3. Export ABI for frontend
npm run export-abi

# 4. Update VITE_CONTRACT_ADDRESS in .env with deployed address
```

## Next Steps

1. ⏳ **Configure correct MNEMONIC in `.env`**
2. ⏳ **Ensure Sepolia ETH balance > 0.1 ETH**
3. ⏳ **Run deployment: `npm run deploy:sepolia`**
4. ⏳ **Export ABI: `npm run export-abi`**
5. ⏳ **Update frontend with contract address**
6. ⏳ **Test with Playwright MCP**
7. ⏳ **Deploy frontend to Vercel**

## Technical Details

### fhEVM Plugin Requirements
- Mnemonic-based account derivation (not direct private key)
- SepoliaConfig inheritance in contracts
- Cancun EVM version for compiler
- Metadata bytecode hash: none

### Gateway Configuration
- Gateway Address (Sepolia): `0x33347831500F1e73f0ccCBb95c9f86B94d7b1123`
- Relayer URL: `https://relayer.testnet.zama.cloud`
- Chain ID: 11155111

## References
- [Zama fhEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)
- [Zama Documentation](https://docs.zama.ai/fhevm)
- [Sepolia Faucets](https://sepoliafaucet.com/)
