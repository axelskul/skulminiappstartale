/**
 * Badge Minting Utility
 * Handles onchain Proof of Skill badge minting on Soneium Minato Testnet
 */

import { createWalletClient, createPublicClient, http, custom } from 'viem'

// Soneium Minato Testnet Configuration
export const SONEIUM_MINATO = {
  id: 1946,
  name: 'Soneium Minato Testnet',
  network: 'soneium-minato',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.minato.soneium.org'],
    },
    public: {
      http: ['https://rpc.minato.soneium.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://soneium-minato.blockscout.com',
    },
  },
  testnet: true,
} as const

// Contract ABI for SkulRegistry
const SKUL_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: '_fid', type: 'uint256' },
      { internalType: 'string', name: '_skillName', type: 'string' },
    ],
    name: 'issueCredential',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'fid', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'skillName', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'CredentialIssued',
    type: 'event',
  },
] as const

export interface BadgeMetadata {
  fid: number
  challengeId: string
  credentialNumber: string
  category: string
  timestamp: number
  score?: number
}

export interface MintResult {
  success: boolean
  txHash?: string
  error?: string
}

/**
 * Validates that the provider is connected to Soneium Minato Testnet
 * @param provider The EIP-1193 provider from Privy
 * @returns true if on correct network, false otherwise
 */
export async function validateNetwork(provider: any): Promise<boolean> {
  try {
    const chainId = await provider.request({ method: 'eth_chainId' })
    const chainIdNumber = parseInt(chainId as string, 16)
    
    if (chainIdNumber !== SONEIUM_MINATO.id) {
      console.error(
        `Wrong network! Expected ${SONEIUM_MINATO.id} (Soneium Minato), got ${chainIdNumber}`
      )
      return false
    }
    return true
  } catch (error) {
    console.error('Failed to get chain ID:', error)
    return false
  }
}

/**
 * Switches the wallet to Soneium Minato Testnet if not already connected
 * @param provider The EIP-1193 provider from Privy
 * @returns true if successfully switched or already on correct network
 */
export async function ensureSoneiumNetwork(provider: any): Promise<boolean> {
  try {
    const chainId = await provider.request({ method: 'eth_chainId' })
    const chainIdNumber = parseInt(chainId as string, 16)
    
    if (chainIdNumber === SONEIUM_MINATO.id) {
      return true
    }

    // Request to switch network
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SONEIUM_MINATO.id.toString(16)}` }],
      })
      
      // Verify switch was successful
      const newChainId = await provider.request({ method: 'eth_chainId' })
      const newChainIdNumber = parseInt(newChainId as string, 16)
      return newChainIdNumber === SONEIUM_MINATO.id
    } catch (switchError: any) {
      // If switch fails, try to add the network
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${SONEIUM_MINATO.id.toString(16)}`,
                chainName: SONEIUM_MINATO.name,
                nativeCurrency: SONEIUM_MINATO.nativeCurrency,
                rpcUrls: SONEIUM_MINATO.rpcUrls.default.http,
                blockExplorerUrls: [SONEIUM_MINATO.blockExplorers.default.url],
              },
            ],
          })
          
          // Try to switch again after adding
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${SONEIUM_MINATO.id.toString(16)}` }],
          })
          return true
        } catch (addError) {
          console.error('Failed to add Soneium Minato network:', addError)
          return false
        }
      }
      console.error('Failed to switch to Soneium Minato:', switchError)
      return false
    }
  } catch (error) {
    console.error('Error ensuring Soneium network:', error)
    return false
  }
}

/**
 * Mints a Proof of Skill badge onchain via the SkulRegistry contract
 * @param metadata The badge metadata to mint
 * @param provider The EIP-1193 provider from Privy (ethereum provider)
 * @param contractAddress The deployed SkulRegistry contract address
 * @returns MintResult with transaction hash or error
 */
export async function mintBadge(
  metadata: BadgeMetadata,
  provider: any,
  contractAddress: `0x${string}`
): Promise<MintResult> {
  try {
    // Validate network before proceeding
    const isCorrectNetwork = await validateNetwork(provider)
    if (!isCorrectNetwork) {
      // Try to switch to correct network
      const switched = await ensureSoneiumNetwork(provider)
      if (!switched) {
        return {
          success: false,
          error: `Please switch to Soneium Minato Testnet (Chain ID: ${SONEIUM_MINATO.id}). You can switch networks in your wallet.`,
        }
      }
    }

    // Create wallet client from provider
    const walletClient = createWalletClient({
      chain: SONEIUM_MINATO,
      transport: custom(provider),
    })

    // Create public client for reading
    const publicClient = createPublicClient({
      chain: SONEIUM_MINATO,
      transport: http(SONEIUM_MINATO.rpcUrls.default.http[0]),
    })

    // Get the account from the wallet
    const [account] = await walletClient.getAddresses()
    if (!account) {
      return {
        success: false,
        error: 'No wallet account found. Please connect your wallet.',
      }
    }

    // Prepare the transaction
    const { request } = await publicClient.simulateContract({
      account,
      address: contractAddress,
      abi: SKUL_REGISTRY_ABI,
      functionName: 'issueCredential',
      args: [BigInt(metadata.fid), metadata.category],
    })

    // Send the transaction
    const txHash = await walletClient.writeContract(request)

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    })

    if (receipt.status === 'success') {
      return {
        success: true,
        txHash: txHash,
      }
    } else {
      return {
        success: false,
        error: 'Transaction failed',
      }
    }
  } catch (error: any) {
    console.error('Failed to mint badge:', error)
    
    // Provide user-friendly error messages
    let errorMessage = 'Unknown error occurred'
    if (error?.message) {
      if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled'
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction'
      } else if (error.message.includes('network') || error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and ensure you are on Soneium Minato Testnet.'
      } else {
        errorMessage = error.message
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Generates a unique credential number
 */
export function generateCredentialNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  return `${timestamp}-${random}-SKL`
}

/**
 * Validates badge metadata before minting
 */
export function validateBadgeMetadata(metadata: BadgeMetadata): boolean {
  return !!(
    metadata.fid &&
    metadata.challengeId &&
    metadata.credentialNumber &&
    metadata.category &&
    metadata.timestamp
  )
}

/**
 * Gets the Soneium Minato network configuration
 */
export function getSoneiumMinatoConfig() {
  return SONEIUM_MINATO
}
