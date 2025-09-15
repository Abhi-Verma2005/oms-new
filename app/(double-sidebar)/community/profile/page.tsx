export const metadata = {
  title: 'Profile - Mosaic',
  description: 'Page description',
}

import { FlyoutProvider } from '@/app/flyout-context'
import ProfileSidebar from './profile-sidebar'
import ProfileBody from './profile-body'
import { Suspense } from 'react'

function ProfileContent() {
  return (
    <div className="relative flex">

      {/* Profile sidebar */}
      <ProfileSidebar />

      {/* Profile body */}
      <ProfileBody />

    </div>
  )
}

export default function Profile() {
  return (
    <FlyoutProvider>
      <Suspense fallback={null}>
        <ProfileContent />
      </Suspense>
    </FlyoutProvider>
  )
}