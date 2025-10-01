// 'use client'

// import Image from 'next/image'
// import Link from 'next/link'
// import Particles from '../../../components/particles'
// import Features02 from '../../../components/features-02'
// import Features03 from '../../../components/features-03'
// import Features04 from '../../../components/features-04'
// import Cta from '../../../components/cta'
// import LandingFooter from '../../../components/landing-footer'
// import InsightsSection from '../../../components/insights-section'

// export default function AboutPage() {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-900 dark:text-white">
//       {/* Main content with top padding to account for fixed navbar */}
//       <div className="pt-16">
//         {/* Hero Section */}
//         <section className="relative py-20 px-4 sm:px-6 lg:px-8">
//           {/* Particles animation */}
//           <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10 w-64 h-64 -mt-24">
//             <Particles className="absolute inset-0 -z-10" quantity={6} staticity={30} />
//           </div>

//           <div className="max-w-6xl mx-auto">
//             <div className="text-center pb-12">
//               <h1 className="text-5xl md:text-6xl font-bold mb-6">
//                 <span className="bg-gradient-to-r from-violet-600 via-violet-700 to-violet-800 bg-clip-text text-transparent">
//                   About Us
//                 </span>
//               </h1>
//               <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
//                 We're building the future of digital experiences with cutting-edge technology and innovative solutions.
//               </p>
//               <div className="flex flex-col sm:flex-row gap-4 justify-center">
//                 <Link
//                   href="/publishers"
//                   className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-200"
//                 >
//                   Get Started
//                 </Link>
//                 <Link
//                   href="/pricing"
//                   className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
//                 >
//                   View Pricing
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Mission Section */}
//         <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
//           <div className="max-w-6xl mx-auto">
//             <div className="text-center mb-16">
//               <h2 className="text-4xl font-bold mb-6">
//                 <span className="bg-gradient-to-r from-violet-600 via-violet-700 to-violet-800 bg-clip-text text-transparent">
//                   Our Mission
//                 </span>
//               </h2>
//               <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
//                 To empower businesses and individuals with powerful, intuitive tools that simplify complex workflows and drive meaningful results.
//               </p>
//             </div>
            
//             <div className="grid md:grid-cols-3 gap-8">
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                   </svg>
//                 </div>
//                 <h3 className="text-xl font-semibold mb-2">Innovation</h3>
//                 <p className="text-gray-600 dark:text-gray-300">We constantly push the boundaries of what's possible with technology.</p>
//               </div>
              
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
//                   </svg>
//                 </div>
//                 <h3 className="text-xl font-semibold mb-2">Passion</h3>
//                 <p className="text-gray-600 dark:text-gray-300">We're passionate about creating solutions that make a real difference.</p>
//               </div>
              
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 </div>
//                 <h3 className="text-xl font-semibold mb-2">Excellence</h3>
//                 <p className="text-gray-600 dark:text-gray-300">We strive for excellence in everything we do, from code to customer service.</p>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Features Section */}
//         <Features02 />

//         {/* More Features */}
//         <Features03 />

//         {/* Why Trust Us */}
//         <Features04 />

//         {/* Insights Section */}
//         <InsightsSection />

//         {/* CTA Section */}
//         <Cta />
//       </div>

//       {/* Footer */}
//       <LandingFooter />
//     </div>
//   )
// }

import About from '@/components/About'
import React from 'react'

const page = () => {
  return (
    <div>
      <About />
    </div>
  )
}

export default page

