"use client"

import { useState } from "react"

export default function Page() {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function onRegister(e: any) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const beginRes = await fetch('/api/auth/passkey/register/begin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
      })
      const opts = await beginRes.json()
      if (!beginRes.ok) throw new Error(opts.error || 'Failed to start registration')

      let startRegistration: any = null
      try {
        const mod = await import("@simplewebauthn/browser")
        startRegistration = (mod as any).startRegistration
      } catch {
        throw new Error('Passkey support is not available in this build')
      }
      const att = await startRegistration(opts)

      const completeRes = await fetch('/api/auth/passkey/register/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, credential: att })
      })
      const j = await completeRes.json()
      if (!completeRes.ok) throw new Error(j.error || 'Failed to complete registration')
      setSuccess('Passkey registered successfully')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
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
              <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">Set up Passkey</h1>
              <p className="text-sm text-gray-500 mb-6">Create a passkey for passwordless sign-in on this device.</p>
              <form onSubmit={onRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="name">Passkey Name</label>
                  <input id="name" className="form-input w-full" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}
                {success && <div className="text-sm text-green-600">{success}</div>}
                <div className="flex justify-end">
                  <button type="submit" className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white" disabled={loading}>
                    {loading ? 'Registering…' : 'Register Passkey'}
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
