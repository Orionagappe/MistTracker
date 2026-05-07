# Ethereum Sepolia Integration Setup Guide

## Overview

This guide explains how to integrate **Ethereum Sepolia testnet** with The Game for immutable hash anchoring. Claims and verdicts are hashed and recorded on the public blockchain, creating an immutable proof of all game decisions.

## Current Status

✅ **Simulation Mode Active** - System works without internet
- All hash computation working
- Transaction logging functional
- Ready for live blockchain connection

⏳ **Pending Internet Access** - Once network enabled:
- Connect to Ethereum Sepolia testnet
- Real blockchain anchoring begins
- All hashes publicly verifiable on Etherscan

---

## What Gets Recorded

### Claim Hash
```
claim_hash = keccak256(encode(claim_id, element, measurement_type, reference_value, measured_value))
```

Example:
- **Claim**: atomic-001 | Carbon | Bohr Radius | 0.0442 | 0.0440
- **Hash**: 0xa3d0aca4e1e00a09887efaaf55bd0566...
- **TX**: 0x26319b888009e187636a34c956... (on Sepolia)

### Verdict Hash
```
verdict_hash = keccak256(encode(claim_id, validator_id, verdict, is_correct))
```

Example:
- **Claim**: atomic-001
- **Validator**: validator-1
- **Verdict**: approved
- **Correct**: true
- **Hash**: 0x52f165ccf9572d1e1881c6a065aa77ff...
- **TX**: 0x1e1ab3699cd32b11fe23b4f7c2... (on Sepolia)

---

## Setup Instructions

### Step 1: Get Sepolia Testnet ETH

The first time you anchor claims, you need a small amount of testnet ETH for gas fees.

1. Go to **Alchemy Faucet**: https://www.alchemy.com/faucets/ethereum-sepolia
2. Sign up with GitHub or email
3. Enter your Ethereum address (see Step 2 for how to generate)
4. Receive 0.5 testnet ETH (enough for ~50 transactions)

### Step 2: Generate or Import Ethereum Account

**Option A: Generate New Account**

```bash
node -e "
const ethers = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('Mnemonic:', wallet.mnemonic.phrase);
"
```

**Option B: Import Existing Account**

Use any Ethereum wallet's private key (MetaMask, ethers.js, etc.)

⚠️ **Security Warning**: Never commit private keys to version control!

### Step 3: Get Alchemy API Key

1. Go to **https://www.alchemy.com**
2. Sign up (free)
3. Create app → Select "Ethereum" → Select "Sepolia"
4. Copy your RPC URL: `https://eth-sepolia.g.alchemy.com/v2/<YOUR_API_KEY>`

### Step 4: Set Environment Variables

**On Linux/Mac:**
```bash
export SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/<YOUR_API_KEY>"
export SEPOLIA_PRIVATE_KEY="<YOUR_PRIVATE_KEY>"
```

**On Windows (PowerShell):**
```powershell
$env:SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/<YOUR_API_KEY>"
$env:SEPOLIA_PRIVATE_KEY="<YOUR_PRIVATE_KEY>"
```

**Or create `.env` file:**
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_API_KEY>
SEPOLIA_PRIVATE_KEY=<YOUR_PRIVATE_KEY>
```

Then load it in Node:
```javascript
import dotenv from 'dotenv';
dotenv.config();
```

### Step 5: Test Connection

```bash
npm run ethereum:test
```

Expected output:
```
✅ Connected to Sepolia testnet
   Signer: 0x...
   Balance: 0.5 ETH
```

---

## Usage Examples

### Basic Integration

```javascript
import { EthereumSepoliaAnchor } from './ethereum-sepolia-anchor.js';

const anchor = new EthereumSepoliaAnchor();

// Record claim hash
const claim_hash = EthereumSepoliaAnchor.hashClaim(
  'atomic-001',
  'Carbon',
  'Bohr Radius',
  0.0442,
  0.0440
);

const result = await anchor.recordClaimHash('atomic-001', claim_hash);
console.log('TX Hash:', result.transaction_hash);
console.log('Block:', result.block_number);
```

### In Game Server

```javascript
// In game-server.js, after claim finalization:

if (gameEngine.use_ethereum_anchor) {
  const claim_hash = EthereumSepoliaAnchor.hashClaim(
    claim.id,
    claim.element_or_particle,
    claim.measurement_type,
    claim.reference_value,
    claim.measured_value
  );
  
  await gameEngine.ethereum_anchor.recordClaimHash(claim.id, claim_hash);
}
```

### Verify on Etherscan

Once recorded, view your transaction on the public blockchain:

```
https://sepolia.etherscan.io/tx/<TRANSACTION_HASH>
```

Example:
```
https://sepolia.etherscan.io/tx/0x26319b888009e187636a34c956...
```

---

## Architecture

### Hash Computation

Hashes use **Keccak256** (same as Ethereum):

**Claim Hash:**
```javascript
keccak256(
  encode(
    ['string', 'string', 'string', 'uint256', 'uint256'],
    [claim_id, element, measurement, reference * 1e6, measured * 1e6]
  )
)
```

**Verdict Hash:**
```javascript
keccak256(
  encode(
    ['string', 'string', 'string', 'bool'],
    [claim_id, validator_id, verdict, is_correct]
  )
)
```

### Transaction Recording

Each hash is sent as transaction data to the signer's own address:

```
FROM: 0x...
TO: 0x... (same address)
DATA: <encoded hash>
GAS: ~22,000 per transaction
COST: ~0.001 ETH (~$0.03 at current prices)
```

This creates an immutable on-chain record searchable by:
- Transaction hash
- Block number
- Sender address
- Timestamp

### Local vs. Live Mode

| Feature | Simulation | Live |
|---------|-----------|------|
| Hash computation | ✅ Real | ✅ Real |
| Transaction creation | ✅ Simulated | ✅ Real blockchain |
| Block numbers | ✅ Simulated | ✅ Real Sepolia blocks |
| Etherscan verification | ❌ N/A | ✅ Public proof |
| Gas costs | ❌ Free | 💰 ~0.001 ETH per TX |
| Internet required | ❌ No | ✅ Yes |

---

## Monitoring

### Check Status
```bash
node -e "
import { EthereumSepoliaAnchor } from './ethereum-sepolia-anchor.js';
const anchor = new EthereumSepoliaAnchor();
console.log(await anchor.getStatus());
"
```

### View Transaction Log
```bash
node -e "
import { EthereumSepoliaAnchor } from './ethereum-sepolia-anchor.js';
const anchor = new EthereumSepoliaAnchor();
console.log(anchor.getTransactionLog());
"
```

### Get Claim Anchor Info
```bash
node -e "
import { EthereumSepoliaAnchor } from './ethereum-sepolia-anchor.js';
const anchor = new EthereumSepoliaAnchor();
console.log(await anchor.getClaimAnchor('claim-id-here'));
"
```

---

## Troubleshooting

### "Not connected to Sepolia"

**Cause**: RPC URL or private key missing

**Solution**: 
```bash
echo $SEPOLIA_RPC_URL
echo $SEPOLIA_PRIVATE_KEY
```

If empty, set environment variables (see Step 4)

### "Signer has 0 balance"

**Cause**: No testnet ETH available

**Solution**: Request more from faucet
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://sepoliafaucet.com/

### "Transaction reverted"

**Cause**: Usually out of gas or nonce conflict

**Solution**:
- Increase gas limit in ethereum-sepolia-anchor.js
- Wait a few blocks before retrying
- Check account nonce on Etherscan

### "Network chain ID mismatch"

**Cause**: RPC URL points to wrong chain

**Solution**: Verify RPC URL is Sepolia:
- Sepolia: https://eth-sepolia.g.alchemy.com/v2/...
- Not Mainnet: https://eth-mainnet.g.alchemy.com/v2/...

---

## Cost Analysis

**Testnet (Sepolia)**:
- Gas cost per transaction: ~22,000 gas
- Gas price: 1 wei (essentially free)
- Cost per claim: Free ✅
- Cost per 1,000 claims: Free ✅

**Mainnet (Optional Future)**:
- Gas cost per transaction: ~22,000 gas  
- Gas price: ~50 gwei (varies by network)
- Cost per claim: ~$0.03-$0.15
- Cost per 1,000 claims: $30-$150

For now, Sepolia testnet is unlimited and free!

---

## Security Notes

✅ **Safe**:
- Public blockchain is immutable (can't change hashes)
- Anyone can verify your verdicts on Etherscan
- Only hash stored (no sensitive data)

⚠️ **Be Careful**:
- Never commit private keys to Git
- Use only testnet keys for testing
- Keep mainnet keys in hardware wallet

🔒 **Best Practice**:
- Use environment variables (not hardcoded)
- Rotate testnet keys regularly
- Use different key for mainnet (when ready)

---

## Next Steps

1. ✅ Current: Simulation mode working
2. ⏳ Enable internet access
3. Set SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY
4. Run npm run ethereum:test
5. Watch transactions appear on Etherscan!
6. (Optional) Integrate into game-server.js for auto-anchoring

---

## Files

- `ethereum-sepolia-anchor.js` - Core integration module
- `test-ethereum-sepolia.js` - Test suite
- `ETHEREUM-SEPOLIA-SETUP.md` - This guide

## Contact

For issues or questions about the integration, check:
- Alchemy docs: https://docs.alchemy.com/
- Ethers.js docs: https://docs.ethers.org/
- Sepolia Faucet: https://www.alchemy.com/faucets/ethereum-sepolia
- Block Explorer: https://sepolia.etherscan.io/
