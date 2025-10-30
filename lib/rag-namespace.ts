export function getNamespace(type: 'publishers' | 'documents', userId?: string): string {
  if (type === 'publishers') {
    return 'publishers' // Default namespace for publisher data
  }
  if (type === 'documents' && userId) {
    return `user_${userId}_docs` // Isolated namespace per user for documents
  }
  throw new Error('Invalid namespace configuration')
}

