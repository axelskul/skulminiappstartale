// Mock module for @solana-program/system to satisfy Privy's optional dependency
// This is only used during build - Privy won't actually use Solana features if not configured

export function getTransferSolInstruction() {
  throw new Error('Solana is not configured in this app');
}

export default {
  getTransferSolInstruction,
};

