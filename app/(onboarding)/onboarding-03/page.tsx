"use client"

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingHeader from '../onboarding-header'
import OnboardingImage from '../onboarding-image'
import OnboardingProgress from '../onboarding-progress'

export default function Onboarding03() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [street, setStreet] = useState('')
  const [country, setCountry] = useState('USA')
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    try {
      const res = await fetch('/api/onboarding/step3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, city, postalCode, street, country }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      router.push(data.next || '/onboarding-04')
    } finally {
      setSaving(false)
    }
  }
  return (
    <main className="bg-white dark:bg-gray-900">

      <div className="relative flex">

        {/* Content */}
        <div className="w-full md:w-1/2">

          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">

            <div className="flex-1">

              <OnboardingHeader />
              <OnboardingProgress step={3} />

            </div>

            <div className="px-4 py-8">
              <div className="max-w-md mx-auto">

                <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">Company information</h1>
                {/* htmlForm */}
                <form onSubmit={(e) => { e.preventDefault(); submit() }}>
                  <div className="space-y-4 mb-8">
                    {/* Company Name */}
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="company-name">Company Name <span className="text-red-500">*</span></label>
                      <input id="company-name" className="form-input w-full" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                    {/* City and Postal Code */}
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1" htmlFor="city">City <span className="text-red-500">*</span></label>
                        <input id="city" className="form-input w-full" type="text" value={city} onChange={(e) => setCity(e.target.value)} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1" htmlFor="postal-code">Postal Code <span className="text-red-500">*</span></label>
                        <input id="postal-code" className="form-input w-full" type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                      </div>
                    </div>
                    {/* Street Address */}
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="street">Street Address <span className="text-red-500">*</span></label>
                      <input id="street" className="form-input w-full" type="text" value={street} onChange={(e) => setStreet(e.target.value)} />
                    </div>
                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="country">Country <span className="text-red-500">*</span></label>
                      <select id="country" className="form-select w-full" value={country} onChange={(e) => setCountry(e.target.value)}>
                        <option>USA</option>
                        <option>Italy</option>
                        <option>United Kingdom</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Link className="text-sm underline hover:no-underline" href="/onboarding-02">&lt;- Back</Link>
                    <button type="submit" disabled={saving} className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white ml-auto">{saving ? 'Saving...' : 'Next Step ->'}</button>
                  </div>
                </form>

              </div>
            </div>

          </div>

        </div>

        <OnboardingImage />

      </div>

    </main>
  )
}
