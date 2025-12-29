/**
 * Challenge Management Utilities
 */

export interface Challenge {
  id: string
  title: string
  category: string
  prompt: string
  placeholder: string
  instructions: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'email-1',
    title: 'Business English: Professional Emailing',
    category: 'Business English',
    prompt: "Hey, the report is late. Sorry, will send it by Friday maybe?",
    placeholder: "Type your professional version here...",
    instructions: "When you have a Business English professional emailing challenge, read the email prompt and rewrite it in a professional tone.",
    difficulty: 'easy',
  },
  {
    id: 'email-2',
    title: 'Business English: Professional Emailing',
    category: 'Business English',
    prompt: "hey, can u send me that report? need it asap. thx",
    placeholder: "Type your professional version here...",
    instructions: "Rewrite this email in a more professional and courteous tone.",
    difficulty: 'easy',
  },
  {
    id: 'email-3',
    title: 'Business English: Professional Emailing',
    category: 'Business English',
    prompt: "yo, that meeting was a waste of time. we should just cancel next week's too.",
    placeholder: "Type your professional version here...",
    instructions: "Transform this casual message into a professional email that addresses concerns diplomatically.",
    difficulty: 'medium',
  },
  {
    id: 'presentation-1',
    title: 'Business Communication: Presentation Skills',
    category: 'Business Communication',
    prompt: "Create a brief introduction for a product launch presentation.",
    placeholder: "Write your presentation introduction here...",
    instructions: "Write a compelling 2-3 sentence introduction for a new product launch that engages the audience.",
    difficulty: 'medium',
  },
  {
    id: 'negotiation-1',
    title: 'Business Communication: Negotiation',
    category: 'Business Communication',
    prompt: "Draft a response to a client who wants a 50% discount on your services.",
    placeholder: "Write your professional response here...",
    instructions: "Compose a diplomatic email that maintains your pricing while preserving the client relationship.",
    difficulty: 'hard',
  },
]

export function getChallengeById(id: string): Challenge | undefined {
  return CHALLENGES.find(challenge => challenge.id === id)
}

export function getChallengesByCategory(category: string): Challenge[] {
  return CHALLENGES.filter(challenge => challenge.category === category)
}

export function getRandomChallenge(): Challenge {
  return CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)]
}

export function getChallengesByDifficulty(difficulty: Challenge['difficulty']): Challenge[] {
  return CHALLENGES.filter(challenge => challenge.difficulty === difficulty)
}

