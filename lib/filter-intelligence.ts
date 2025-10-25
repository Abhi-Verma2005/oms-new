import { ragSystem } from './rag-minimal'

/**
 * Enhanced filter validation with confidence scoring
 */
export interface FilterValidationResult {
  isValid: boolean
  confidence: number
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

/**
 * Simple but effective filter validation
 */
export function validateFilterWithConfidence(
  filters: Record<string, any>,
  userContext?: any
): FilterValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  let confidence = 1.0

  // Simple validation - only check for obvious errors
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue

    const numValue = Number(value)
    
    // DA/DR validation
    if (['daMin', 'daMax', 'drMin', 'drMax', 'spamMin', 'spamMax'].includes(key)) {
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        errors.push(`${key} must be between 0-100`)
        confidence -= 0.3
      }
    }
    
    // Price validation
    if (['priceMin', 'priceMax'].includes(key)) {
      if (isNaN(numValue) || numValue < 0) {
        errors.push(`${key} must be a positive number`)
        confidence -= 0.3
      }
    }
  }

  // Check for logical inconsistencies
  if (filters.daMin && filters.daMax && Number(filters.daMin) > Number(filters.daMax)) {
    errors.push('DA minimum cannot be greater than maximum')
    confidence -= 0.5
  }

  if (filters.priceMin && filters.priceMax && Number(filters.priceMin) > Number(filters.priceMax)) {
    errors.push('Price minimum cannot be greater than maximum')
    confidence -= 0.5
  }

  return {
    isValid: errors.length === 0,
    confidence: Math.max(0, Math.min(1, confidence)),
    errors,
    warnings,
    suggestions: []
  }
}

/**
 * Get filter confidence based on user history
 */
export async function getFilterConfidence(
  userId: string,
  filters: Record<string, any>
): Promise<number> {
  try {
    // Get user's filter history from RAG system
    const filterHistory = await ragSystem.searchDocuments(
      `filter history preferences ${userId}`,
      userId,
      10
    )

    if (filterHistory.length === 0) {
      return 0.5 // Default confidence for new users
    }

    // Find similar filter combinations
    const similarFilters = filterHistory.filter(h => {
      const historyFilters = h.metadata?.filters || {}
      const similarity = calculateFilterSimilarity(filters, historyFilters)
      return similarity > 0.7
    })

    if (similarFilters.length > 0) {
      // Boost confidence based on successful past usage
      const avgConfidence = similarFilters.reduce((sum, h) => 
        sum + (h.metadata?.confidence || 0.5), 0
      ) / similarFilters.length
      
      return Math.min(avgConfidence + 0.2, 1.0)
    }

    return 0.5 // Default confidence
  } catch (error) {
    console.warn('Failed to get filter confidence:', error)
    return 0.5
  }
}

/**
 * Calculate similarity between two filter objects
 */
function calculateFilterSimilarity(filters1: Record<string, any>, filters2: Record<string, any>): number {
  const keys1 = Object.keys(filters1)
  const keys2 = Object.keys(filters2)
  
  if (keys1.length === 0 && keys2.length === 0) return 1
  if (keys1.length === 0 || keys2.length === 0) return 0
  
  const commonKeys = keys1.filter(key => keys2.includes(key))
  const totalKeys = Math.max(keys1.length, keys2.length)
  
  const keySimilarity = commonKeys.length / totalKeys
  
  let valueSimilarity = 0
  for (const key of commonKeys) {
    if (filters1[key] === filters2[key]) {
      valueSimilarity += 1
    } else {
      // Check for numeric similarity (within 10% range)
      const num1 = Number(filters1[key])
      const num2 = Number(filters2[key])
      if (!isNaN(num1) && !isNaN(num2)) {
        const diff = Math.abs(num1 - num2) / Math.max(num1, num2)
        if (diff < 0.1) {
          valueSimilarity += 0.8
        }
      }
    }
  }
  
  const avgValueSimilarity = commonKeys.length > 0 ? valueSimilarity / commonKeys.length : 0
  
  return (keySimilarity * 0.6 + avgValueSimilarity * 0.4)
}

/**
 * Store filter decision in RAG system for future reference
 */
export async function storeFilterDecision(
  userId: string,
  filters: Record<string, any>,
  confidence: number,
  result: 'success' | 'failure'
): Promise<void> {
  try {
    const filterContext = `Filter applied: ${JSON.stringify(filters)} with confidence ${confidence.toFixed(2)}. Result: ${result}`
    
    await ragSystem.addDocument(
      filterContext,
      {
        filters,
        confidence,
        result,
        timestamp: new Date().toISOString(),
        type: 'filter_decision'
      },
      userId
    )
  } catch (error) {
    console.warn('Failed to store filter decision:', error)
  }
}
