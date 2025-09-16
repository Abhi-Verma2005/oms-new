'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function SignUpForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      // First, create the user account
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Signup failed')
      
      // Then automatically sign in the user
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      
      if (signInResult?.error) {
        throw new Error('Signup successful but failed to sign in automatically')
      }
      
      router.push(data.redirectTo || '/onboarding-01')
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">Email Address <span className="text-red-500">*</span></label>
          <input id="email" className="form-input w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">Full Name <span className="text-red-500">*</span></label>
          <input id="name" className="form-input w-full" type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
          <input id="password" className="form-input w-full" type="password" autoComplete="on" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center justify-between mt-6">
        <div className="mr-1">
          <label className="flex items-center">
            <input type="checkbox" className="form-checkbox" />
            <span className="text-sm ml-2">Email me about product news.</span>
          </label>
        </div>
        <button type="submit" disabled={submitting} className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white ml-3 whitespace-nowrap">{submitting ? 'Creating...' : 'Sign Up'}</button>
      </div>
      {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
    </form>
  )
}



