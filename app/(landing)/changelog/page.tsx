'use client'

import Link from 'next/link'
import Particles from '../../../components/particles'
import LandingFooter from '../../../components/landing-footer'

export default function ChangelogPage() {
  const changelogEntries = [
    {
      version: "2.1.0",
      date: "2024-01-15",
      type: "major",
      changes: [
        {
          type: "feature",
          title: "New Dashboard Analytics",
          description: "Added comprehensive analytics dashboard with real-time insights and customizable widgets."
        },
        {
          type: "feature", 
          title: "Advanced Search Filters",
          description: "Implemented powerful search filters with multiple criteria and saved search functionality."
        },
        {
          type: "improvement",
          title: "Performance Optimization",
          description: "Improved page load times by 40% through code splitting and lazy loading optimizations."
        }
      ]
    },
    {
      version: "2.0.5",
      date: "2024-01-08",
      type: "patch",
      changes: [
        {
          type: "bugfix",
          title: "Fixed Login Issues",
          description: "Resolved authentication problems that were affecting some users on mobile devices."
        },
        {
          type: "improvement",
          title: "Enhanced Mobile Experience",
          description: "Improved mobile responsiveness and touch interactions across all components."
        }
      ]
    },
    {
      version: "2.0.4",
      date: "2024-01-02",
      type: "patch",
      changes: [
        {
          type: "bugfix",
          title: "Data Export Fix",
          description: "Fixed issue where exported data was missing some fields in CSV format."
        },
        {
          type: "security",
          title: "Security Updates",
          description: "Applied latest security patches and improved input validation."
        }
      ]
    },
    {
      version: "2.0.3",
      date: "2023-12-20",
      type: "minor",
      changes: [
        {
          type: "feature",
          title: "Dark Mode Support",
          description: "Added comprehensive dark mode support across all pages and components."
        },
        {
          type: "feature",
          title: "Keyboard Shortcuts",
          description: "Implemented keyboard shortcuts for common actions to improve productivity."
        },
        {
          type: "improvement",
          title: "UI/UX Enhancements",
          description: "Updated design system with improved spacing, typography, and color schemes."
        }
      ]
    },
    {
      version: "2.0.2",
      date: "2023-12-10",
      type: "patch",
      changes: [
        {
          type: "bugfix",
          title: "Notification System Fix",
          description: "Fixed issue where notifications weren't being delivered to all users."
        },
        {
          type: "improvement",
          title: "Database Performance",
          description: "Optimized database queries resulting in 25% faster response times."
        }
      ]
    },
    {
      version: "2.0.1",
      date: "2023-12-01",
      type: "major",
      changes: [
        {
          type: "feature",
          title: "Team Collaboration Tools",
          description: "Added real-time collaboration features including shared workspaces and live editing."
        },
        {
          type: "feature",
          title: "API v2 Release",
          description: "Launched new REST API with improved endpoints and comprehensive documentation."
        },
        {
          type: "feature",
          title: "Integration Marketplace",
          description: "Created marketplace for third-party integrations with popular tools and services."
        }
      ]
    }
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'bugfix':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'improvement':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'security':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getVersionTypeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'minor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'patch':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-900 dark:text-white">
      {/* Main content with top padding to account for fixed navbar */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          {/* Particles animation */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10 w-64 h-64 -mt-24">
            <Particles className="absolute inset-0 -z-10" quantity={6} staticity={30} />
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="text-center pb-12">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-violet-600 via-violet-700 to-violet-800 bg-clip-text text-transparent">
                  Changelog
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                Stay up to date with the latest features, improvements, and fixes we're shipping.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/publishers"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 transition-colors duration-200"
                >
                  Try New Features
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Changelog Entries */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-12">
              {changelogEntries.map((entry, index) => (
                <div key={index} className="relative">
                  {/* Version Header */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVersionTypeColor(entry.type)}`}>
                        {entry.type.toUpperCase()}
                      </span>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        v{entry.version}
                      </h2>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(entry.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>

                  {/* Changes */}
                  <div className="space-y-4">
                    {entry.changes.map((change, changeIndex) => (
                      <div key={changeIndex} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start space-x-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(change.type)}`}>
                            {change.type.toUpperCase()}
                          </span>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {change.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                              {change.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Want to stay updated?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Subscribe to our newsletter to get notified about new releases and updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button className="px-6 py-3 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors duration-200">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
