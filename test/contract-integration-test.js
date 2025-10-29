/**
 * WeatherWager Smart Contract Integration Tests
 *
 * Tests all contract functions in a real Sepolia environment
 */

const { ethers } = require('ethers');
require('dotenv/config');

// Contract configuration
const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract ABI (load from compiled artifacts)
const CONTRACT_ABI = require('../artifacts/contracts/WeatherWagerBook.sol/WeatherWagerBook.json').abi;

// Test utilities
const COLORS = {
  RESET: '\x1b[0m',
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m'
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function success(message) {
  log(`✅ ${message}`, COLORS.GREEN);
}

function error(message) {
  log(`❌ ${message}`, COLORS.RED);
}

function info(message) {
  log(`ℹ️  ${message}`, COLORS.BLUE);
}

function section(message) {
  log(`\n${'='.repeat(60)}`, COLORS.CYAN);
  log(` ${message}`, COLORS.CYAN);
  log(`${'='.repeat(60)}`, COLORS.CYAN);
}

// Test counters
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0
};

async function runTest(testName, testFn) {
  try {
    info(`Running: ${testName}...`);
    await testFn();
    success(`PASSED: ${testName}`);
    testResults.passed++;
    return true;
  } catch (err) {
    error(`FAILED: ${testName}`);
    error(`Error: ${err.message}`);
    testResults.failed++;
    return false;
  }
}

async function main() {
  section('WeatherWager Contract Integration Tests');

  info('Initializing test environment...');
  info(`Contract: ${CONTRACT_ADDRESS}`);
  info(`Network: Sepolia Testnet`);

  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  info(`Test Account: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  info(`Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Test Suite 1: Market Information Tests
  section('Test Suite 1: Market Information & State');

  await runTest('Test 1.1: Get City Market Info (New York)', async () => {
    const marketInfo = await contract.getCityMarket(1);

    if (!marketInfo.exists) {
      throw new Error('New York market does not exist');
    }

    info(`  Market exists: ${marketInfo.exists}`);
    info(`  Condition count: ${marketInfo.conditionCount}`);
    info(`  Lock timestamp: ${new Date(Number(marketInfo.lockTimestamp) * 1000).toLocaleString()}`);
    info(`  Settled: ${marketInfo.settled}`);
    info(`  Total deposited: ${ethers.formatEther(marketInfo.totalDepositedWei)} ETH`);

    if (Number(marketInfo.conditionCount) !== 4) {
      throw new Error(`Expected 4 conditions, got ${marketInfo.conditionCount}`);
    }
  });

  await runTest('Test 1.2: Get City Market Info (London)', async () => {
    const marketInfo = await contract.getCityMarket(2);

    if (!marketInfo.exists) {
      throw new Error('London market does not exist');
    }

    info(`  Market exists: ${marketInfo.exists}`);
    info(`  Settled: ${marketInfo.settled}`);
  });

  await runTest('Test 1.3: Get City Market Info (Tokyo)', async () => {
    const marketInfo = await contract.getCityMarket(3);

    if (!marketInfo.exists) {
      throw new Error('Tokyo market does not exist');
    }

    info(`  Market exists: ${marketInfo.exists}`);
    info(`  Settled: ${marketInfo.settled}`);
  });

  await runTest('Test 1.4: Query Non-existent Market', async () => {
    const marketInfo = await contract.getCityMarket(999);

    if (marketInfo.exists) {
      throw new Error('Non-existent market should not exist');
    }

    info(`  Correctly returns non-existent for market ID 999`);
  });

  // Test Suite 2: Role and Access Control
  section('Test Suite 2: Access Control & Roles');

  await runTest('Test 2.1: Check Admin Role', async () => {
    const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const hasRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, wallet.address);

    if (!hasRole) {
      throw new Error('Deployer should have admin role');
    }

    info(`  Admin role verified for ${wallet.address}`);
  });

  await runTest('Test 2.2: Check Market Role', async () => {
    const MARKET_ROLE = await contract.MARKET_ROLE();
    const hasRole = await contract.hasRole(MARKET_ROLE, wallet.address);

    if (!hasRole) {
      throw new Error('Deployer should have market role');
    }

    info(`  Market role verified`);
  });

  await runTest('Test 2.3: Check Oracle Role', async () => {
    const ORACLE_ROLE = await contract.ORACLE_ROLE();
    const hasRole = await contract.hasRole(ORACLE_ROLE, wallet.address);

    if (!hasRole) {
      throw new Error('Deployer should have oracle role');
    }

    info(`  Oracle role verified`);
  });

  // Test Suite 3: Ticket Management
  section('Test Suite 3: Ticket & Betting Information');

  await runTest('Test 3.1: Get Ticket Count', async () => {
    const count = await contract.ticketCount();
    info(`  Total tickets issued: ${count.toString()}`);
  });

  await runTest('Test 3.2: Get Tickets for New York', async () => {
    const tickets = await contract.getTicketsForCity(1);
    info(`  New York tickets: ${tickets.length}`);

    if (tickets.length > 0) {
      info(`  First ticket ID: ${tickets[0].toString()}`);
    }
  });

  // Test Suite 4: Market Lock Status
  section('Test Suite 4: Market Lock Status');

  await runTest('Test 4.1: Check Market Lock Time Status', async () => {
    const marketInfo = await contract.getCityMarket(1);
    const currentTime = Math.floor(Date.now() / 1000);
    const lockTime = Number(marketInfo.lockTimestamp);
    const isLocked = currentTime >= lockTime;

    info(`  Current time: ${new Date(currentTime * 1000).toLocaleString()}`);
    info(`  Lock time: ${new Date(lockTime * 1000).toLocaleString()}`);
    info(`  Market is ${isLocked ? 'LOCKED' : 'OPEN'}`);
    info(`  Time until lock: ${isLocked ? 'Already locked' : `${Math.floor((lockTime - currentTime) / 3600)} hours`}`);
  });

  // Test Suite 5: Contract Constants
  section('Test Suite 5: Contract Constants & Configuration');

  await runTest('Test 5.1: Verify Scale Factor', async () => {
    const scale = await contract.SCALE();

    if (scale.toString() !== '1000000') {
      throw new Error(`Expected scale 1000000, got ${scale.toString()}`);
    }

    info(`  Scale factor: ${scale.toString()}`);
  });

  await runTest('Test 5.2: Verify Max Conditions', async () => {
    const maxConditions = await contract.MAX_CONDITIONS();

    if (Number(maxConditions) !== 4) {
      throw new Error(`Expected 4 max conditions, got ${maxConditions}`);
    }

    info(`  Max conditions: ${maxConditions}`);
  });

  // Test Suite 6: Gateway Integration
  section('Test Suite 6: Gateway & Decryption Configuration');

  await runTest('Test 6.1: Verify Gateway Role Assignment', async () => {
    const GATEWAY_ROLE = await contract.GATEWAY_ROLE();
    const gatewayAddress = '0x33347831500F1e73f0ccCBb95c9f86B94d7b1123';
    const hasRole = await contract.hasRole(GATEWAY_ROLE, gatewayAddress);

    if (!hasRole) {
      throw new Error('Gateway should have gateway role');
    }

    info(`  Gateway role verified for ${gatewayAddress}`);
  });

  // Test Suite 7: Request Counter
  section('Test Suite 7: Decryption Request Tracking');

  await runTest('Test 7.1: Check Request Counter', async () => {
    const requestCount = await contract.requestCount();
    info(`  Total decryption requests: ${requestCount.toString()}`);
  });

  // Test Summary
  section('Test Summary');

  const total = testResults.passed + testResults.failed + testResults.skipped;
  const passRate = ((testResults.passed / total) * 100).toFixed(2);

  log(`\nTotal Tests: ${total}`, COLORS.CYAN);
  success(`Passed: ${testResults.passed}`);
  error(`Failed: ${testResults.failed}`);
  log(`Skipped: ${testResults.skipped}`, COLORS.YELLOW);
  log(`Pass Rate: ${passRate}%\n`, passRate === '100.00' ? COLORS.GREEN : COLORS.YELLOW);

  if (testResults.failed === 0) {
    section('✅ ALL TESTS PASSED');
    return 0;
  } else {
    section('❌ SOME TESTS FAILED');
    return 1;
  }
}

// Run tests
main()
  .then(exitCode => process.exit(exitCode))
  .catch(err => {
    error(`Fatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
  });
