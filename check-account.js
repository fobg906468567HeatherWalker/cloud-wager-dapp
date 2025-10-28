const { ethers } = require('ethers');
require('dotenv/config');

async function main() {
  // Check mnemonic account
  const mnemonic = process.env.MNEMONIC || "test test test test test test test test test test test junk";
  const wallet = ethers.Wallet.fromPhrase(mnemonic);

  console.log('\n📍 Account from MNEMONIC:');
  console.log('   Address:', wallet.address);

  // Check private key account
  if (process.env.PRIVATE_KEY) {
    const pkWallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    console.log('\n📍 Account from PRIVATE_KEY:');
    console.log('   Address:', pkWallet.address);

    if (wallet.address.toLowerCase() === pkWallet.address.toLowerCase()) {
      console.log('\n✅ Mnemonic and private key match!');
    } else {
      console.log('\n⚠️  WARNING: Mnemonic and private key are DIFFERENT accounts!');
      console.log('   You need to use a mnemonic that derives to:', pkWallet.address);
    }
  }

  // Check balance
  try {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const balance = await provider.getBalance(wallet.address);
    console.log('\n💰 Balance (from mnemonic):', ethers.formatEther(balance), 'ETH');

    if (process.env.PRIVATE_KEY) {
      const pkBalance = await provider.getBalance(pkWallet.address);
      console.log('💰 Balance (from private key):', ethers.formatEther(pkBalance), 'ETH');
    }
  } catch (error) {
    console.log('\n⚠️  Could not check balance:', error.message);
  }
}

main().catch(console.error);
