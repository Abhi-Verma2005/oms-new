export const metadata = {
  title: 'Sign Up - Mosaic',
  description: 'Page description',
}

import Link from 'next/link'
import SignUpForm from './SignUpForm'
import AuthHeader from '../auth-header'
import AuthFeatures, { AuthFeaturesMobile } from '../auth-features'

export default function SignUp() {
  return (
    <main className="bg-white dark:bg-gray-900">

      <div className="relative md:flex">

        {/* Content */}
        <div className="md:w-1/2">
          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">

            <AuthHeader />

            <div className="max-w-xs mx-auto w-full px-4 py-6">
              <h1 className="text-2xl text-gray-800 dark:text-gray-100 font-bold mb-4">Create your Account</h1>
              {/* Form */}
              <SignUpForm />
              {/* Footer removed per request */}
            </div>

          </div>
        </div>

        {/* Mobile features below form */}
        <AuthFeaturesMobile />

        <AuthFeatures />

      </div>

    </main>
  )
}
