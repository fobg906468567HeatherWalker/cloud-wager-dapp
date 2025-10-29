const { ethers } = require('ethers');
require('dotenv/config');

async function checkBalance() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const address = process.env.ADDRESS;

    console.log('📍 Checking balance for:', address);

    const balance = await provider.getBalance(address);
    const balanceInEth = ethers.formatEther(balance);

    console.log('💰 Balance:', balanceInEth, 'ETH');

    if (parseFloat(balanceInEth) < 0.05) {
      console.log('\n⚠️  WARNING: Balance is low!');
      console.log('   Recommended: At least 0.05 ETH for deployment');
      console.log('   Get Sepolia ETH from: https://sepoliafaucet.com/');
    } else {
      console.log('\n✅ Balance is sufficient for deployment');
    }
  } catch (error) {
    console.error('❌ Error checking balance:', error.message);
  }
}

checkBalance();
