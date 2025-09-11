'use client'

import { useEffect, useState } from 'react'

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  createdAt: string
  updatedAt: string
}

export default function AccountPanel() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [oldPassword, setOldPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [pwSaving, setPwSaving] = useState<boolean>(false)
  const [pwMsg, setPwMsg] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch('/api/user/profile')
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load profile')
        const j = await r.json()
        if (!active) return
        setProfile(j.user)
        setName(j.user?.name || '')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
    return () => { active = false }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error('Failed to update profile')
      const j = await res.json()
      setProfile(j.user)
      setSuccess('Saved')
      setTimeout(() => setSuccess(null), 1500)
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    setPwMsg(null)
    if (!oldPassword || !newPassword) {
      setPwMsg('Please fill both fields')
      return
    }
    if (newPassword.length < 8) {
      setPwMsg('New password must be at least 8 characters')
      return
    }
    setPwSaving(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Failed to update password')
      setPwMsg('Password updated')
      setOldPassword('')
      setNewPassword('')
    } catch (e: any) {
      setPwMsg(e.message || 'Failed to update password')
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div className="grow">
      <div className="p-6 space-y-6">
        <h2 className="text-2xl text-gray-800 dark:text-gray-100 font-bold mb-5">My Account</h2>

        {loading ? (
          <div className="space-y-8">
            {/* Personal Information skeleton */}
            <div>
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div>
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Password section skeleton */}
            <div>
              <div className="h-6 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}

            {/* Personal Info */}
            <section>
              <h3 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-1">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="name">Name</label>
                  <input id="name" className="form-input w-full" type="text" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
                  <input id="email" className="form-input w-full bg-gray-50 dark:bg-gray-900/20" type="email" value={profile?.email || ''} readOnly />
                </div>
              </div>
            </section>

            {/* Password change */}
            <section>
              <h3 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-1 mt-6">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="old-pw">Current Password</label>
                  <input id="old-pw" className="form-input w-full" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="new-pw">New Password</label>
                  <input id="new-pw" className="form-input w-full" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
              </div>
              {pwMsg && <div className={`text-sm mt-2 ${pwMsg.includes('updated') ? 'text-green-600' : 'text-red-500'}`}>{pwMsg}</div>}
              <div className="flex justify-end mt-4">
                <button className="btn border border-violet-200 dark:border-violet-700 bg-violet-500/10 text-violet-700 hover:bg-violet-500/20 dark:bg-violet-500/10 dark:hover:bg-violet-500/20 dark:text-violet-300" onClick={handlePasswordChange} disabled={pwSaving}>
                  {pwSaving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
      <footer>
        <div className="flex flex-col px-6 py-5 border-t border-gray-200 dark:border-gray-700/60">
          <div className="flex self-end">
            <button className="btn bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-700 text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-gray-900" onClick={() => {
              setName(profile?.name || '')
              setError(null)
              setSuccess(null)
            }}>Cancel</button>
            <button className="btn ml-3 border border-violet-200 dark:border-violet-700 bg-violet-500/10 text-violet-700 hover:bg-violet-500/20 dark:bg-violet-500/10 dark:hover:bg-violet-500/20 dark:text-violet-300" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}