/**
 * Answer Validation and Scoring Utilities
 */

export interface ValidationResult {
  score: number
  passed: boolean
  feedback: string
  details?: {
    lengthScore: number
    professionalismScore: number
    grammarScore: number
  }
}

/**
 * Validates and scores a user's answer
 */
export function validateAnswer(answer: string, _prompt: string, _challengeType: string = 'email'): ValidationResult {
  const trimmed = answer.trim()
  const lowerAnswer = trimmed.toLowerCase()
  
  let score = 0
  const details = {
    lengthScore: 0,
    professionalismScore: 0,
    grammarScore: 0,
  }
  
  let feedback = ''
  
  // Length check (20% of score)
  const minLength = 20
  const idealLength = 50
  if (trimmed.length < minLength) {
    feedback = 'Your response is too short. Professional communications should be more detailed.'
    return { score: 0, passed: false, feedback, details }
  }
  
  if (trimmed.length >= idealLength) {
    details.lengthScore = 20
    score += 20
  } else {
    details.lengthScore = Math.floor((trimmed.length / idealLength) * 20)
    score += details.lengthScore
  }
  
  // Professional indicators (40% of score)
  const professionalIndicators = [
    'dear', 'regards', 'sincerely', 'thank you', 'please', 'appreciate',
    'would', 'could', 'apologize', 'apology', 'regarding', 'concerning',
    'respectfully', 'best', 'kind regards', 'yours truly'
  ]
  
  const hasProfessionalIndicators = professionalIndicators.some(indicator => 
    lowerAnswer.includes(indicator)
  )
  
  if (hasProfessionalIndicators) {
    details.professionalismScore = 40
    score += 40
  } else {
    details.professionalismScore = 20
    score += 20
  }
  
  // Avoids casual language (30% of score)
  const casualWords = ['hey', 'hi', 'thx', 'u ', 'ur ', 'asap', 'maybe', 'sorry', 
    'yo', 'waste', 'cancel', 'just', 'gonna', 'wanna']
  const hasCasualWords = casualWords.some(word => lowerAnswer.includes(word))
  
  if (!hasCasualWords) {
    details.grammarScore = 30
    score += 30
  } else {
    const casualWordCount = casualWords.filter(word => lowerAnswer.includes(word)).length
    details.grammarScore = Math.max(0, 30 - (casualWordCount * 10))
    score += details.grammarScore
  }
  
  // Bonus points for structure (10% bonus)
  const hasGreeting = lowerAnswer.includes('dear') || lowerAnswer.includes('hello') || lowerAnswer.includes('good')
  const hasClosing = lowerAnswer.includes('regards') || lowerAnswer.includes('sincerely') || lowerAnswer.includes('best')
  
  if (hasGreeting && hasClosing) {
    score += 10
  }
  
  // Cap at 100
  score = Math.min(100, score)
  
  const passed = score >= 60
  
  if (!passed) {
    feedback = 'Try using more formal language, proper greetings, complete sentences, and professional closings.'
  } else if (score >= 80) {
    feedback = 'Excellent! Your email demonstrates strong professional communication skills.'
  } else {
    feedback = 'Good job! Your email is professional, though there\'s room for improvement in formality and structure.'
  }
  
  return { score, passed, feedback, details }
}

/**
 * Validates presentation-style answers
 */
export function validatePresentation(answer: string): ValidationResult {
  const trimmed = answer.trim()
  const minLength = 30
  
  if (trimmed.length < minLength) {
    return {
      score: 0,
      passed: false,
      feedback: 'Your introduction is too short. Aim for 2-3 engaging sentences.',
    }
  }
  
  let score = 0
  
  // Length (30%)
  if (trimmed.length >= 50) {
    score += 30
  } else {
    score += Math.floor((trimmed.length / 50) * 30)
  }
  
  // Engagement (40%)
  const engagingWords = ['excited', 'proud', 'innovative', 'transform', 'revolutionary', 'breakthrough']
  const hasEngagingWords = engagingWords.some(word => trimmed.toLowerCase().includes(word))
  if (hasEngagingWords) {
    score += 40
  } else {
    score += 20
  }
  
  // Clarity (30%)
  const hasClearStructure = trimmed.split('.').length >= 2
  if (hasClearStructure) {
    score += 30
  } else {
    score += 15
  }
  
  const passed = score >= 60
  const feedback = passed
    ? 'Great introduction! It\'s engaging and well-structured.'
    : 'Try to make your introduction more engaging and clear. Use action words and structure it well.'
  
  return { score, passed, feedback }
}

/**
 * Validates negotiation-style answers
 */
export function validateNegotiation(answer: string): ValidationResult {
  const trimmed = answer.trim()
  const minLength = 40
  
  if (trimmed.length < minLength) {
    return {
      score: 0,
      passed: false,
      feedback: 'Your response is too short. Negotiation requires detailed, diplomatic communication.',
    }
  }
  
  let score = 0
  
  // Length (25%)
  if (trimmed.length >= 80) {
    score += 25
  } else {
    score += Math.floor((trimmed.length / 80) * 25)
  }
  
  // Diplomacy (40%)
  const diplomaticWords = ['understand', 'appreciate', 'value', 'consider', 'explore', 'alternative', 'flexible']
  const diplomaticCount = diplomaticWords.filter(word => trimmed.toLowerCase().includes(word)).length
  score += Math.min(40, diplomaticCount * 10)
  
  // Maintains position (35%)
  const maintainsPosition = !trimmed.toLowerCase().includes('discount') || 
    trimmed.toLowerCase().includes('cannot') || 
    trimmed.toLowerCase().includes('unable') ||
    trimmed.toLowerCase().includes('alternative')
  
  if (maintainsPosition) {
    score += 35
  } else {
    score += 15
  }
  
  const passed = score >= 60
  const feedback = passed
    ? 'Excellent negotiation response! You maintained your position while being diplomatic.'
    : 'Try to be more diplomatic while clearly maintaining your pricing position. Offer alternatives when possible.'
  
  return { score, passed, feedback }
}

