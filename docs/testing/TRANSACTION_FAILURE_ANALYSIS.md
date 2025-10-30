# WeatherWager Transaction Failure Analysis

## Problem Summary

Transactions are failing on-chain with "execution reverted" error despite appearing successful in the frontend.

## Root Cause

**Configuration Mismatch** between Frontend SDK and Smart Contract FHE addresses.

### Frontend (SDK)
```json
// @zama-fhe/relayer-sdk@0.2.0 SepoliaConfig
{
  "inputVerifierContractAddress": "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4",
  "aclContractAddress": "0x687820221192C5B662b25367F70076A37bc79b6c",
  "kmsContractAddress": "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC"
}
```

### Contract
```solidity
// @fhevm/solidity@0.8.0 ZamaConfig.getSepoliaConfig()
{
  CoprocessorAddress: 0x848B0066793BcC60346Da1F49049357399B8D595,  // ❌ MISMATCH!
  ACLAddress: 0x687820221192C5B662b25367F70076A37bc79b6c,
  KMSVerifierAddress: 0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC
}
```

## Why It Fails

1. **Frontend encrypts** data using SDK's `inputVerifierContractAddress` (`0xbc91...`)
2. SDK generates **attestation (ZK proof)** for that verifier
3. **Contract expects** attestations for its `CoprocessorAddress` (`0x848...`)
4. `FHE.fromExternal()` **rejects** the attestation → transaction reverts

## Failed Attempt: Custom Frontend Config

Tried updating frontend to use contract's `CoprocessorAddress`:
```typescript
const CUSTOM_SEPOLIA_CONFIG = {
  inputVerifierContractAddress: "0x848B0066793BcC60346Da1F49049357399B8D595"
};
```

**Result**: SDK initialization fails when calling that address:
```
execution reverted (no data present; likely require(false) occurred
transaction={ "data": "0x9164d0ae", "to": "0x848B0066793BcC60346Da1F49049357399B8D595" }
```

The contract exists on Sepolia but doesn't respond correctly to SDK calls.

## Evidence

### Transaction Failure
- Hash: `0xeb6d3dd9008e129ef58b16d0d85e1ae9ddc22d44873ae28bf427d88b70b34d71`
- Gas Used: 32,200 / 5,000,000 (0.64%)
- Status: Fail - execution reverted
- Low gas usage indicates early failure in `FHE.fromExternal()`

### Working Reference: PriceGuess
- Uses same SDK version: `@zama-fhe/relayer-sdk@^0.2.0`
- Uses same Solidity version: `@fhevm/solidity@^0.8.0`
- Works with SDK's built-in `SepoliaConfig`
- **Key difference**: May have been deployed with correct config

## Recommended Solutions

### Option 1: Don't Inherit SepoliaConfig (RECOMMENDED)
Remove `SepoliaConfig` inheritance and manually set FHE config in constructor:

```solidity
contract WeatherWagerBook is AccessControl {
    constructor(address admin, address coprocessorAddress) {
        FHE.setCoprocessor(CoprocessorConfig({
            ACLAddress: 0x687820221192C5B662b25367F70076A37bc79b6c,
            CoprocessorAddress: coprocessorAddress,  // Use SDK's address
            DecryptionOracleAddress: 0xa02Cda4Ca3a71D7C46997716F4283aa851C28812,
            KMSVerifierAddress: 0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC
        }));
    }
}
```

Deploy with SDK's address:
```javascript
const coprocessorAddress = "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4";
await deploy("WeatherWagerBook", [admin, coprocessorAddress]);
```

### Option 2: Patch @fhevm/solidity
Fork and patch `ZamaConfig.sol` to use SDK's addresses.

### Option 3: Wait for SDK Update
Wait for `@zama-fhe/relayer-sdk` to be updated with new addresses.

## Files Modified

- `/src/lib/fhe.ts` - FHE SDK initialization (attempted custom config)
- `/src/hooks/useForecastContract.ts` - Added gas limit handling

## Next Steps

1. ✅ Revert to SDK's built-in `SepoliaConfig` in frontend
2. ⏳ Update contract to NOT use `SepoliaConfig` inheritance
3. ⏳ Redeploy with correct CoprocessorAddress
4. ⏳ Test end-to-end forecast submission
