'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'

interface HomepageCaseStudy {
  id: string
  title: string
  subtitle: string
  imageSrc: string
  category: string
  isActive: boolean
  displayOrder: number
  stats: Array<{ value: string; label: string }>
  link?: string
  createdAt: string
  updatedAt: string
}

export default function ManageCaseStudies() {
  const [caseStudies, setCaseStudies] = useState<HomepageCaseStudy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCaseStudy, setEditingCaseStudy] = useState<Partial<HomepageCaseStudy>>({})
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set())

  // Load case studies
  useEffect(() => {
    fetchCaseStudies()
  }, [])

  const fetchCaseStudies = async () => {
    try {
      const response = await fetch('/api/homepage-case-studies')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setCaseStudies(data)
        setError(null)
      } else {
        console.error('Invalid data format:', data)
        setCaseStudies([])
        setError('Invalid data format received')
      }
    } catch (error) {
      console.error('Error fetching case studies:', error)
      setCaseStudies([])
      setError(error instanceof Error ? error.message : 'Failed to fetch case studies')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (caseStudy: HomepageCaseStudy) => {
    setEditingCaseStudy(caseStudy)
    setIsEditing(caseStudy.id)
  }

  const handleSave = async () => {
    try {
      if (editingCaseStudy.id) {
        // Update existing
        const response = await fetch(`/api/homepage-case-studies/${editingCaseStudy.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingCaseStudy)
        })
        
        if (response.ok) {
          await fetchCaseStudies()
          setIsEditing(null)
          setEditingCaseStudy({})
        }
      } else {
        // Create new
        const response = await fetch('/api/homepage-case-studies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingCaseStudy)
        })
        
        if (response.ok) {
          await fetchCaseStudies()
          setShowAddForm(false)
          setEditingCaseStudy({})
        }
      }
    } catch (error) {
      console.error('Error saving case study:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this case study?')) return

    try {
      const response = await fetch(`/api/homepage-case-studies/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchCaseStudies()
      }
    } catch (error) {
      console.error('Error deleting case study:', error)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/homepage-case-studies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })
      
      if (response.ok) {
        await fetchCaseStudies()
      }
    } catch (error) {
      console.error('Error toggling case study status:', error)
    }
  }

  const addNewCaseStudy = () => {
    setEditingCaseStudy({
      title: '',
      subtitle: '',
      imageSrc: '',
      category: '',
      stats: [{ value: '', label: '' }],
      link: '',
      displayOrder: caseStudies.length,
      isActive: true
    })
    setShowAddForm(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Case Studies
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={fetchCaseStudies}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-violet-700 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Homepage Case Studies</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Add, edit, or remove case studies that appear on the homepage
        </p>
      </div>

      {/* Add New Button */}
      <div className="mb-6">
        <button
          onClick={addNewCaseStudy}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-violet-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Case Study
        </button>
      </div>

      {/* Case Studies List */}
      <div className="space-y-6">
        {Array.isArray(caseStudies) && caseStudies.map((caseStudy, index) => (
          <motion.div
            key={caseStudy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-white">
                    <Image
                      src={brokenImages.has(caseStudy.id) ? '/favicon.ico' : (caseStudy.imageSrc || '/favicon.ico')}
                      alt={caseStudy.title}
                      fill
                      sizes="64px"
                      unoptimized
                      referrerPolicy="no-referrer"
                      onError={() => {
                        setBrokenImages((prev) => {
                          const next = new Set(prev)
                          next.add(caseStudy.id)
                          return next
                        })
                      }}
                      className="object-contain p-1"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {caseStudy.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{caseStudy.subtitle}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                        {caseStudy.category}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        caseStudy.isActive 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {caseStudy.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(caseStudy.id, caseStudy.isActive)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      caseStudy.isActive
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                    }`}
                  >
                    {caseStudy.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleEdit(caseStudy)}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(caseStudy.id)}
                    className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {caseStudy.stats.map((stat, statIndex) => (
                  <div key={statIndex} className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {caseStudy.link && (
                <div className="mt-4">
                  <a
                    href={caseStudy.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium"
                  >
                    View Full Case Study →
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        
        {Array.isArray(caseStudies) && caseStudies.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No case studies found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get started by adding your first case study.
            </p>
            <button
              onClick={addNewCaseStudy}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-violet-700 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Your First Case Study
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddForm || isEditing) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {isEditing ? 'Edit Case Study' : 'Add New Case Study'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editingCaseStudy.title || ''}
                  onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={editingCaseStudy.subtitle || ''}
                  onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={editingCaseStudy.imageSrc || ''}
                  onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, imageSrc: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={editingCaseStudy.category || ''}
                  onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Category</option>
                  <option value="Finance">Finance</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Technology">Technology</option>
                  <option value="E-commerce">E-commerce</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link (Optional)
                </label>
                <input
                  type="url"
                  value={editingCaseStudy.link || ''}
                  onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={editingCaseStudy.displayOrder || 0}
                  onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Stats */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stats
                </label>
                <div className="space-y-2">
                  {(editingCaseStudy.stats || []).map((stat, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Value (e.g., 933%)"
                        value={stat.value}
                        onChange={(e) => {
                          const newStats = [...(editingCaseStudy.stats || [])]
                          newStats[index] = { ...stat, value: e.target.value }
                          setEditingCaseStudy({ ...editingCaseStudy, stats: newStats })
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Label (e.g., Increase in traffic)"
                        value={stat.label}
                        onChange={(e) => {
                          const newStats = [...(editingCaseStudy.stats || [])]
                          newStats[index] = { ...stat, label: e.target.value }
                          setEditingCaseStudy({ ...editingCaseStudy, stats: newStats })
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => {
                          const newStats = (editingCaseStudy.stats || []).filter((_, i) => i !== index)
                          setEditingCaseStudy({ ...editingCaseStudy, stats: newStats })
                        }}
                        className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newStats = [...(editingCaseStudy.stats || []), { value: '', label: '' }]
                      setEditingCaseStudy({ ...editingCaseStudy, stats: newStats })
                    }}
                    className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    Add Stat
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setIsEditing(null)
                  setEditingCaseStudy({})
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all duration-300"
              >
                {isEditing ? 'Update' : 'Create'} Case Study
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
