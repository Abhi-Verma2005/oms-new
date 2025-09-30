"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, CreditCard, Package, Filter, Bot } from 'lucide-react'

export default function TestAIFlowPage() {
  const testScenarios = [
    {
      title: "Complete Purchase Flow",
      description: "Test the full journey from filtering to payment completion",
      steps: [
        "1. Ask AI to find high DA sites for tech content",
        "2. AI will filter and show results",
        "3. AI will suggest adding items to cart",
        "4. AI will guide you to checkout",
        "5. After payment, AI will congratulate and show orders"
      ],
      icon: <ShoppingCart className="h-6 w-6" />
    },
    {
      title: "Cart Management",
      description: "Test cart operations through AI",
      steps: [
        "1. Ask 'What's in my cart?'",
        "2. Ask to add specific items",
        "3. Ask to remove items",
        "4. Ask for cart summary"
      ],
      icon: <Package className="h-6 w-6" />
    },
    {
      title: "Order Tracking",
      description: "Test order management through AI",
      steps: [
        "1. Ask 'Where's my order?'",
        "2. Ask for order details",
        "3. Ask to view all orders"
      ],
      icon: <CreditCard className="h-6 w-6" />
    },
    {
      title: "Smart Filtering",
      description: "Test intelligent filtering capabilities",
      steps: [
        "1. Ask for specific criteria (price, DA, niche)",
        "2. AI will apply appropriate filters",
        "3. AI will explain the results",
        "4. AI will suggest next steps"
      ],
      icon: <Filter className="h-6 w-6" />
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bot className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Enhanced AI Assistant Test</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Test the new smart AI assistant that can guide you through the complete e-commerce journey from discovery to purchase completion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {testScenarios.map((scenario, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    {scenario.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{scenario.title}</CardTitle>
                    <CardDescription>{scenario.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {scenario.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-purple-500 font-medium">{step.split('.')[0]}.</span>
                      <span>{step.split('. ')[1]}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-xl text-purple-800">How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Open the AI Assistant</p>
                  <p className="text-sm text-gray-600">Click the AI assistant button in the sidebar or use the chat interface</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Try the Test Scenarios</p>
                  <p className="text-sm text-gray-600">Use the scenarios above to test different AI capabilities</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium">Observe the Smart Flow</p>
                  <p className="text-sm text-gray-600">Watch how the AI proactively guides you through each step</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button 
            onClick={() => window.location.href = '/publishers'}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
          >
            Start Testing with Publishers Page
          </Button>
        </div>
      </div>
    </div>
  )
}

