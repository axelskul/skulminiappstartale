import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import sdk from '@farcaster/miniapp-sdk'
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth'
import { GraduationCap, Check, Shield, Share2, Sparkles } from 'lucide-react'
import { CHALLENGES, getRandomChallenge, type Challenge } from './utils/challenges'
import { validateAnswer, validatePresentation, validateNegotiation } from './utils/validation'
import { mintBadge, generateCredentialNumber, type BadgeMetadata, SONEIUM_MINATO } from './utils/badge'

// Logo image path - place your logo in public folder as skul-logo.png
// Or update this path to match your image location
const skulLogo = '/skul-logo.png'

type AppState = 'SPLASH' | 'START' | 'CHALLENGE' | 'SUCCESS'

interface FarcasterContext {
  fid?: number
  username?: string
}

interface MintResult {
  success: boolean
  txHash?: string
  error?: string
}

function AppContent() {
  const [state, setState] = useState<AppState>('SPLASH')
  const [userAnswer, setUserAnswer] = useState('')
  const [farcasterContext, setFarcasterContext] = useState<FarcasterContext>({})
  const [currentChallenge, setCurrentChallenge] = useState<Challenge>(CHALLENGES[0])
  const [credentialNumber, setCredentialNumber] = useState<string>('')
  const [validationResult, setValidationResult] = useState<{ score: number; passed: boolean; feedback: string } | null>(null)
  const [isMinting, setIsMinting] = useState(false)
  const [mintError, setMintError] = useState<string | null>(null)
  const [mintResult, setMintResult] = useState<MintResult | null>(null)
  const { ready, authenticated, login } = usePrivy()
  const { wallets } = useWallets()
  
  // Get the contract address from environment or use a placeholder
  const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`

  // Splash screen - show for 2 seconds
  useEffect(() => {
    if (state === 'SPLASH') {
      const timer = setTimeout(() => {
        setState('START')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [state])

  useEffect(() => {
    // Initialize Farcaster Mini App SDK
    const initializeSDK = async () => {
      try {
        // Call ready() to signal the app is ready
        await sdk.actions.ready()
        
        // Get user context (FID and username)
        const context = await sdk.context
        if (context) {
          setFarcasterContext({
            fid: context.user?.fid,
            username: context.user?.username,
          })
        }
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error)
      }
    }

    initializeSDK()
  }, [])

  const handleStartChallenge = () => {
    setState('CHALLENGE')
    setUserAnswer('')
    setValidationResult(null)
    const randomChallenge = getRandomChallenge()
    setCurrentChallenge(randomChallenge)
  }

  const handleSubmitChallenge = async () => {
    if (userAnswer.trim().length === 0) return
    
    // Validate the answer based on challenge type
    let validationResult
    if (currentChallenge.id.includes('presentation')) {
      validationResult = validatePresentation(userAnswer)
    } else if (currentChallenge.id.includes('negotiation')) {
      validationResult = validateNegotiation(userAnswer)
    } else {
      validationResult = validateAnswer(userAnswer, currentChallenge.prompt, 'email')
    }
    
    setValidationResult(validationResult)
    
    if (validationResult.passed) {
      // Generate credential number
      const credNum = generateCredentialNumber()
      setCredentialNumber(credNum)
      
      // Mint onchain badge
      if (farcasterContext.fid && authenticated) {
        setIsMinting(true)
        setMintError(null)
        setMintResult(null)
        
        try {
          // Get the Ethereum wallet from Privy
          const wallet = wallets.find(w => w.walletClientType === 'privy')
          if (!wallet) {
            throw new Error('No Privy wallet found. Please connect your wallet.')
          }

          // Get the Ethereum provider
          const ethereumProvider = await wallet.getEthereumProvider()
          if (!ethereumProvider) {
            throw new Error('Failed to get Ethereum provider from wallet.')
          }

          const badgeMetadata: BadgeMetadata = {
            fid: farcasterContext.fid,
            challengeId: currentChallenge.id,
            credentialNumber: credNum,
            category: currentChallenge.category,
            timestamp: Date.now(),
            score: validationResult.score,
          }
          
          const mintBadgeResult = await mintBadge(badgeMetadata, ethereumProvider, CONTRACT_ADDRESS)
          setMintResult(mintBadgeResult)
          
          if (!mintBadgeResult.success) {
            setMintError(mintBadgeResult.error || 'Failed to mint badge onchain')
            console.error('Failed to mint badge:', mintBadgeResult.error)
          } else {
            console.log('Badge minted successfully! TX:', mintBadgeResult.txHash)
          }
        } catch (error: any) {
          const errorMessage = error?.message || 'Failed to mint badge onchain'
          setMintError(errorMessage)
          setMintResult({ success: false, error: errorMessage })
          console.error('Error minting badge:', error)
        } finally {
          setIsMinting(false)
        }
      } else if (!authenticated) {
        setMintError('Connect wallet to mint onchain credential')
      }
      
      setState('SUCCESS')
    }
  }

  const handleConnectPrivy = async () => {
    if (!ready) return
    if (!authenticated) {
      await login()
    }
  }

  const handleReset = () => {
    setState('START')
    setUserAnswer('')
    setValidationResult(null)
    setCredentialNumber('')
    setMintError(null)
    setMintResult(null)
  }

  const handleShareToFarcaster = async () => {
    try {
      const shareText = `I just earned a Proof of Skill badge in ${currentChallenge.category}! 🎓\n\nCredential: ${credentialNumber}\nFID: ${farcasterContext.fid}\n\n#ProofOfSkill #SKÜL`
      await sdk.actions.composeCast({
        text: shareText,
      })
    } catch (error) {
      console.error('Failed to share to Farcaster:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-x-hidden">
      <AnimatePresence mode="wait">
        {/* SPLASH Screen */}
        {state === 'SPLASH' && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-[#0A0A0B] z-50 flex items-center justify-center"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <motion.div
              className="flex flex-col items-center justify-center gap-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <motion.div
                className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.4)]"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [1, 0.9, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <GraduationCap className="w-14 h-14 text-white" />
              </motion.div>
              <motion.img
                src={skulLogo}
                alt="SKÜL"
                className="h-16 w-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const textFallback = document.createElement('h1')
                  textFallback.textContent = 'SKÜL'
                  textFallback.className = 'text-5xl font-bold tracking-tight text-white'
                  target.parentNode?.appendChild(textFallback)
                }}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Main Content */}
        {state !== 'SPLASH' && (
          <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 sm:p-8">
            {/* The Mobile Frame: This is what stops the side-to-side stretching */}
            <div className="w-full max-w-[400px] flex flex-col gap-8">
              
              {/* START STATE: Wrapped in your new .glass class */}
              {state === 'START' && (
                <div className="glass rounded-[2.5rem] p-10 flex flex-col items-center text-center fade-in">
                  <div className="breathing mb-8 pt-[50px]">
                    <GraduationCap size={80} className="text-indigo-500" />
                  </div>
                  <div className="mb-2">
                    <img 
                      src={skulLogo} 
                      alt="SKÜL" 
                      className="h-16 w-auto" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent && !parent.querySelector('h1')) {
                          const textFallback = document.createElement('h1')
                          textFallback.textContent = 'SKÜL'
                          textFallback.className = 'text-5xl font-black italic tracking-tighter'
                          parent.appendChild(textFallback)
                        }
                      }}
                    />
                  </div>
                  <p className="text-zinc-500 text-xs font-bold tracking-[0.3em] uppercase mb-10">Proof-of-Skill v1.0</p>
                  
                  {/* Active Challenge Box */}
                  <div className="w-full mb-8 p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
                    <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2 font-bold">ACTIVE CHALLENGE</p>
                    <p className="text-white text-lg font-bold tracking-tight">{currentChallenge.title}</p>
                  </div>
                  
                  <div className="w-full glass rounded-b-[2.5rem] px-[10px] pt-[20px] pb-[30px]">
                    <button 
                      onClick={handleStartChallenge} 
                      className="w-full py-8 px-6 bg-white text-black rounded-full font-bold text-4xl button-glow active:scale-95 transition-all mb-[1.125rem]"
                      style={{ fontSize: '2rem', minHeight: '80px' }}
                    >
                      Start Challenge →
                    </button>
                    
                    {/* Privy Connection */}
                    {!authenticated && (
                      <button
                        onClick={handleConnectPrivy}
                        className="w-full py-8 px-6 bg-white/5 backdrop-blur-xl border border-white/10 text-zinc-400 font-medium text-4xl rounded-full transition-all active:scale-95"
                        style={{ fontSize: '2rem', minHeight: '80px' }}
                      >
                        Connect Wallet
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* CHALLENGE STATE: Using your .notebook-input class */}
              {state === 'CHALLENGE' && (
                <div className="glass rounded-[2.5rem] p-8 fade-in space-y-6">
                  <h2 className="text-2xl font-bold tracking-tight">The Challenge</h2>
                  
                  {/* Instructions */}
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {currentChallenge.instructions}
                  </p>
                  
                  <div className="p-5 bg-indigo-500/10 border-l-4 border-indigo-500 rounded-r-2xl italic">
                    "{currentChallenge.prompt}"
                  </div>
                  
                  <textarea 
                    className="notebook-input w-full h-40 rounded-2xl p-4 text-white text-lg resize-none"
                    placeholder={currentChallenge.placeholder}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                  />

                  {/* Validation Feedback */}
                  {validationResult && !validationResult.passed && (
                    <div className="bg-red-900/20 border border-red-800/50 rounded-2xl p-4">
                      <p className="text-red-300 text-sm">{validationResult.feedback}</p>
                      <p className="text-red-400/70 text-xs mt-2">Score: {validationResult.score}/100</p>
                    </div>
                  )}

                  <button 
                    onClick={handleSubmitChallenge}
                    disabled={userAnswer.trim().length === 0 || isMinting}
                    className="w-full py-4 bg-indigo-600 rounded-full font-bold button-glow active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMinting ? 'Minting Badge...' : 'Seal on Soneium'}
                  </button>
                </div>
              )}

              {/* SUCCESS STATE */}
              {state === 'SUCCESS' && (
                <div className="glass rounded-[2.5rem] p-8 fade-in space-y-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Green Checkmark */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                    >
                      <Check className="w-12 h-12 text-white" />
                    </motion.div>

                    <h2 className="text-3xl font-bold tracking-tight">Skill Certified!</h2>

                    <p className="text-zinc-400 text-base leading-relaxed">
                      {farcasterContext.username ? `@${farcasterContext.username}` : 'You'}, your {currentChallenge.category} proficiency is now recorded{authenticated ? ' onchain' : ''}.
                    </p>

                    {/* Mint Error Display */}
                    {mintError && (
                      <div className="w-full bg-yellow-900/20 border border-yellow-800/50 rounded-2xl p-4">
                        <p className="text-yellow-300 text-sm">{mintError}</p>
                      </div>
                    )}

                    {/* Digital Certificate Card */}
                    <div className="w-full certificate-card metallic-shine rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-400" />
                          <p className="text-xs text-zinc-400 uppercase tracking-wide font-bold">DIGITAL CERTIFICATE</p>
                        </div>
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center border border-white/20">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Farcaster ID</p>
                          <p className="text-white text-xl font-bold tracking-tight">
                            {farcasterContext.fid || 'N/A'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Credential Number</p>
                          <p className="text-zinc-300 text-sm font-mono">
                            #{credentialNumber}
                          </p>
                        </div>

                        {mintResult?.txHash && (
                          <div className="pt-2 border-t border-white/10">
                            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Transaction Hash</p>
                            <a
                              href={`${SONEIUM_MINATO.blockExplorers.default.url}/tx/${mintResult.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 text-xs font-mono hover:text-indigo-300 break-all"
                            >
                              {mintResult.txHash.slice(0, 10)}...{mintResult.txHash.slice(-8)}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="w-full space-y-4">
                      <button
                        onClick={handleShareToFarcaster}
                        className="w-full py-4 bg-indigo-600 rounded-full font-bold button-glow active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-5 h-5" />
                        Share to Farcaster
                      </button>

                      <button
                        onClick={handleReset}
                        className="w-full py-3 bg-white/5 backdrop-blur-xl border border-white/10 text-zinc-400 font-medium rounded-full transition-all active:scale-95"
                      >
                        Try Another Challenge
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
            
            <p className="mt-12 text-[10px] font-black text-zinc-700 tracking-[0.4em] uppercase">
              Secured by Soneium Minato
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function App() {
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID
  
  if (!privyAppId) {
    console.error('VITE_PRIVY_APP_ID is not set. Please create a .env file with your Privy App ID.')
  }

  // Tell Farcaster the app is ready to be displayed
  useEffect(() => {
    sdk.actions.ready().catch((error) => {
      console.error('Failed to call sdk.actions.ready():', error)
    })
  }, [])

  return (
    <PrivyProvider
      appId={privyAppId || ''}
      config={{
        loginMethods: ['wallet', 'email', 'sms'],
        appearance: {
          theme: 'dark',
          accentColor: '#9333ea',
        },
        defaultChain: SONEIUM_MINATO,
        supportedChains: [SONEIUM_MINATO],
      }}
    >
      <AppContent />
    </PrivyProvider>
  )
}

export default App
