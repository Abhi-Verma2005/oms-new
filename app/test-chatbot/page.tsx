"use client"

import React from 'react'
import { useAIChatbot } from '@/components/ai-chatbot-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Bot, MessageCircle } from 'lucide-react'

export default function TestChatbotPage() {
  const { openChatbot } = useAIChatbot()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <Bot className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Chatbot Test Page
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Test the AI chatbot functionality and navigation features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Try the Chatbot
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Click the floating chatbot icon in the bottom right corner or use the button below to test the AI assistant.
            </p>
            <Button onClick={openChatbot} className="w-full">
              <MessageCircle className="h-4 w-4 mr-2" />
              Open AI Chatbot
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Test Navigation
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try asking the AI to navigate to different pages like:
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• "Take me to the admin panel"</li>
              <li>• "Go to the users page"</li>
              <li>• "Show me the dashboard"</li>
              <li>• "Navigate to feedback management"</li>
            </ul>
          </Card>
        </div>

        <div className="mt-12">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Smart Navigation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The AI can understand natural language requests and navigate users to the correct pages.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Admin Management</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Admins can configure the system prompt and navigation routes through the admin panel.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Gemini Integration</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Powered by Google Gemini for intelligent responses and context understanding.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

