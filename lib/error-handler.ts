/**
 * Centralized error handling for AI chat endpoints
 * Sanitizes errors to prevent internal details from leaking to users
 */

export interface SanitizedError {
  userMessage: string
  technicalError?: string
  category: 'database' | 'api' | 'validation' | 'rate-limit' | 'timeout' | 'unknown'
}

/**
 * Sanitizes error messages to prevent internal details from leaking
 * Always returns user-friendly messages while logging technical details
 */
export function sanitizeError(error: unknown): SanitizedError {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  // Log full technical details server-side only
  console.error('❌ Technical Error:', errorMessage)
  if (errorStack) {
    console.error('Stack:', errorStack)
  }

  // Categorize errors
  if (errorMessage.includes('OpenAI API') || errorMessage.includes('API key')) {
    return {
      userMessage: 'I apologize, but I\'m having trouble connecting to the AI service right now. Please try again in a moment.',
      technicalError: errorMessage,
      category: 'api'
    }
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      userMessage: 'Your request is taking longer than expected. Please try again with a simpler query.',
      technicalError: errorMessage,
      category: 'timeout'
    }
  }

  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return {
      userMessage: 'Too many requests. Please wait a moment before trying again.',
      technicalError: errorMessage,
      category: 'rate-limit'
    }
  }

  if (errorMessage.includes('database') || errorMessage.includes('Prisma')) {
    return {
      userMessage: 'I\'m having trouble accessing the database. Please try again shortly.',
      technicalError: errorMessage,
      category: 'database'
    }
  }

  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return {
      userMessage: 'Please check your input and try again.',
      technicalError: errorMessage,
      category: 'validation'
    }
  }

  // Default generic message for unknown errors
  return {
    userMessage: 'Something went wrong. Please try again.',
    technicalError: errorMessage,
    category: 'unknown'
  }
}

/**
 * Returns user-friendly error message only (for responses)
 */
export function getUserFriendlyError(error: unknown): string {
  return sanitizeError(error).userMessage
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const category = sanitizeError(error).category
  return ['api', 'timeout', 'rate-limit'].includes(category)
}



