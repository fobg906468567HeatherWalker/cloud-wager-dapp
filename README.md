# WeatherWager ☀️🌧️❄️☁️

A privacy-preserving weather prediction market built with Fully Homomorphic Encryption (FHE) on Ethereum.

🚀 **[Live Demo on Vercel](https://weather-wager-dapp.vercel.app)** | 📺 [Video Demo](#) | 📖 [Documentation](#-documentation)

## 🎯 Overview

WeatherWager allows users to place encrypted bets on future weather conditions. All predictions and stake amounts are encrypted using FHE technology, ensuring complete privacy until market settlement.

### Key Features

- **Fully Encrypted Predictions**: Weather conditions and bet amounts encrypted with FHE
- **Privacy-Preserving**: Your predictions remain private until settlement
- **Fair Settlement**: Verified with official weather data from oracles
- **Trustless Payouts**: Automated payout distribution to winners
- **Multiple Cities**: Bet on weather in major cities worldwide

## 🏗️ Architecture

### Smart Contracts (Solidity)

- **WeatherWagerBookFixed.sol**: Production contract with SDK-compatible FHE configuration
- **WeatherWagerMock.sol**: Local testing contract without FHE (for development)
- Uses `@fhevm/solidity` for FHE operations
- Role-based access control for market management
- Gateway integration for decryption

### Frontend (React + TypeScript)

- **Vite**: Build tool with optimized dev experience
- **React 18**: Modern React with hooks
- **Wagmi v2**: Ethereum interactions with Sepolia and Hardhat network support
- **RainbowKit**: Wallet connection UI (MetaMask, Rainbow, WalletConnect)
- **shadcn/ui**: Beautiful UI components
- **TailwindCSS**: Utility-first styling

### FHE Integration

- **SDK**: `@zama-fhe/relayer-sdk@0.2.0` via CDN
- **Networks**: Sepolia testnet (production) & Hardhat local (development)
- **Gateway**: Zama FHE Gateway for decryption
- **Types**: euint8 for conditions, euint64 for stakes

## 📋 Prerequisites

- Node.js >= 18.x
- npm or yarn
- MetaMask or compatible Web3 wallet
- Sepolia ETH (get from [Sepolia Faucet](https://sepoliafaucet.com/)) for testnet deployment
- OR Local Hardhat network for development

## 🚀 Quick Start

### Option 1: Local Development Environment (Recommended for Testing)

Perfect for rapid development and testing without needing Sepolia ETH.

1. **Clone and Install**

```bash
git clone <repository-url>
cd projects/06_WeatherWager
npm install
```

2. **Start Hardhat Node**

```bash
npx hardhat node
```

Keep this terminal running.

3. **Deploy Mock Contract (in another terminal)**

```bash
npx hardhat run scripts/deploy-mock.cjs --network localhost
```

4. **Export ABI**

```bash
npm run export-abi
```

5. **Configure MetaMask**

See [Local Testing Guide](docs/testing/LOCAL_TESTING_GUIDE.md) for detailed MetaMask setup.

6. **Start Frontend**

```bash
npm run dev
```

Visit http://localhost:8081

**📖 Full Instructions**: See [docs/testing/LOCAL_TESTING_GUIDE.md](docs/testing/LOCAL_TESTING_GUIDE.md)

### Option 2: Sepolia Testnet Deployment

For production-like testing with real FHE encryption.

1. **Configure Environment**

```bash
cp .env.example .env
```

Edit `.env`:

```env
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=your_private_key_without_0x
VITE_CONTRACT_ADDRESS=  # Set after deployment
```

2. **Compile Contracts**

```bash
npx hardhat compile
```

3. **Deploy to Sepolia**

```bash
npx hardhat run scripts/deploy-sepolia.cjs --network sepolia
```

4. **Update Environment & Export ABI**

Copy the deployed contract address to `.env` as `VITE_CONTRACT_ADDRESS`, then:

```bash
npm run export-abi
npm run dev
```

**📖 Full Instructions**: See [QUICK_START.md](QUICK_START.md)

## 📁 Project Structure

```
06_WeatherWager/
├── contracts/
│   ├── WeatherWagerBookFixed.sol  # Production contract (FHE)
│   └── WeatherWagerMock.sol       # Local testing contract (no FHE)
├── scripts/
│   ├── deploy-sepolia.cjs         # Sepolia deployment
│   ├── deploy-local.cjs           # Local FHE deployment
│   ├── deploy-mock.cjs            # Local mock deployment
│   ├── export-abi.cjs             # ABI export
│   └── git-commit.sh              # Git commit helper
├── src/
│   ├── components/
│   │   ├── landing/               # Landing page components
│   │   ├── weather/               # Weather DApp components
│   │   └── ui/                    # shadcn/ui components
│   ├── hooks/
│   │   └── useForecastContract.ts # Contract interaction hooks
│   ├── lib/
│   │   ├── abi/                   # Contract ABIs
│   │   ├── config.ts              # App configuration
│   │   ├── fhe.ts                 # FHE SDK initialization
│   │   ├── wagmi.ts               # Wagmi configuration
│   │   └── viem.ts                # Viem clients
│   ├── pages/
│   │   ├── Index.tsx              # Landing page
│   │   ├── WeatherDApp.tsx        # Main DApp
│   │   └── WeatherHistory.tsx     # Bet history
│   └── App.tsx                    # Root component
├── docs/
│   ├── deployment/                # Deployment documentation
│   ├── testing/                   # Testing guides
│   └── development/               # Development notes
├── test/                          # Contract tests
├── e2e/                           # E2E tests
├── hardhat.config.cjs             # Hardhat configuration
├── vite.config.ts                 # Vite configuration
└── package.json                   # Dependencies and scripts
```

## 🔧 Development

### Available Scripts

```bash
# Hardhat Commands
npm run hardhat:compile    # Compile contracts
npm run hardhat:clean      # Clean build artifacts
npm run hardhat:test       # Run contract tests

# Deployment
npm run deploy:sepolia     # Deploy to Sepolia
npm run export-abi         # Export contract ABI

# Frontend
npm run dev                # Start dev server
npm run build              # Build for production
npm run preview            # Preview production build

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run E2E tests
```

### Contract Development

The project includes two contract versions:

1. **WeatherWagerBookFixed.sol**: Production contract
   - Real FHE encryption
   - SDK-compatible configuration
   - For Sepolia deployment

2. **WeatherWagerMock.sol**: Testing contract
   - No FHE operations
   - Fast local testing
   - For development iteration

## 🎮 Usage

### For Users

1. **Connect Wallet**: Click "Connect Wallet" and select MetaMask
2. **Select Network**:
   - Sepolia (for real FHE testing)
   - Localhost 8545 (for local development)
3. **Select City**: Choose a city to bet on
4. **Choose Weather**: Select predicted weather condition
5. **Enter Stake**: Input bet amount in ETH
6. **Place Bet**: Confirm transaction to submit encrypted prediction
7. **Wait for Settlement**: Oracle will settle market after lock time
8. **Claim Winnings**: If you win, claim your payout

### For Admins

See [QUICK_START.md](QUICK_START.md#admin-operations) for admin operations.

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

### Local Testing

The easiest way to test the full application:

```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy and start frontend
npx hardhat run scripts/deploy-mock.cjs --network localhost
npm run export-abi
npm run dev
```

See [Local Testing Guide](docs/testing/LOCAL_TESTING_GUIDE.md) for detailed instructions.

### Contract Tests

```bash
npm run hardhat:test
```

### E2E Tests

```bash
npm run test:e2e
```

## 🌐 Deployment

### Current Deployments

**🌐 Live DApp**: [https://weather-wager-dapp.vercel.app](https://weather-wager-dapp.vercel.app)

| Network | Contract | Address | Status |
|---------|----------|---------|--------|
| Sepolia | WeatherWagerBookFixed | `0x31364f95486A6D3b7C95728c786483940034b250` | ✅ Deployed |
| Localhost | WeatherWagerMock | Dynamic | 🔄 Dev Only |

| Platform | Type | URL | Status |
|----------|------|-----|--------|
| Vercel | Frontend | [weather-wager-dapp.vercel.app](https://weather-wager-dapp.vercel.app) | ✅ Live |

### Deployment Guides

- **Local Development**: [docs/testing/LOCAL_TESTING_GUIDE.md](docs/testing/LOCAL_TESTING_GUIDE.md)
- **Sepolia Testnet**: [QUICK_START.md](QUICK_START.md)
- **Deployment History**: [docs/deployment/](docs/deployment/)

## 🐛 Troubleshooting

### FHE SDK Issues

**Error**: `SharedArrayBuffer is not defined`
**Solution**: Ensure COOP/COEP headers are set in `vite.config.ts`

**Error**: `FHE instance not initialized`
**Solution**: Call `initializeFHE()` before using FHE functions

### Contract Issues

**Error**: `Market is locked`
**Solution**: Wait for lock time to pass before placing bets

**Error**: `Market not active`
**Solution**: Check if markets have been created. For local testing, use `deploy-mock.cjs`

### Network Issues

**Error**: `Wrong network`
**Solution**: Switch to correct network in MetaMask (Sepolia or Localhost 8545)

**Error**: `Insufficient funds`
**Solution**:
- Sepolia: Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
- Local: Import Hardhat test account (see Local Testing Guide)

## 📚 Documentation

### Core Documentation
- [Quick Start Guide](QUICK_START.md)
- [Local Testing Guide](docs/testing/LOCAL_TESTING_GUIDE.md)

### Additional Documentation
- [Deployment Notes](docs/deployment/)
- [Testing Reports](docs/testing/)
- [Development Notes](docs/development/)

### External Resources
- [Zama FHE Documentation](https://docs.zama.ai/fhevm)
- [fhEVM Solidity Docs](https://docs.zama.ai/fhevm/fundamentals)
- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Docs](https://www.rainbowkit.com/)
- [Vite Documentation](https://vitejs.dev/)

## 🚧 Current Status

### ✅ Completed
- Smart contract development (Fixed & Mock versions)
- Frontend UI with wallet integration
- FHE SDK integration
- Local testing environment
- Sepolia deployment
- Documentation

### ⚠️ Known Limitations
- Sepolia market creation requires special FHE infrastructure
- Oracle settlement not yet automated
- Limited to 4 weather conditions per market

### 🔜 Planned Features
- Automated weather oracle integration
- Historical weather data analysis
- Multi-market dashboard
- Improved mobile experience

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🙋 Support

- **Documentation**: Check `docs/` directory
- **Issues**: [GitHub Issues](../../issues)
- **Zama Community**: [Discord](https://discord.gg/zama)

---

Built with ❤️ using [Zama FHE](https://www.zama.ai/) technology
