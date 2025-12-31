# SKÜL Mini App - Deployment Guide

## Prerequisites

1. **Deploy Smart Contract** to Soneium Minato Testnet
2. **Get Privy App ID** from https://privy.io
3. **Update Environment Variables**

## Step 1: Deploy Smart Contract

### Install Hardhat (if not already installed)
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### Create `hardhat.config.js`
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

### Create `scripts/deploy.js`
```javascript
const hre = require("hardhat");

async function main() {
  const SkulRegistry = await hre.ethers.getContractFactory("SkulRegistry");
  const skulRegistry = await SkulRegistry.deploy();

  await skulRegistry.waitForDeployment();

  console.log("SkulRegistry deployed to:", await skulRegistry.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Deploy
```bash
PRIVATE_KEY=your_private_key npx hardhat run scripts/deploy.js --network soneiumMinato
```

**Copy the deployed contract address** - you'll need it for Step 3.

## Step 2: Configure Privy

1. Go to https://privy.io and create an account
2. Create a new app
3. Copy your App ID
4. Add it to `.env` as `VITE_PRIVY_APP_ID`

## Step 3: Update Environment Variables

Create a `.env` file in the project root:

```bash
VITE_PRIVY_APP_ID=your_privy_app_id_here
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

## Step 4: Build and Deploy Frontend

```bash
npm run build
```

Deploy the `dist` folder to your hosting provider (Vercel, Netlify, etc.).

## Network Configuration

The app is configured to work exclusively with **Soneium Minato Testnet**:
- **Chain ID:** 1946
- **RPC URL:** https://rpc.minato.soneium.org
- **Block Explorer:** https://soneium-minato.blockscout.com

The app includes automatic network validation and will prompt users to switch if they're on the wrong network.

## Testing

1. Connect wallet via Privy
2. Ensure you're on Soneium Minato Testnet
3. Complete a challenge
4. Submit for certification
5. Approve the transaction in your wallet
6. Wait for confirmation

## Troubleshooting

### "Wrong network" error
- The app automatically detects and prompts to switch networks
- Users can manually switch in their wallet settings

### Transaction fails
- Ensure you have testnet ETH on Soneium Minato
- Check that the contract address is correct in `.env`
- Verify the contract is deployed and verified

### Wallet not connecting
- Check Privy App ID is correct
- Ensure Privy dashboard has correct app configuration
- Check browser console for errors

