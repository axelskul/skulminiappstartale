import { useState, useEffect } from 'react'
import sdk from '@farcaster/miniapp-sdk'
import { PrivyProvider, usePrivy } from '@privy-io/react-auth'
import { GraduationCap, Check, Shield, ArrowRight, Share2 } from 'lucide-react'
import { CHALLENGES, getRandomChallenge, type Challenge } from './utils/challenges'
import { validateAnswer, validatePresentation, validateNegotiation } from './utils/validation'
import { mintBadge, generateCredentialNumber, type BadgeMetadata } from './utils/badge'

type AppState = 'START' | 'CHALLENGE' | 'SUCCESS'

interface FarcasterContext {
  fid?: number
  username?: string
}

function AppContent() {
  const [state, setState] = useState<AppState>('START')
  const [userAnswer, setUserAnswer] = useState('')
  const [farcasterContext, setFarcasterContext] = useState<FarcasterContext>({})
  const [currentChallenge, setCurrentChallenge] = useState<Challenge>(CHALLENGES[0])
  const [credentialNumber, setCredentialNumber] = useState<string>('')
  const [validationResult, setValidationResult] = useState<{ score: number; passed: boolean; feedback: string } | null>(null)
  const [isMinting, setIsMinting] = useState(false)
  const { ready, authenticated, login } = usePrivy()

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
    // Randomly select a challenge
    const randomChallenge = getRandomChallenge()
    setCurrentChallenge(randomChallenge)
  }

  const handleSubmitChallenge = async () => {
    if (userAnswer.trim().length === 0) return
    
    // Validate the answer based on challenge type
    let result
    if (currentChallenge.id.includes('presentation')) {
      result = validatePresentation(userAnswer)
    } else if (currentChallenge.id.includes('negotiation')) {
      result = validateNegotiation(userAnswer)
    } else {
      result = validateAnswer(userAnswer, currentChallenge.prompt, 'email')
    }
    
    setValidationResult(result)
    
    if (result.passed) {
      // Generate credential number
      const credNum = generateCredentialNumber()
      setCredentialNumber(credNum)
      
      // Mint onchain badge
      if (farcasterContext.fid) {
        setIsMinting(true)
        try {
          const badgeMetadata: BadgeMetadata = {
            fid: farcasterContext.fid,
            challengeId: currentChallenge.id,
            credentialNumber: credNum,
            category: currentChallenge.category,
            timestamp: Date.now(),
            score: result.score,
          }
          
          const mintResult = await mintBadge(badgeMetadata)
          if (!mintResult.success) {
            console.error('Failed to mint badge:', mintResult.error)
            // Continue anyway - user still gets certified
          }
        } catch (error) {
          console.error('Error minting badge:', error)
        } finally {
          setIsMinting(false)
        }
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

  const progress = state === 'CHALLENGE' ? 50 : state === 'SUCCESS' ? 100 : 0

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#0D0D12] to-black text-white">
      <div className="mx-auto p-8 max-w-md">
        {/* START State */}
        {state === 'START' && (
          <div className="flex flex-col gap-6">
            {/* Icon */}
            <div className="flex justify-center pt-2">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg border border-indigo-500/20">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
            </div>
            
            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold tracking-wide text-white">SKÜL</h1>
              <p className="text-indigo-200 text-sm">Proof-of-Skill v1.0</p>
            </div>

            {/* Active Challenge Box */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-5 border border-indigo-500/20">
              <p className="text-xs text-indigo-200 uppercase tracking-wide mb-2">ACTIVE CHALLENGE</p>
              <p className="text-white text-lg font-bold">{currentChallenge.title}</p>
            </div>

            {/* Buttons with spacing */}
            <div className="space-y-4">
              {/* Start Button */}
              <button
                onClick={handleStartChallenge}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-full transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
              >
                Start Challenge <ArrowRight className="w-5 h-5" />
              </button>
              
              {/* Privy Connection */}
              {!authenticated && (
              <button
                onClick={handleConnectPrivy}
                  className="w-full bg-gray-900/50 hover:bg-gray-800/50 border border-indigo-500/20 text-indigo-200 font-medium py-3 px-6 rounded-full transition-all duration-200 backdrop-blur-sm"
              >
                  Connect Wallet
              </button>
              )}
            </div>
          </div>
        )}

        {/* CHALLENGE State */}
        {state === 'CHALLENGE' && (
          <div className="flex flex-col gap-6">
            {/* Progress Bars */}
            <div className="space-y-2 pt-2">
              <div className="w-full bg-gray-800/50 rounded-full h-2 backdrop-blur-sm border border-indigo-500/20">
                <div 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="w-full bg-gray-800/50 rounded-full h-1 backdrop-blur-sm border border-indigo-500/20">
                <div 
                  className="bg-gray-600 h-1 rounded-full"
                  style={{ width: `${100 - progress}%` }}
                />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold tracking-wide text-white">The Challenge</h2>

            {/* Instructions */}
            <p className="text-indigo-200 text-sm leading-relaxed">
              {currentChallenge.instructions}
            </p>

            {/* Prompt in Speech Bubble */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-5 relative shadow-lg border border-indigo-500/20">
              <div className="absolute -bottom-2 left-6 w-4 h-4 bg-gradient-to-r from-indigo-600 to-purple-600 rotate-45"></div>
              <p className="text-white text-base leading-relaxed font-medium">"{currentChallenge.prompt}"</p>
              </div>

            {/* Text Area */}
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
              placeholder={currentChallenge.placeholder}
              className="w-full bg-gray-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-3xl p-5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none min-h-[200px] text-base"
            />

            {/* Validation Feedback */}
            {validationResult && !validationResult.passed && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-3xl p-4 backdrop-blur-sm">
                <p className="text-red-300 text-sm">{validationResult.feedback}</p>
                <p className="text-red-400/70 text-xs mt-2">Score: {validationResult.score}/100</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                onClick={handleSubmitChallenge}
                disabled={userAnswer.trim().length === 0 || isMinting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-800 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-full transition-all duration-200 shadow-lg"
              >
                {isMinting ? 'Minting Badge...' : 'Submit for Certification'}
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS State */}
        {state === 'SUCCESS' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 pt-6">
            {/* Green Checkmark */}
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg border border-indigo-500/20">
              <Check className="w-16 h-16 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold tracking-wide text-white">Skill Certified!</h2>

            {/* Confirmation Message */}
            <p className="text-indigo-200 text-base px-2">
              {farcasterContext.username ? `@${farcasterContext.username}` : 'You'}, your {currentChallenge.category} proficiency is now recorded onchain.
            </p>

            {/* Onchain Identity Box */}
            <div className="w-full bg-gray-900/50 backdrop-blur-sm rounded-3xl p-5 border border-indigo-500/20 space-y-3">
              <p className="text-xs text-indigo-200 uppercase tracking-wide text-left font-bold">ONCHAIN IDENTITY</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-white text-lg font-bold">
                    FID: {farcasterContext.fid || 'N/A'}
                  </p>
                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center border border-indigo-500/20">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              <p className="text-indigo-200 text-sm text-left">
                Credential #{credentialNumber}
              </p>
            </div>

            {/* Buttons with spacing */}
            <div className="w-full space-y-4">
              {/* Share Button */}
              <button
                onClick={handleShareToFarcaster}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-full transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
              >
                <Share2 className="w-5 h-5" />
                Share to Farcaster
              </button>

              {/* Try Another Button */}
            <button
              onClick={handleReset}
                className="w-full bg-gray-900/50 hover:bg-gray-800/50 border border-indigo-500/20 text-indigo-200 font-medium py-3 px-6 rounded-full transition-all duration-200 backdrop-blur-sm"
            >
              Try Another Challenge
            </button>
            </div>
          </div>
        )}
      </div>
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
      }}
    >
      <AppContent />
    </PrivyProvider>
  )
}

export default App

