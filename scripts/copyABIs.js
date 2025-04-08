const fs = require('fs');
const path = require('path');

const CONTRACTS = [
    'Event',
    'Ticket',
    'TicketingPlatform',
    'TicketMarket',
    'UserRegistry'
];

const ARTIFACTS_DIR = path.join(__dirname, '..', 'artifacts', 'contracts');
const ABI_OUTPUT_DIR = path.join(__dirname, '..', 'frontend', 'src', 'abi');

function extractAbi(json) {
    return JSON.stringify(json.abi, null, 2); // Prettified ABI
}

function generateAbiExport(contractName, abiStr) {
    return `const ${contractName}_ABI = ${abiStr};\n\nexport default ${contractName}_ABI;\n`;
}

function copyAbi(contractName) {
    const sourcePath = path.join(ARTIFACTS_DIR, `${contractName}.sol`, `${contractName}.json`);
    const destPath = path.join(ABI_OUTPUT_DIR, `${contractName}_ABI.js`);

    try {
        const contractJson = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
        const abiString = extractAbi(contractJson);
        const fileContent = generateAbiExport(contractName, abiString);
        fs.writeFileSync(destPath, fileContent);
        console.log(`[✅ ABI Copied] ${contractName} -> ${destPath}`);
    } catch (err) {
        console.error(`[❌ ABI Copy Error] ${contractName}:`, err.message);
    }
}

function main() {
    if (!fs.existsSync(ABI_OUTPUT_DIR)) {
        fs.mkdirSync(ABI_OUTPUT_DIR, { recursive: true });
    }

    CONTRACTS.forEach(copyAbi);
}

main();