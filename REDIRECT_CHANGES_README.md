# Landing Page Redirect Changes - Reversion Guide

This document summarizes all changes made to redirect users away from landing pages and make `/publishers` the default page for authenticated users. Use this guide to revert these changes in the future.

## Overview of Changes

The following changes were implemented to:
1. Make `/publishers` the default page for authenticated users
2. Redirect unauthenticated users to `/signin`
3. Make all landing pages inaccessible to normal users
4. Remove the "Pages" navigation from the header

## Files Modified

### 1. `/app/(auth)/signin/page.tsx`
**Purpose**: Update default redirect after login to `/publishers`

**Changes Made**:
- Line 59: Changed `window.location.href = '/dashboard'` to `window.location.href = '/publishers'`
- Line 129: Changed Google OAuth callback URL from `/dashboard` to `/publishers`

**To Revert**:
```typescript
// Change back to:
window.location.href = '/dashboard'
// And:
const callbackUrl = pendingQuery ? '/publishers?sidebar=open' : '/dashboard'
```

### 2. `/middleware.ts`
**Purpose**: Add redirect logic for landing pages and hidden pages

**Changes Made**:
- Added `landingPages` array with all landing page routes
- Added redirect logic for landing pages (lines 46-55)
- Added redirect logic for hidden pages (lines 57-60)

**To Revert**:
- Remove the `landingPages` array (lines 34-38)
- Remove the landing pages redirect logic (lines 46-55)
- Remove the hidden pages redirect logic (lines 57-60)
- Keep only the original protected routes logic

### 3. `/components/ui/header.tsx`
**Purpose**: Remove the "Pages" navigation dropdown from the header

**Changes Made**:
- Removed `pagesOpen` and `pagesTimeoutId` state variables
- Removed `handlePagesMouseEnter` and `handlePagesMouseLeave` functions
- Removed the entire Pages dropdown JSX (lines 155-177)
- Removed cleanup useEffect for pages timeout

**To Revert**:
- Add back the state variables:
```typescript
const [pagesOpen, setPagesOpen] = useState<boolean>(false)
const [pagesTimeoutId, setPagesTimeoutId] = useState<NodeJS.Timeout | null>(null)
```
- Add back the mouse event handlers
- Add back the Pages dropdown JSX in the navigation section
- Add back the cleanup useEffect

### 4. `/app/(onboarding)/onboarding-05/page.tsx`
**Purpose**: Update final onboarding step to only redirect to `/publishers`

**Changes Made**:
- Line 48-50: Removed "Go to Dashboard" button, kept only "Get Started" button that goes to `/publishers`

**To Revert**:
```tsx
<div className="flex items-center justify-center space-x-4">
  <Link className="btn bg-violet-600 text-white hover:bg-violet-500" href="/publishers">Go to Publishers</Link>
  <Link className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white" href="/dashboard">Go to Dashboard</Link>
</div>
```

### 5. `/app/page.tsx`
**Purpose**: Redirect all users away from the landing page

**Changes Made**:
- Added `useEffect` import to React imports
- Added useEffect hook (lines 125-136) that redirects:
  - Authenticated users to `/publishers`
  - Unauthenticated users to `/signin`

**To Revert**:
- Remove `useEffect` from React imports
- Remove the entire useEffect hook (lines 125-136)
- The landing page will then display normally for all users

## Complete Reversion Steps

To completely revert all changes:

1. **Restore landing page access**:
   - Remove the useEffect redirect logic from `/app/page.tsx`
   - Remove the landing pages redirect logic from `/middleware.ts`

2. **Restore dashboard as default**:
   - Change login redirects back to `/dashboard` in `/app/(auth)/signin/page.tsx`
   - Update onboarding final step to show both options

3. **Restore Pages navigation**:
   - Add back the Pages dropdown in `/components/ui/header.tsx`
   - Restore all related state and event handlers

4. **Remove hidden pages logic**:
   - Remove the `hiddenPages` redirect logic from `/middleware.ts`

## Testing After Reversion

After reverting changes, verify:
1. Landing page displays for unauthenticated users
2. Login redirects to `/dashboard` by default
3. Pages navigation appears in header
4. Landing pages are accessible to all users
5. Onboarding shows both "Go to Publishers" and "Go to Dashboard" options

## Original Behavior

Before these changes:
- Landing page was accessible to all users
- Login redirected to `/dashboard`
- Pages navigation was visible in header
- Landing pages were accessible to all users
- Onboarding completion offered both dashboard and publishers options

## Current Behavior

After these changes:
- Landing page redirects all users away
- Login redirects to `/publishers`
- Pages navigation is hidden
- Landing pages redirect users away
- Onboarding completion only offers publishers option

---

**Note**: This document was created on the date of implementation. If additional changes are made to these files, update this document accordingly.
