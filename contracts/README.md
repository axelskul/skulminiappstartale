# SKÜL Registry Smart Contract

## Overview

The `SkulRegistry.sol` contract is a public, onchain registry for Proof-of-Skill credentials issued by the SKÜL EdTech platform. It runs on the Soneium Minato L2 testnet.

## Contract Details

- **Contract Name:** `SkulRegistry`
- **Solidity Version:** `^0.8.20`
- **Network:** Soneium Minato Testnet
- **License:** MIT

## Features

- ✅ Public credential registry
- ✅ Gas-efficient storage
- ✅ Event-based indexing
- ✅ Query functions for frontend integration

## Deployment

### Prerequisites

1. Install Hardhat or Foundry:
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   ```

2. Create `hardhat.config.js`:
   ```javascript
   require("@nomicfoundation/hardhat-toolbox");

   module.exports = {
     solidity: "0.8.20",
     networks: {
       soneiumMinato: {
         url: "https://rpc.minato.soneium.org",
         accounts: [process.env.PRIVATE_KEY],
         chainId: 1946,
       },
     },
   };
   ```

3. Deploy the contract:
   ```bash
   npx hardhat run scripts/deploy.js --network soneiumMinato
   ```

## Usage

### Issue a Credential

```solidity
// Call from user's wallet
skulRegistry.issueCredential(
    3621,  // FID
    "Business English"  // Skill name
);
```

### Query Credentials

```solidity
// Get credential count
uint256 count = skulRegistry.getCredentialCount(userAddress);

// Get specific credential
Credential memory cred = skulRegistry.getCredential(userAddress, 0);
```

## Frontend Integration

The contract emits `CredentialIssued` events that can be indexed by your frontend:

```typescript
// Listen for events
contract.on("CredentialIssued", (user, fid, skillName, timestamp) => {
  console.log(`Credential issued: ${skillName} to ${user}`);
});
```

## Security Considerations

- ✅ Users can only issue credentials to their own address (`msg.sender`)
- ✅ No admin functions (fully decentralized)
- ✅ No upgrade mechanism (immutable after deployment)
- ⚠️ String storage costs gas - consider using bytes32 for skill names in production

## Gas Optimization

- Uses `memory` for struct creation (cheaper than storage)
- Events use indexed parameters for efficient filtering
- Public mapping provides automatic getter functions

