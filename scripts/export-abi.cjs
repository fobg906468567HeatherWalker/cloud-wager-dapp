/**
 * Export Contract ABI
 *
 * Extracts ABI from compiled artifacts and saves to src/lib/abi/
 */

const fs = require('fs');
const path = require('path');

async function main() {
  console.log("📦 Exporting WeatherWager ABI...\n");

  // Read compiled artifact
  const artifactPath = path.join(__dirname, '../artifacts/contracts/WeatherWagerBook.sol/WeatherWagerBook.json');

  if (!fs.existsSync(artifactPath)) {
    console.error("❌ Contract not compiled. Run: npx hardhat compile");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  // Extract ABI
  const abi = artifact.abi;

  // Create output directory
  const outputDir = path.join(__dirname, '../src/lib/abi');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write ABI file
  const outputPath = path.join(outputDir, 'weatherWager.ts');
  const content = 'export const weatherWagerAbi = ' + JSON.stringify(abi, null, 2) + ' as const;\n\nexport type WeatherWagerAbi = typeof weatherWagerAbi;\n';

  fs.writeFileSync(outputPath, content);

  console.log("✅ ABI exported successfully!");
  console.log("📍 Output:", outputPath);
  console.log("📊 Functions:", abi.filter(x => x.type === 'function').length);
  console.log("📡 Events:", abi.filter(x => x.type === 'event').length);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Export failed:", error);
    process.exit(1);
  });
