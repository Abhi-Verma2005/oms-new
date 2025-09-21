'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function SignUpForm() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (!firstName || !lastName) {
        throw new Error('Please enter your first and last name')
      }
      if (!email) {
        throw new Error('Please enter your email')
      }
      if (!password) {
        throw new Error('Please enter a password')
      }
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }
      const name = `${firstName} ${lastName}`.trim()
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
      <div className="space-y-3 text-[13px]">
        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium mb-1" htmlFor="firstName">First Name <span className="text-red-500">*</span></label>
            <input id="firstName" className="form-input w-full py-2" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium mb-1" htmlFor="lastName">Last Name <span className="text-red-500">*</span></label>
            <input id="lastName" className="form-input w-full py-2" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="email">Email Address <span className="text-red-500">*</span></label>
          <input id="email" className="form-input w-full py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="password">Password <span className="text-red-500">*</span></label>
          <input id="password" className="form-input w-full py-2" type="password" autoComplete="on" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></label>
          <input id="confirmPassword" className="form-input w-full py-2" type="password" autoComplete="on" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn w-full mt-5 bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600">
        {submitting ? 'Creating...' : 'Register'}
      </button>

      <div className="mt-3 text-center text-xs text-gray-600 dark:text-gray-300">
        By clicking <span className="font-semibold">Register</span>, you agree to our{' '}
        <a href="#" className="underline">Terms of Service</a> and{' '}
        <a href="#" className="underline">Privacy Policy</a>.
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700/60" />
        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Already have an account?</div>
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700/60" />
      </div>

      <a href="/signin" className="btn w-full py-2 bg-white border border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-center">
        Sign in
      </a>

      {error && <div className="text-xs text-red-500 mt-3">{error}</div>}
    </form>
  )
}



