# WeatherWager ☀️🌧️❄️☁️

A privacy-preserving weather prediction market built with Fully Homomorphic Encryption (FHE) on Ethereum Sepolia testnet.

## 🎯 Overview

WeatherWager allows users to place encrypted bets on future weather conditions. All predictions and stake amounts are encrypted using FHE technology, ensuring complete privacy until market settlement.

### Key Features

- **Fully Encrypted Predictions**: Weather conditions and bet amounts encrypted with FHE
- **Privacy-Preserving**: Your predictions remain private until settlement
- **Fair Settlement**: Verified with official weather data from oracles
- **Trustless Payouts**: Automated payout distribution to winners
- **Multiple Cities**: Bet on weather in major cities worldwide

## 🏗️ Architecture

### Smart Contract (Solidity)

- **WeatherWagerBook.sol**: Main contract managing markets, bets, and settlements
- Uses `@fhevm/solidity` for FHE operations
- Role-based access control for market management
- Gateway integration for decryption

### Frontend (React + TypeScript)

- **Vite**: Build tool with optimized dev experience
- **React 18**: Modern React with hooks
- **Wagmi v2**: Ethereum interactions
- **RainbowKit**: Wallet connection UI
- **shadcn/ui**: Beautiful UI components
- **TailwindCSS**: Utility-first styling

### FHE Integration

- **SDK**: `@zama-fhe/relayer-sdk@0.2.0` via CDN
- **Network**: Sepolia testnet
- **Gateway**: Zama FHE Gateway for decryption
- **Types**: euint8 for conditions, euint64 for stakes

## 📋 Prerequisites

- Node.js >= 18.x
- npm or yarn
- MetaMask or compatible Web3 wallet
- Sepolia ETH (get from [Sepolia Faucet](https://sepoliafaucet.com/))

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd projects/06_WeatherWager
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required for deployment
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=your_private_key_without_0x

# Required for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# Required for frontend (set after deployment)
VITE_CONTRACT_ADDRESS=

# Optional: Get from https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=
```

### 3. Compile Contracts

```bash
npm run hardhat:compile
```

### 4. Deploy to Sepolia

```bash
npm run deploy:sepolia
```

This will:
- Deploy WeatherWagerBook contract
- Create initial city markets
- Output contract address

### 5. Export ABI

```bash
npm run export-abi
```

### 6. Update Environment

Copy the deployed contract address to `.env`:

```env
VITE_CONTRACT_ADDRESS=0x... # your deployed address
```

### 7. Start Frontend

```bash
npm run dev
```

Visit http://localhost:8080

## 📁 Project Structure

```
06_WeatherWager/
├── contracts/
│   └── WeatherWagerBook.sol    # Main smart contract
├── scripts/
│   ├── deploy-sepolia.cjs      # Deployment script
│   └── export-abi.cjs          # ABI export script
├── src/
│   ├── components/
│   │   ├── landing/            # Landing page components
│   │   │   ├── HeroCloud.tsx
│   │   │   ├── CityShowcase.tsx
│   │   │   └── HowItWorks.tsx
│   │   ├── weather/            # Weather DApp components
│   │   │   ├── CitySelector.tsx
│   │   │   └── WeatherTypeSelector.tsx
│   │   └── ui/                 # shadcn/ui components
│   ├── hooks/
│   │   └── useForecastContract.ts  # Contract interaction hooks
│   ├── lib/
│   │   ├── abi/
│   │   │   └── weatherWager.ts # Contract ABI
│   │   ├── config.ts           # App configuration
│   │   ├── fhe.ts              # FHE SDK initialization
│   │   ├── wagmi.ts            # Wagmi configuration
│   │   ├── viem.ts             # Viem clients
│   │   └── weather.ts          # Weather utilities
│   ├── pages/
│   │   ├── Index.tsx           # Landing page
│   │   ├── WeatherDApp.tsx     # Main DApp
│   │   └── WeatherHistory.tsx  # Bet history
│   ├── types/
│   │   └── weather.ts          # TypeScript types
│   └── App.tsx                 # Root component
├── hardhat.config.cjs          # Hardhat configuration
├── vite.config.ts              # Vite configuration
└── package.json                # Dependencies and scripts
```

## 🔧 Development

### Compile Contracts

```bash
npm run hardhat:compile
```

### Clean Build Artifacts

```bash
npm run hardhat:clean
```

### Run Tests

```bash
npm run hardhat:test
```

### Verify Contract on Etherscan

```bash
npm run verify:sepolia -- <CONTRACT_ADDRESS> "<ADMIN_ADDRESS>" "<GATEWAY_ADDRESS>"
```

### Start Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

## 🎮 Usage

### For Users

1. **Connect Wallet**: Click "Connect Wallet" and select your wallet
2. **Select City**: Choose a city to bet on
3. **Choose Weather**: Select predicted weather condition (Sunny/Rainy/Snowy/Cloudy)
4. **Enter Stake**: Input bet amount in ETH (0.001 - 1.0 ETH)
5. **Place Bet**: Confirm transaction to submit encrypted prediction
6. **Wait for Settlement**: Oracle will settle market after lock time
7. **Claim Winnings**: If you win, claim your payout

### For Admins

#### Create City Market

```solidity
contract.createCityMarket(
  cityId,        // Unique city identifier
  4,             // Number of conditions (always 4)
  lockTimestamp  // Unix timestamp when betting closes
);
```

#### Settle Market

```solidity
contract.settleCity(
  cityId,           // City to settle
  winningCondition  // 0=Sunny, 1=Rainy, 2=Snowy, 3=Cloudy
);
```

## 🔐 Security

### FHE Security Model

- **Fail-Closed**: Default to most restrictive behavior on errors
- **ACL Management**: Proper access control for encrypted data
- **Input Validation**: All external inputs validated before processing
- **Commitment Scheme**: Prevents replay attacks

### Smart Contract Security

- **Role-Based Access**: Separate roles for admins, oracles, and gateway
- **Reentrancy Protection**: Checks-effects-interactions pattern
- **Integer Overflow**: Solidity 0.8.24 built-in protection
- **External Calls**: Minimal and well-controlled

## 📊 Testing

### Manual Testing Checklist

- [ ] Connect wallet with MetaMask
- [ ] Switch to Sepolia network
- [ ] Create a new city market (admin only)
- [ ] Place encrypted forecast
- [ ] Verify transaction on Etherscan
- [ ] Check encrypted data is not visible
- [ ] Settle market with oracle (admin only)
- [ ] Claim winnings (if winner)

### Automated Testing (TODO)

```bash
npm run hardhat:test
```

## 🌐 Deployment

### Prerequisites

1. **Sepolia ETH**: Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
2. **Private Key**: Export from MetaMask (Settings > Security & Privacy > Show Private Key)
3. **Etherscan API**: Get from [Etherscan](https://etherscan.io/apis)

### Deployment Steps

1. Configure `.env` with your keys
2. Run `npm run deploy:sepolia`
3. Copy contract address to `.env` as `VITE_CONTRACT_ADDRESS`
4. Run `npm run export-abi`
5. Build frontend with `npm run build`
6. Deploy to Vercel or your hosting provider

## 🐛 Troubleshooting

### FHE SDK Issues

**Error**: `SharedArrayBuffer is not defined`
**Solution**: Ensure COOP/COEP headers are set in `vite.config.ts`

**Error**: `FHE instance not initialized`
**Solution**: Call `initializeFHE()` before using FHE functions

### Contract Issues

**Error**: `Market is locked`
**Solution**: Wait for lock time to pass before placing bets

**Error**: `Commitment already used`
**Solution**: Each bet requires a unique commitment hash

### Wallet Issues

**Error**: `Wrong network`
**Solution**: Switch to Sepolia testnet in MetaMask

**Error**: `Insufficient funds`
**Solution**: Get Sepolia ETH from faucet

## 📚 Resources

- [Zama FHE Documentation](https://docs.zama.ai/fhevm)
- [fhEVM Solidity Docs](https://docs.zama.ai/fhevm/fundamentals)
- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Docs](https://www.rainbowkit.com/)
- [Vite Documentation](https://vitejs.dev/)

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 🙋 Support

- GitHub Issues: [Report bugs](../../issues)
- Discord: [Join community](https://discord.gg/zama)
- Email: support@example.com

---

Built with ❤️ using Zama FHE technology
