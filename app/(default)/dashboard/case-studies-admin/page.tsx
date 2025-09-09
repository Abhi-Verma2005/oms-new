'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface CaseStudy {
  id: string
  clientName: string
  industry: string
  campaignDuration: string
  startDate: string
  endDate?: string
  isActive: boolean
  trafficGrowth: number
  initialTraffic: number
  finalTraffic: number
  keywordsRanked: number
  backlinksPerMonth: number
  domainRatingStart?: number
  domainRatingEnd?: number
  objective: string
  challenge: string
  solution: string
  finalOutcomes: string
  serpFeatures: boolean
  aiOverview: boolean
  createdAt: string
  updatedAt: string
}

export default function CaseStudiesAdmin() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCaseStudy, setEditingCaseStudy] = useState<CaseStudy | null>(null)
  const [formData, setFormData] = useState({
    clientName: '',
    industry: '',
    campaignDuration: '',
    startDate: '',
    endDate: '',
    isActive: true,
    trafficGrowth: '',
    initialTraffic: '',
    finalTraffic: '',
    keywordsRanked: '',
    backlinksPerMonth: '',
    domainRatingStart: '',
    domainRatingEnd: '',
    objective: '',
    challenge: '',
    solution: '',
    finalOutcomes: '',
    serpFeatures: false,
    aiOverview: false,
  })

  useEffect(() => {
    fetchCaseStudies()
  }, [])

  const fetchCaseStudies = async () => {
    try {
      const response = await fetch('/api/case-studies')
      const data = await response.json()
      setCaseStudies(data)
    } catch (error) {
      console.error('Error fetching case studies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingCaseStudy 
        ? `/api/case-studies/${editingCaseStudy.id}`
        : '/api/case-studies'
      
      const method = editingCaseStudy ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchCaseStudies()
        setShowModal(false)
        setEditingCaseStudy(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving case study:', error)
    }
  }

  const handleEdit = (caseStudy: CaseStudy) => {
    setEditingCaseStudy(caseStudy)
    setFormData({
      clientName: caseStudy.clientName,
      industry: caseStudy.industry,
      campaignDuration: caseStudy.campaignDuration,
      startDate: caseStudy.startDate.split('T')[0],
      endDate: caseStudy.endDate ? caseStudy.endDate.split('T')[0] : '',
      isActive: caseStudy.isActive,
      trafficGrowth: caseStudy.trafficGrowth.toString(),
      initialTraffic: caseStudy.initialTraffic.toString(),
      finalTraffic: caseStudy.finalTraffic.toString(),
      keywordsRanked: caseStudy.keywordsRanked.toString(),
      backlinksPerMonth: caseStudy.backlinksPerMonth.toString(),
      domainRatingStart: caseStudy.domainRatingStart?.toString() || '',
      domainRatingEnd: caseStudy.domainRatingEnd?.toString() || '',
      objective: caseStudy.objective,
      challenge: caseStudy.challenge,
      solution: caseStudy.solution,
      finalOutcomes: caseStudy.finalOutcomes,
      serpFeatures: caseStudy.serpFeatures,
      aiOverview: caseStudy.aiOverview,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this case study?')) {
      try {
        const response = await fetch(`/api/case-studies/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          fetchCaseStudies()
        }
      } catch (error) {
        console.error('Error deleting case study:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      clientName: '',
      industry: '',
      campaignDuration: '',
      startDate: '',
      endDate: '',
      isActive: true,
      trafficGrowth: '',
      initialTraffic: '',
      finalTraffic: '',
      keywordsRanked: '',
      backlinksPerMonth: '',
      domainRatingStart: '',
      domainRatingEnd: '',
      objective: '',
      challenge: '',
      solution: '',
      finalOutcomes: '',
      serpFeatures: false,
      aiOverview: false,
    })
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading case studies...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
            Case Studies Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage EMIAC case studies and performance data
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCaseStudy(null)
            resetForm()
            setShowModal(true)
          }}
          className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Case Study
        </button>
      </div>

      {/* Case Studies Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">
            Case Studies ({caseStudies.length})
          </h2>
        </div>
        <div className="p-3">
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead className="text-xs uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-sm">
                <tr>
                  <th className="p-2 text-left">Client</th>
                  <th className="p-2 text-left">Industry</th>
                  <th className="p-2 text-left">Traffic Growth</th>
                  <th className="p-2 text-left">Keywords</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium divide-y divide-gray-100 dark:divide-gray-700">
                {caseStudies.map((caseStudy) => (
                  <tr key={caseStudy.id}>
                    <td className="p-2">
                      <div className="text-gray-800 dark:text-gray-100 font-medium">
                        {caseStudy.clientName}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-gray-600 dark:text-gray-300">
                        {caseStudy.industry}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400">
                        {caseStudy.trafficGrowth}%
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-gray-600 dark:text-gray-300">
                        {caseStudy.keywordsRanked.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        caseStudy.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400'
                      }`}>
                        {caseStudy.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(caseStudy)}
                          className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(caseStudy.id)}
                          className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {editingCaseStudy ? 'Edit Case Study' : 'Add New Case Study'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Campaign Duration
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.campaignDuration}
                    onChange={(e) => setFormData({ ...formData, campaignDuration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Traffic Growth (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.trafficGrowth}
                    onChange={(e) => setFormData({ ...formData, trafficGrowth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Initial Traffic (Lacs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.initialTraffic}
                    onChange={(e) => setFormData({ ...formData, initialTraffic: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Final Traffic (Lacs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.finalTraffic}
                    onChange={(e) => setFormData({ ...formData, finalTraffic: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Keywords Ranked
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.keywordsRanked}
                    onChange={(e) => setFormData({ ...formData, keywordsRanked: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Backlinks per Month
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.backlinksPerMonth}
                    onChange={(e) => setFormData({ ...formData, backlinksPerMonth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objective
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Challenge
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.challenge}
                  onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Solution
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Final Outcomes
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.finalOutcomes}
                  onChange={(e) => setFormData({ ...formData, finalOutcomes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-violet-600 shadow-sm focus:border-violet-300 focus:ring focus:ring-violet-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.serpFeatures}
                    onChange={(e) => setFormData({ ...formData, serpFeatures: e.target.checked })}
                    className="rounded border-gray-300 text-violet-600 shadow-sm focus:border-violet-300 focus:ring focus:ring-violet-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">SERP Features</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.aiOverview}
                    onChange={(e) => setFormData({ ...formData, aiOverview: e.target.checked })}
                    className="rounded border-gray-300 text-violet-600 shadow-sm focus:border-violet-300 focus:ring focus:ring-violet-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">AI Overview</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingCaseStudy(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700"
                >
                  {editingCaseStudy ? 'Update' : 'Create'} Case Study
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
