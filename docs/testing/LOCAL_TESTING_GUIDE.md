# WeatherWager Local Testing Guide

## Environment Status

Your local testing environment is ready!

| Component | Status | Location/Port |
|-----------|--------|---------------|
| Hardhat Local Node | Running | localhost:8545 |
| Mock Contract | Deployed | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` |
| Test Markets | Created | New York, London, Tokyo |
| Frontend Server | Running | http://localhost:8081/ |
| ABI | Exported | `/src/lib/abi/weatherWager.ts` |

## Getting Started

### Step 1: Configure MetaMask

1. **Add Local Network to MetaMask**

   Open MetaMask and add a new network with the following settings:

   ```
   Network Name: Localhost 8545
   RPC URL: http://localhost:8545
   Chain ID: 31337
   Currency Symbol: ETH
   ```

2. **Import Test Account**

   Use this test account from Hardhat's default accounts:

   **Account #0 (Deployer Account)**:
   ```
   Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   Balance: 10000 ETH
   ```

   In MetaMask:
   - Click on account icon
   - Select "Import Account"
   - Paste the private key above
   - Click "Import"

3. **Switch to Local Network**
   - Select "Localhost 8545" from the network dropdown in MetaMask

### Step 2: Access the Application

The frontend development server should already be running. If not, run:

```bash
npm run dev
```

Then visit: http://localhost:8081/

### Step 3: Test the Betting Flow

1. **Connect Wallet**
   - Click the "Connect Wallet" button
   - Select MetaMask
   - Confirm the connection request

2. **Select a City**
   - Choose any city (New York, London, or Tokyo)

3. **Make a Weather Prediction**
   - Select a weather condition (Sunny, Rainy, Snowy, or Cloudy)

4. **Enter Bet Amount**
   - Enter a bet amount (e.g., 0.01 ETH)

5. **Submit Prediction**
   - Click "Submit Encrypted Forecast"
   - MetaMask will pop up a transaction confirmation
   - Confirm the transaction

6. **View Results**
   - After successful transaction, you'll see a success message
   - Check the Hardhat node console for transaction logs

## Important Notes

### This is a Test Version

The current deployment uses **WeatherWagerMock** contract for local testing:

- ✅ **Pros**: Complete UI/UX flow testing
- ✅ **Pros**: Fast iteration and debugging
- ✅ **Pros**: No need for real FHE infrastructure
- ⚠️ **Limitations**: Does not use real FHE encryption
- ⚠️ **Limitations**: All predictions default to "Sunny" (fixed value)
- ⚠️ **Limitations**: For development testing only, not for production

### Restarting the Local Environment

If you need to restart the local testing environment:

1. **Stop Hardhat Node**
   ```bash
   # Find and stop the hardhat node process
   ps aux | grep "hardhat node"
   kill <process-id>
   ```

2. **Restart Everything**
   ```bash
   # Start new Hardhat node
   npx hardhat node

   # In another terminal, redeploy contracts
   npx hardhat run scripts/deploy-mock.cjs --network localhost

   # Update contract address in .env
   # Re-export ABI
   npm run export-abi

   # Restart frontend
   npm run dev
   ```

## Troubleshooting

### Q: MetaMask shows "Nonce too high" error

**Solution**: Reset the account's transaction history in MetaMask
1. Click on account icon in MetaMask
2. Settings → Advanced → Clear activity tab data
3. Retry the transaction

### Q: Transaction fails with no error message

**Check**:
1. Confirm MetaMask is connected to Localhost 8545 network
2. Confirm Hardhat node is still running
3. Check Hardhat node console output for error messages

### Q: Frontend cannot connect to contract

**Check**:
1. Is `VITE_CONTRACT_ADDRESS` in `.env` correct?
2. Has the frontend been restarted? (Vite requires restart to read new .env values)
3. Are there any errors in the browser console?

## Test Data

### Available Test Markets

| City ID | City Name | Status |
|---------|-----------|--------|
| 1 | New York | Active |
| 2 | London | Active |
| 3 | Tokyo | Active |

### Test Accounts

Hardhat provides 20 test accounts, each with 10000 ETH.

**Recommended test account**:
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Next Steps

After testing is complete, if you need to deploy the real FHE version to Sepolia:

1. Ensure FHE infrastructure is available on Sepolia
2. Use `WeatherWagerBookFixed.sol` instead of the Mock version
3. Follow the instructions in `DEPLOYMENT_SUMMARY.md`

## Development Tips

### Quick Redeployment

If you modify the contract code:

```bash
# 1. Recompile
npx hardhat compile

# 2. Redeploy (will use new address)
npx hardhat run scripts/deploy-mock.cjs --network localhost

# 3. Update contract address in .env

# 4. Re-export ABI
npm run export-abi

# 5. Restart frontend
# Ctrl+C to stop current npm run dev
npm run dev
```

### View Transaction Details

The Hardhat node will print all transaction information to the console in real-time, including:
- Transaction hash
- Gas usage
- Event logs
- Error messages (if any)

## Need Help?

- Check browser console for error messages
- Check Hardhat node console for logs
- Refer to documentation in `docs/testing/` for more technical details

---

**Happy Testing!** 🎉
