'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import UnifiedNavbar from "@/components/ui/unified-navbar"
import { useSearchToChatStore } from '@/stores/search-to-chat-store'
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards"
import { Spotlight } from "@/components/ui/spotlight"
import { motion, useScroll, useTransform } from 'framer-motion'
import BarChart01 from "@/components/charts/bar-chart-01"
import LineChart01 from "@/components/charts/line-chart-01"
import DoughnutChart from "@/components/charts/doughnut-chart"
import LandingUserMenu from "@/components/landing-user-menu"
import { DynamicInsightsSection } from "@/components/dynamic-insights-section"
import { TestimonialCard } from "@/components/ui/testimonial-card"

const testimonials = [
  {
    quote: "Mosaic Next became an asset to our needs as an ecommerce platform. They helped us capture media attention that drove increased popularity and sales results within a few months. They are proactive in helping you find the right placements for your brand and posting quality content that attracts interest from real readers. They are real go-to vendors for your online presence.",
    name: "Jonathan Alonso",
    title: "CNCMachines.com"
  },
  {
    quote: "We are incredibly happy with the quality and efficiency of Mosaic Next's work - from selecting contacts to getting our content written and published. I highly recommend their services to anyone looking to enhance their outreach and build their professional network.",
    name: "Sumit Datta",
    title: "Edureka"
  },
  {
    quote: "The quality of content and response rate has been exceptional. They truly understand the digital landscape and I will gladly refer them to anyone looking for professional outreach services.",
    name: "Nenad K.",
    title: "Insight Digital"
  },
  {
    quote: "Outstanding service and results! Mosaic Next helped us build meaningful connections that directly impacted our business growth. Their approach is professional and results-driven.",
    name: "Sarah Johnson",
    title: "TechStart Inc."
  },
  {
    quote: "The team at Mosaic Next understands the art of networking. They've helped us establish valuable partnerships that we couldn't have achieved on our own. Highly recommended!",
    name: "Michael Chen",
    title: "Digital Solutions"
  },
  {
    quote: "Working with Mosaic Next has been a game-changer for our outreach strategy. Their expertise in connecting with the right people at the right time is unmatched.",
    name: "Emily Rodriguez",
    title: "Growth Marketing Co."
  }
];

const clientTestimonials = [
  {
    id: 1,
    name: "Nitesh",
    role: "Sr. Marketing Manager",
    quote:
      "EMIAC did an amazing job creating and publishing our Wikipedia page. The research was thorough, and the process was super smooth. Felt like they really understood our brand story. Highly recommend!",
    achievement: "Wikipedia Writing & Publishing",
    logoSrc:
      "https://emiactech.com/wp-content/uploads/2025/09/ACKO-DRIVE-BLACK-LOGO-1.png",
  },
  {
    id: 2,
    name: "Shailesh",
    role: "SEO Manager",
    quote:
      "EMIAC’s SEO blog writing boosted our organic traffic by 35%! They really know how to craft content that connects. Our website is now performing way better, and we’ve seen tangible results.",
    achievement: "Web Pages & SEO Blogs Writing",
    logoSrc: "https://emiactech.com/wp-content/uploads/2025/09/17-1-1.png",
  },
  {
    id: 3,
    name: "Srashti",
    role: "SEO Head",
    quote:
      "Thanks to EMIAC, our brand got massive exposure on top beauty domains! Our visibility shot up, and they kept us in the loop throughout the process. They really know how to leverage the right platforms for maximum impact. ♥",
    achievement: "Publishing on Top Beauty Domains",
    logoSrc: "https://emiactech.com/wp-content/uploads/2025/09/19-3-1.png",
  },
  {
    id: 4,
    name: "Nousheer",
    role: "Sr. Director SEO",
    quote:
      "I was blown away by the results! Our traffic increased by 209% in just 3 months thanks to EMIAC’s SEO strategy. They really know their stuff, and they delivered exactly what they promised. Definitely worth the investment!",
    achievement: "Off Page SEO Strategising",
    logoSrc: "https://emiactech.com/wp-content/uploads/2025/09/7-1-1.png",
  },
  {
    id: 5,
    name: "Deepak",
    role: "Content Head",
    quote:
      "I was blown away by the results! Our traffic increased by 209% in just 3 months thanks to EMIAC’s SEO strategy. They really know their stuff, and they delivered exactly what they promised. Definitely worth the investment!",
    achievement: "Top Rankings in Google SERPs",
    logoSrc: "https://emiactech.com/wp-content/uploads/2025/09/5-2.png",
  },
  {
    id: 6,
    name: "Sainath",
    role: "Content Manager",
    quote:
      "EMIAC’s SEO blogs have been a game-changer for us. The content is spot-on and drives results. They’re thorough, creative, and really helped boost our rankings. Couldn’t be happier with the quality!",
    achievement: "High-Quality SEO Blogs",
    logoSrc: "https://emiactech.com/wp-content/uploads/2025/09/24.png",
  },
]

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();
  const { setPendingQuery, setAutoSend, setRedirecting, isRedirecting } = useSearchToChatStore();

  // Framer Motion scroll-based animation for the App Preview block
  const appPreviewRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: appPreviewRef,
    offset: ['start 80%', 'end 20%'],
  });
  const appPreviewScale = useTransform(scrollYProgress, [0, 1], [0.98, 1.02]);

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;

    // Set loading state
    setRedirecting(true);

    try {
      if (status === 'loading') {
        // Still loading, wait a bit
        setTimeout(() => handleSearchSubmit(), 500);
        return;
      }

      if (!session) {
        // User not authenticated, store query and redirect to signin
        setPendingQuery(searchQuery.trim());
        router.push('/signin');
        return;
      }

      // User is authenticated, redirect to publishers with sidebar open
      setAutoSend(true, searchQuery.trim());
      router.push('/publishers?sidebar=open');
    } catch (error) {
      console.error('Error handling search submit:', error);
      setRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-900 dark:text-white">

      {/* Navigation */}
      <div className="relative flex flex-col">
        <UnifiedNavbar variant="landing" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Spotlight effect - Dark Mode */}
        <Spotlight
          className="-top-60 left-2/5 transform -translate-x-1/2 hidden dark:block opacity-40"
          fill="white"
          fillOpacity="0.3"
        />
        {/* <Spotlight
          className="-top-60 left-2/5 transform -translate-x-1/2 dark:hidden"
          fill="#7c3aed"
        /> */}
        {/* Debug purple spotlight - always visible in light mode */}
        <Spotlight
          className="-top-60 left-2/5 transform -translate-x-1/2 dark:hidden opacity-45"
          fill="#7c3aed"
          fillOpacity="0.25"
        />
        <div className="max-w-7xl mx-auto text-center relative z-20">
          <div className="mb-8">
            <span className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-800">
              ✨ Introducing AI Search
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8">
            <span className="text-gray-900 dark:text-white">The world's most</span>
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              trusted outreach platform
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            Connect with talented professionals worldwide. Find the perfect contacts for your outreach campaign 
            or discover your next great business opportunity.
          </p>
          
          {/* Exact Match Search Interface */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              {/* Main search container - sleek rounded rectangle with spotlight-illuminated borders */}
              <div 
                className="relative bg-gray-200 dark:bg-gray-800 rounded-2xl p-6 min-h-[80px] flex flex-col shadow-sm hover:shadow-md focus-within:shadow-lg transition-all duration-200 border border-gray-300 dark:border-gray-700"
                style={{
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Arc spotlight border effect - top edge (Light Mode) */}
                <div
                  className="dark:hidden"
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    right: '-2px',
                    height: '4px',
                    background: 'linear-gradient(90deg, #c084fc 0%, #d8b4fe 10%, #e9d5ff 20%, #f3e8ff 30%, #e9d5ff 35%, #d8b4fe 50%, #c084fc 70%, transparent 95%)',
                    borderRadius: '16px 16px 16px 16px',
                    zIndex: 1,
                    animation: 'spotlight-top-flow 3s ease-in-out infinite',
                    boxShadow: '0 0 8px rgba(216, 180, 254, 0.6), 0 0 16px rgba(201, 132, 252, 0.4)'
                  }}
                />
                {/* Arc spotlight border effect - top edge (Dark Mode) */}
                <div
                  className="hidden dark:block"
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    right: '-2px',
                    height: '4px',
                    background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.4) 0%, rgba(248, 250, 252, 0.3) 10%, rgba(241, 245, 249, 0.3) 20%, rgba(226, 232, 240, 0.2) 30%, rgba(241, 245, 249, 0.3) 35%, rgba(248, 250, 252, 0.3) 50%, rgba(255, 255, 255, 0.4) 70%, transparent 95%)',
                    borderRadius: '16px',
                    zIndex: 1,
                    animation: 'spotlight-top-flow-white 3s ease-in-out infinite',
                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.3), 0 0 16px rgba(248, 250, 252, 0.2)'
                  }}
                />
                {/* Arc spotlight border effect - left edge (Light Mode) */}
                <div
                  className="dark:hidden"
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    bottom: '-2px',
                    width: '4px',
                    background: 'linear-gradient(180deg, #c084fc 0%, #d8b4fe 15%, #e9d5ff 30%, #f3e8ff 40%, #e9d5ff 50%, #d8b4fe 70%, transparent 100%)',
                    borderRadius: '16px 0 0 16px',
                    zIndex: 1,
                    animation: 'spotlight-left-flow 3s ease-in-out infinite',
                    boxShadow: '0 0 8px rgba(216, 180, 254, 0.6), 0 0 16px rgba(201, 132, 252, 0.4)'
                  }}
                />
                {/* Arc spotlight border effect - left edge (Dark Mode) */}
                <div
                  className="hidden dark:block"
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    bottom: '-2px',
                    width: '4px',
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(248, 250, 252, 0.3) 15%, rgba(241, 245, 249, 0.3) 30%, rgba(226, 232, 240, 0.2) 40%, rgba(241, 245, 249, 0.3) 50%, rgba(248, 250, 252, 0.3) 70%, transparent 100%)',
                    borderRadius: '16px 0 0 16px',
                    zIndex: 1,
                    animation: 'spotlight-left-flow-white 3s ease-in-out infinite',
                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.3), 0 0 16px rgba(248, 250, 252, 0.2)'
                  }}
                />
                {/* Top glow effect (Light Mode) */}
                <div
                  className="dark:hidden"
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    right: '-4px',
                    height: '8px',
                    background: 'linear-gradient(90deg, rgba(192, 132, 252, 0.4) 0%, rgba(216, 180, 254, 0.3) 10%, rgba(233, 213, 255, 0.4) 20%, rgba(243, 232, 255, 0.5) 30%, rgba(233, 213, 255, 0.4) 35%, rgba(216, 180, 254, 0.2) 50%, rgba(192, 132, 252, 0.3) 70%, transparent 95%)',
                    borderRadius: '16px 16px 0 0',
                    filter: 'blur(4px)',
                    zIndex: 0,
                    animation: 'spotlight-top-glow 3s ease-in-out infinite'
                  }}
                />
                {/* Top glow effect (Dark Mode) */}
                <div
                  className="hidden dark:block"
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    right: '-4px',
                    height: '8px',
                    background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(248, 250, 252, 0.15) 10%, rgba(241, 245, 249, 0.2) 20%, rgba(226, 232, 240, 0.25) 30%, rgba(241, 245, 249, 0.2) 35%, rgba(248, 250, 252, 0.1) 50%, rgba(255, 255, 255, 0.15) 70%, transparent 95%)',
                    borderRadius: '16px',
                    filter: 'blur(4px)',
                    zIndex: 0,
                    animation: 'spotlight-top-glow-white 3s ease-in-out infinite'
                  }}
                />
                {/* Left glow effect (Light Mode) */}
                <div
                  className="dark:hidden"
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    bottom: '-4px',
                    width: '8px',
                    background: 'linear-gradient(180deg, rgba(192, 132, 252, 0.4) 0%, rgba(216, 180, 254, 0.3) 15%, rgba(233, 213, 255, 0.4) 30%, rgba(243, 232, 255, 0.5) 40%, rgba(233, 213, 255, 0.4) 50%, rgba(216, 180, 254, 0.2) 70%, transparent 100%)',
                    borderRadius: '16px 0 0 16px',
                    filter: 'blur(4px)',
                    zIndex: 0,
                    animation: 'spotlight-left-glow 3s ease-in-out infinite'
                  }}
                />
                {/* Left glow effect (Dark Mode) */}
                <div
                  className="hidden dark:block"
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    bottom: '-4px',
                    width: '8px',
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(248, 250, 252, 0.15) 15%, rgba(241, 245, 249, 0.2) 30%, rgba(226, 232, 240, 0.25) 40%, rgba(241, 245, 249, 0.2) 50%, rgba(248, 250, 252, 0.1) 70%, transparent 100%)',
                    borderRadius: '16px 0 0 16px',
                    filter: 'blur(4px)',
                    zIndex: 0,
                    animation: 'spotlight-left-glow-white 3s ease-in-out infinite'
                  }}
                />
                {/* Textarea input */}
                <div className="relative flex-1">
                  <textarea
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isRedirecting ? "Processing your request..." : "What do you want to know?"}
                    disabled={isRedirecting}
                    className="w-full bg-transparent text-gray-900 dark:text-white text-base font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none outline-none focus:outline-none focus:ring-0 border-0 min-h-[40px] disabled:opacity-50"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !isRedirecting) {
                        e.preventDefault();
                        handleSearchSubmit();
                      }
                    }}
                  />
                  {isRedirecting && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-purple-600"></div>
                    </div>
                  )}
                </div>
                
                {/* Bottom row with interactive elements */}
                <div className="flex items-center justify-between mt-4">
                  {/* Left side controls - Microphone and Auto */}
                  <div className="flex items-center space-x-3">
                    {/* Microphone icon */}
                    <button 
                      type="button"
                      className="p-2.5 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => {
                        // Handle microphone click
                        console.log('Microphone clicked');
                      }}
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                    
                    {/* Rocket icon with "Auto" text */}
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-gray-600 dark:text-gray-300 text-base font-medium">Auto</span>
                    </div>
                  </div>
                  
                  {/* Right side control - Sound wave icon */}
                  <button 
                    type="button"
                    className="p-2.5 rounded-full bg-gray-800 dark:bg-gray-600 hover:bg-gray-700 dark:hover:bg-gray-500 transition-colors"
                    onClick={() => {
                      // Handle sound wave click
                      console.log('Sound wave clicked');
                    }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap justify-center gap-1.5">
            <button 
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 text-xs font-medium transition-all duration-200 hover:scale-105"
              onClick={() => {
                setSearchQuery("Find tech journalists for product launch");
                console.log('Tech journalists clicked');
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              Tech Journalists
            </button>
            
            
            <button 
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 text-xs font-medium transition-all duration-200 hover:scale-105"
              onClick={() => {
                setSearchQuery("Find marketing influencers and content creators");
                console.log('Influencers clicked');
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-9 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 12l2 2 4-4" />
              </svg>
              Influencers
            </button>
            
            <button 
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 text-xs font-medium transition-all duration-200 hover:scale-105"
              onClick={() => {
                setSearchQuery("Connect with industry experts and thought leaders");
                console.log('Industry experts clicked');
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Industry Experts
            </button>
            
            <button 
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 text-xs font-medium transition-all duration-200 hover:scale-105"
              onClick={() => {
                setSearchQuery("Find potential business partners and collaborators");
                console.log('Business partners clicked');
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
              Business Partners
            </button>
          </div>
          
        </div>
      </section>

      {/* App Preview Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal-up">
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Experience the power of <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">Mosaic Next</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our intuitive interface makes managing your outreach campaigns effortless. 
              See how easy it is to connect with the right people at the right time.
            </p>
          </div>
          
          <motion.div ref={appPreviewRef} style={{ scale: appPreviewScale }} className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-gray-50 dark:bg-gray-800 relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-gray-300 dark:border-gray-700 shadow-lg shadow-zinc-950/15 ring-1 reveal-up will-change-transform">
            {/* Light mode image */}
            <img
              className="bg-gray-50 dark:bg-gray-800 aspect-[16/10] relative rounded-2xl w-full object-contain dark:hidden"
              src="/images/main-light.png"
              alt="Mosaic Next app interface"
              width={2700}
              height={1440}
            />
            {/* Dark mode image */}
            <img
              className="bg-gray-50 dark:bg-gray-800 aspect-[16/10] relative rounded-2xl w-full object-contain hidden dark:block"
              src="/images/main.png"
              alt="Mosaic Next app interface"
              width={2700}
              height={1440}
            />
          </motion.div>
        </div>
      </section>

      {/* Insights Section */}
      <DynamicInsightsSection />

      {/* Goal Selection Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 reveal-up">
            <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-gray-800/50 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium border border-purple-200/60 dark:border-purple-800/60 mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Choose Your Path
            </div>
            <h2 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              What's your <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">goal</span> today?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Tailored outreach solutions for companies, startups, and agencies. 
              Choose the path that fits your business needs and watch your connections grow.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Companies Card */}
            <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-400/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 reveal-card">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-gray-800 dark:text-gray-200 text-sm font-semibold">Companies & Startups</div>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                  I want to <span className="text-purple-700 dark:text-purple-300">build connections</span>
                </h3>
                
                {/* Interactive Chart */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly outreach volume</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">2,847</div>
                    </div>
                    <div className="flex items-center gap-1 text-purple-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                      <span className="text-sm font-semibold">+24%</span>
                    </div>
                  </div>
                  
                  {/* Custom Bar Chart */}
                  <div className="h-24 flex items-end justify-between gap-2">
                    {[65, 72, 58, 83, 76, 89, 95, 78, 82, 88, 92, 84].map((height, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full bg-purple-500 rounded-t-sm transition-all duration-300 hover:bg-purple-600"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">Build relationships across 1,000+ high-authority platforms</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">Expert content creation and curation included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">Full transparency and detailed reporting</span>
                  </div>
                </div>
                
                <Link 
                  href="/contact" 
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Start Building Connections
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
            
            {/* Agencies Card */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-purple-300 transition-all duration-300 shadow-sm hover:shadow-md reveal-card">
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-gray-800 dark:text-gray-200 text-sm font-semibold">Agencies & White Label Partners</div>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                  I want to <span className="text-purple-700 dark:text-purple-300">resell or whitelabel</span> your service
                </h3>
                
                {/* Revenue Chart */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Monthly Revenue</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">$530,865</div>
                    </div>
                    <div className="flex items-center gap-1 text-purple-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                      <span className="text-sm font-semibold">+10.3%</span>
                    </div>
                  </div>
                  
                  {/* Doughnut Chart Placeholder */}
                  <div className="h-24 flex items-center justify-center">
                    <div className="relative w-20 h-20">
                      <div className="absolute inset-0 rounded-full border-8 border-gray-200 dark:border-gray-600"></div>
                      <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-purple-500 border-r-purple-500" style={{clipPath: 'polygon(50% 50%, 50% 0%, 75% 0%, 75% 50%)'}}></div>
                      <div className="absolute inset-0 rounded-full border-8 border-transparent border-b-purple-400 border-l-purple-400" style={{clipPath: 'polygon(50% 50%, 0% 50%, 0% 25%, 25% 25%)'}}></div>
                      <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-purple-300" style={{clipPath: 'polygon(50% 50%, 25% 0%, 50% 0%)'}}></div>
                    </div>
                  </div>
                  
                  {/* Revenue Breakdown */}
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-700">$270K</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Outreach</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-700">$181K</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Content</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-700">$80K</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Social</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">White label services for 300+ agencies globally</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">Custom branding and client management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">Dedicated support and training resources</span>
                  </div>
                </div>
                
                <Link 
                  href="/contact" 
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Explore White Label Options
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Bottom CTA */}
          <div className="text-center mt-12 reveal-fade">
            <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 px-6 py-3 rounded-full border border-gray-200 dark:border-gray-700">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Not sure which path to choose?</span>
              <Link href="/contact" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold">
                Let's discuss your needs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 reveal-up">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">2,000</div>
              <div className="text-gray-600 dark:text-gray-400">Clients served</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">96.8%</div>
              <div className="text-gray-600 dark:text-gray-400">Repeat customer rate</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">50,000</div>
              <div className="text-gray-600 dark:text-gray-400">Connections made since 2020</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">3 days</div>
              <div className="text-gray-600 dark:text-gray-400">Avg. response time</div>
            </div>
          </div>
          
          {/* Features */}
          <div className="flex flex-wrap justify-center gap-4 mb-16 reveal-fade">
            <div className="flex items-center bg-gray-50/90 dark:bg-gray-800/50 px-4 py-2 rounded-full shadow-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
              <span className="text-gray-600 dark:text-gray-400">No spam or automated messages</span>
            </div>
            <div className="flex items-center bg-gray-50/90 dark:bg-gray-800/50 px-4 py-2 rounded-full shadow-sm">
              <div className="w-5 h-5 bg-purple-500 rounded-full mr-3 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-900 dark:text-white">Expert quality content included</span>
            </div>
            <div className="flex items-center bg-gray-50/90 dark:bg-gray-800/50 px-4 py-2 rounded-full shadow-sm">
              <div className="w-5 h-5 bg-purple-500 rounded-full mr-3 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-900 dark:text-white">Over 1,000 verified contacts</span>
            </div>
            <div className="flex items-center bg-gray-50/90 dark:bg-gray-800/50 px-4 py-2 rounded-full shadow-sm">
              <div className="w-5 h-5 bg-purple-500 rounded-full mr-3 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-900 dark:text-white">Full transparency about results</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 reveal-up">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-gray-800/50 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium border border-purple-200/60 dark:border-purple-800/60 mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Client Success Stories
            </div>
            <h2 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              What our <span className="text-purple-600 dark:text-purple-300">clients</span> are saying
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Join 2,000+ companies who trust us to build their authority and drive real results. 
              Here's what they have to say about their experience.
            </p>
          </div>

          {/* Featured Testimonials Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Featured Testimonial 1 */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 reveal-card">
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src="https://emiactech.com/wp-content/uploads/2025/09/ACKO-DRIVE-BLACK-LOGO-1.png" 
                    alt="Acko Logo" 
                    className="w-12 h-12 rounded-xl object-contain"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Nitesh</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sr. Marketing Manager</div>
                  </div>
                  <div className="ml-auto flex text-purple-500">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                
                <blockquote className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  "EMIAC did an amazing job creating and publishing our Wikipedia page. The research was thorough, and the process was super smooth. Felt like they really understood our brand story. Highly recommend!"
                </blockquote>
                
                <div className="flex items-center justify-between">
                  <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-full border border-purple-200/60 dark:border-purple-800/60">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Wikipedia Writing & Publishing</span>
                  </div>
                  <div className="text-2xl text-purple-600">✦</div>
                </div>
              </div>
            </div>

            {/* Featured Testimonial 2 */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 reveal-card">
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src="https://emiactech.com/wp-content/uploads/2025/09/7-1-1.png" 
                    alt="Company Logo" 
                    className="w-12 h-12 rounded-xl object-contain"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Nousheer</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sr. Director SEO</div>
                  </div>
                  <div className="ml-auto flex text-purple-500">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                
                <blockquote className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  "I was blown away by the results! Our traffic increased by 209% in just 3 months thanks to EMIAC's SEO strategy. They really know their stuff, and they delivered exactly what they promised. Definitely worth the investment!"
                </blockquote>
                
                <div className="flex items-center justify-between">
                  <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-full border border-purple-200/60 dark:border-purple-800/60">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">209% Traffic Increase</span>
                  </div>
                  <div className="text-2xl text-purple-600">★</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 reveal-up">
            <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-2">200+</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">5-Star Reviews</div>
            </div>
            <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-2">96.8%</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Repeat Rate</div>
            </div>
            <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-2">50K+</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Connections Made</div>
            </div>
            <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-2">3 Days</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Avg. Response</div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 reveal-up">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-gray-800/50 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium border border-purple-200/60 dark:border-purple-800/60 mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How It Works
            </div>
            <h2 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Our <span className="text-purple-700 dark:text-purple-300">proven process</span> in action
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              From initial consultation to final results, we follow a systematic approach that ensures 
              maximum impact for your brand and business goals.
            </p>
          </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {/* Step 1 */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 reveal-card">
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Strategy & Research</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Days 1-3</div>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  We analyze your brand, target audience, and goals to create a customized outreach strategy. 
                  Our team researches the best platforms and contacts for maximum impact.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Brand analysis & positioning</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Target audience research</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Platform selection & mapping</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 reveal-card">
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Content Creation</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Days 4-7</div>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  Our expert writers create high-quality, engaging content tailored to each platform. 
                  We ensure every piece aligns with your brand voice and objectives.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Expert content writing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Platform-specific optimization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Quality assurance & review</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 reveal-card">
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Publishing & Outreach</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Days 8-14</div>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  We execute the outreach campaign across selected platforms, building genuine connections 
                  and securing high-quality placements for your content.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Strategic platform outreach</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Relationship building</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Content placement & monitoring</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Expected Timeline & Results</h3>
              <p className="text-gray-600 dark:text-gray-300">What you can expect at each stage of the process</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Week 1</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Strategy & Research Complete</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Week 2</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Content Creation & Review</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Week 3-4</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Outreach & Publishing</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ongoing</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Results & Reporting</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-gray-800/50 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium border border-purple-200/60 dark:border-purple-800/60 mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Frequently Asked Questions
            </div>
            <h2 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Got <span className="text-purple-700 dark:text-purple-300">questions</span>? We've got answers
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Everything you need to know about our services, process, and how we can help 
              your business grow through strategic outreach and content placement.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* FAQ Item 1 */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white pr-4">Can I submit my own content?</h3>
                  <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Absolutely! We welcome your content submissions and can work with your existing materials. 
                  Our team will review and optimize your content for maximum impact across our network of platforms.
                </p>
              </div>
            </div>

            {/* FAQ Item 2 */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white pr-4">Do you provide white label services?</h3>
                  <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Yes! We offer comprehensive white label services for agencies and partners. 
                  This includes custom branding, dedicated support, and flexible pricing models 
                  to help you scale your business.
                </p>
              </div>
            </div>

            {/* FAQ Item 3 */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white pr-4">What's the typical turnaround time?</h3>
                  <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Our standard turnaround is 7-14 days for content creation and placement. 
                  Rush orders can be accommodated with 3-5 day delivery. 
                  We provide detailed timelines during the consultation phase.
                </p>
              </div>
            </div>

            {/* FAQ Item 4 */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white pr-4">Which payment methods do you accept?</h3>
                  <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  We accept all major credit cards, PayPal, bank transfers, and cryptocurrency. 
                  Enterprise clients can arrange custom payment terms including monthly billing 
                  and milestone-based payments.
                </p>
              </div>
            </div>

            {/* FAQ Item 5 */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white pr-4">Do you offer guarantees?</h3>
                  <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  We guarantee quality content and professional service delivery. 
                  If you're not satisfied with our work, we offer revisions and 
                  in some cases, partial refunds based on our satisfaction policy.
                </p>
              </div>
            </div>

            {/* FAQ Item 6 */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white pr-4">How do you measure success?</h3>
                  <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  We track placements, engagement metrics, traffic increases, and brand mentions. 
                  You'll receive detailed reports showing reach, impressions, and the impact 
                  of our outreach efforts on your business goals.
                </p>
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="text-center mt-16">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Still have questions?</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                Our team is here to help! Schedule a free consultation to discuss your specific needs 
                and get personalized answers to all your questions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/contact" 
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Schedule Free Consultation
                </Link>
                <Link 
                  href="mailto:hello@mosaicnext.com" 
                  className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-semibold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Us Directly
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <img
                  src="/images/logo.png"
                  alt="Mosaic Next logo"
                  width={32}
                  height={32}
                  className="dark:hidden"
                />
                <img
                  src="/images/logo_dark_mode.png"
                  alt="Mosaic Next logo"
                  width={32}
                  height={32}
                  className="hidden dark:block"
                />
                <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">Mosaic Next</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Fortune 500 companies and Silicon Valley startups trust Mosaic Next to build authority connections 
                on real platforms, with real traffic, with real results.
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search contacts"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Navigation</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Home</Link></li>
                <li><Link href="#services" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Services</Link></li>
                <li><Link href="#features" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Features</Link></li>
                <li><Link href="#testimonials" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Testimonials</Link></li>
                <li><Link href="#faq" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">FAQ</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Countries</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">United States</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">United Kingdom</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Canada</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Australia</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Germany</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Industries</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Technology</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Finance</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Healthcare</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">E-commerce</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">Education</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              © 2024 Mosaic Next. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm">Terms of Service</Link>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
