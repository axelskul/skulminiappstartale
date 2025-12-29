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
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* START State */}
        {state === 'START' && (
          <div className="flex flex-col space-y-8">
            {/* Icon */}
            <div className="flex justify-center pt-8">
              <div className="w-20 h-20 bg-purple-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
            </div>
            
            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-white">SKÜL</h1>
              <p className="text-white/70 text-sm">Proof-of-Skill v1.0</p>
            </div>

            {/* Active Challenge Box */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-xs text-white/60 uppercase tracking-wide mb-2">ACTIVE CHALLENGE</p>
              <p className="text-white text-lg font-medium">{currentChallenge.title}</p>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartChallenge}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              Start Challenge <ArrowRight className="w-5 h-5" />
            </button>

            {/* Privy Connection */}
            {!authenticated && (
              <button
                onClick={handleConnectPrivy}
                className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 font-medium py-3 px-6 rounded-xl transition-all duration-200"
              >
                Connect Wallet
              </button>
            )}
          </div>
        )}

        {/* CHALLENGE State */}
        {state === 'CHALLENGE' && (
          <div className="space-y-6">
            {/* Progress Bars */}
            <div className="space-y-2">
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1">
                <div 
                  className="bg-gray-600 h-1 rounded-full"
                  style={{ width: `${100 - progress}%` }}
                />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white">The Challenge</h2>

            {/* Instructions */}
            <p className="text-white/80 text-sm leading-relaxed">
              {currentChallenge.instructions}
            </p>

            {/* Prompt in Speech Bubble */}
            <div className="bg-purple-600 rounded-2xl p-4 relative">
              <div className="absolute -bottom-2 left-6 w-4 h-4 bg-purple-600 rotate-45"></div>
              <p className="text-white text-base leading-relaxed">"{currentChallenge.prompt}"</p>
            </div>

            {/* Text Area */}
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder={currentChallenge.placeholder}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none min-h-[200px] text-base"
            />

            {/* Validation Feedback */}
            {validationResult && !validationResult.passed && (
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
                <p className="text-red-300 text-sm">{validationResult.feedback}</p>
                <p className="text-red-400/70 text-xs mt-2">Score: {validationResult.score}/100</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmitChallenge}
              disabled={userAnswer.trim().length === 0 || isMinting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200"
            >
              {isMinting ? 'Minting Badge...' : 'Submit for Certification'}
            </button>
          </div>
        )}

        {/* SUCCESS State */}
        {state === 'SUCCESS' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
            {/* Green Checkmark */}
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-16 h-16 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white">Skill Certified!</h2>

            {/* Confirmation Message */}
            <p className="text-white/80 text-base">
              {farcasterContext.username ? `@${farcasterContext.username}` : 'You'}, your {currentChallenge.category} proficiency is now recorded onchain.
            </p>

            {/* Onchain Identity Box */}
            <div className="w-full bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3">
              <p className="text-xs text-white/60 uppercase tracking-wide text-left">ONCHAIN IDENTITY</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-white text-lg font-medium">
                    FID: {farcasterContext.fid || 'N/A'}
                  </p>
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              <p className="text-white/70 text-sm text-left">
                Credential #{credentialNumber}
              </p>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShareToFarcaster}
              className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share to Farcaster
            </button>

            {/* Try Another Button */}
            <button
              onClick={handleReset}
              className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 font-medium py-3 px-6 rounded-xl transition-all duration-200"
            >
              Try Another Challenge
            </button>
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

