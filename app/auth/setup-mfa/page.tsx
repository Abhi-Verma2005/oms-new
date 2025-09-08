"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export const metadata = {
  title: 'Set up MFA',
  description: 'Enable multi-factor authentication',
}

export default function Page() {
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  async function onSubmit(e: any) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Failed to verify token')
      setSuccess('MFA enabled successfully')
      setTimeout(() => router.push('/dashboard'), 800)
    } catch (err: any) {
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bg-white dark:bg-gray-900">
      <div className="relative md:flex">
        <div className="md:w-1/2 mx-auto">
          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">
            <div className="max-w-sm mx-auto w-full px-4 py-12">
              <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">Set up MFA</h1>
              <p className="text-sm text-gray-500 mb-6">Enter the 6-digit code from your authenticator app.</p>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="token">6-digit code</label>
                  <input id="token" className="form-input w-full" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={token} onChange={(e) => setToken(e.target.value)} required />
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}
                {success && <div className="text-sm text-green-600">{success}</div>}
                <div className="flex justify-end">
                  <button type="submit" className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white" disabled={loading}>
                    {loading ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
