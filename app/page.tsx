'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar"
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards"
import { Spotlight } from "@/components/ui/spotlight"
import BarChart01 from "@/components/charts/bar-chart-01"
import LineChart01 from "@/components/charts/line-chart-01"
import DoughnutChart from "@/components/charts/doughnut-chart"

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

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPagesDropdownOpen, setIsPagesDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { name: "Features", link: "#features" },
    { name: "About", link: "/about" },
    { name: "Contact", link: "#contact" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-900 dark:text-white">

      {/* Navigation */}
      <div className="relative flex flex-col">
        <Navbar className="fixed top-0 left-0 right-0 z-50">
          <NavBody>
            <NavbarLogo />
            {/* Centered nav (avoids collision with absolute NavItems) */}
            <div className="absolute inset-0 hidden lg:flex items-center justify-center space-x-2 text-sm font-medium">
              {navItems.map((item, idx) => (
                <Link
                  key={`nav-link-${idx}`}
                  href={item.link}
                  className="relative px-4 py-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}
              {/* Pages Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setIsPagesDropdownOpen(true)}
                onMouseLeave={() => setIsPagesDropdownOpen(false)}
              >
                <button className="relative px-4 py-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 flex items-center">
                  <span>Pages</span>
                  <svg 
                    className={`w-3 h-3 shrink-0 ml-1 fill-current text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                      isPagesDropdownOpen ? 'rotate-180' : ''
                    }`} 
                    viewBox="0 0 12 12"
                  >
                    <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
                  </svg>
                </button>
                <div 
                  className={`absolute left-0 top-full mt-1 min-w-[220px] rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 shadow-lg shadow-purple-500/10 backdrop-blur-md overflow-hidden transition-all duration-200 ${
                    isPagesDropdownOpen 
                      ? 'opacity-100 visible translate-y-0' 
                      : 'opacity-0 invisible -translate-y-2'
                  }`}
                >
                  <div className="py-1">
                    <Link 
                      href="/pricing" 
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
                    >
                      Pricing
                    </Link>
                    <Link 
                      href="/integrations" 
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
                    >
                      Integrations
                    </Link>
                    <Link 
                      href="/customers" 
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
                    >
                      Customers
                    </Link>
                    <Link 
                      href="/changelog" 
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
                    >
                      Changelog
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NavbarButton variant="secondary" href="/signin">Login</NavbarButton>
              <NavbarButton variant="secondary" href="/publishers">App</NavbarButton>
              <NavbarButton variant="primary" href="https://cal.com/emiactech/30min" target="_blank" rel="noopener noreferrer">Book a call</NavbarButton>
            </div>
          </NavBody>

          <MobileNav>
            <MobileNavHeader>
              <NavbarLogo />
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </MobileNavHeader>

            <MobileNavMenu
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
            >
              {navItems.map((item, idx) => (
                <a
                  key={`mobile-link-${idx}`}
                  href={item.link}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="relative text-neutral-600 dark:text-neutral-300"
                >
                  <span className="block">{item.name}</span>
                </a>
              ))}
              {/* Mobile dropdown content as simple section */}
              <div className="mt-2 w-full">
                <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Pages</div>
                <div className="flex flex-col">
                  <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="px-2 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Pricing</Link>
                  <Link href="/integrations" onClick={() => setIsMobileMenuOpen(false)} className="px-2 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Integrations</Link>
                  <Link href="/customers" onClick={() => setIsMobileMenuOpen(false)} className="px-2 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Customers</Link>
                  <Link href="/changelog" onClick={() => setIsMobileMenuOpen(false)} className="px-2 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Changelog</Link>
                </div>
              </div>
              <div className="flex w-full flex-col gap-4">
                <NavbarButton
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="primary"
                  className="w-full"
                >
                  Login
                </NavbarButton>
                <NavbarButton
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="primary"
                  className="w-full"
                  href="https://cal.com/emiactech/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Book a call
                </NavbarButton>
                <NavbarButton
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="secondary"
                  className="w-full"
                  href="/publishers"
                >
                  App
                </NavbarButton>
              </div>
            </MobileNavMenu>
          </MobileNav>
        </Navbar>
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
                <textarea
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What do you want to know?"
                  className="w-full bg-transparent text-gray-900 dark:text-white text-base font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none outline-none focus:outline-none focus:ring-0 border-0 min-h-[40px] flex-1"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      // Handle search submission here
                      console.log('Search query:', searchQuery);
                    }
                  }}
                />
                
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
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Experience the power of <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">Mosaic Next</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our intuitive interface makes managing your outreach campaigns effortless. 
              See how easy it is to connect with the right people at the right time.
            </p>
          </div>
          
          <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-gray-50 dark:bg-gray-800 relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-gray-300 dark:border-gray-700 shadow-lg shadow-zinc-950/15 ring-1">
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
          </div>
        </div>
      </section>

      {/* Goal Selection Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-violet-500/10 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-800 mb-6">
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
            <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-400/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-purple-600 dark:text-purple-400 text-sm font-semibold">Companies & Startups</div>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                  I want to <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">build connections</span>
                </h3>
                
                {/* Interactive Chart */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-4 mb-6 border border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly outreach volume</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">2,847</div>
                    </div>
                    <div className="flex items-center gap-1 text-green-500">
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
                          className="w-full bg-gradient-to-t from-purple-500 to-violet-400 rounded-t-sm transition-all duration-500 hover:from-purple-600 hover:to-violet-500"
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
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">Build relationships across 1,000+ high-authority platforms</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">Expert content creation and curation included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">Full transparency and detailed reporting</span>
                  </div>
                </div>
                
                <Link 
                  href="#contact" 
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-violet-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/25"
                >
                  Start Building Connections
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
            
            {/* Agencies Card */}
            <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:border-green-400/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-green-500/10">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-green-600 dark:text-green-400 text-sm font-semibold">Agencies & White Label Partners</div>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                  I want to <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">resell or whitelabel</span> your service
                </h3>
                
                {/* Revenue Chart */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-4 mb-6 border border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Monthly Revenue</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">$530,865</div>
                    </div>
                    <div className="flex items-center gap-1 text-green-500">
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
                      <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-green-500 border-r-green-500" style={{clipPath: 'polygon(50% 50%, 50% 0%, 75% 0%, 75% 50%)'}}></div>
                      <div className="absolute inset-0 rounded-full border-8 border-transparent border-b-blue-500 border-l-blue-500" style={{clipPath: 'polygon(50% 50%, 0% 50%, 0% 25%, 25% 25%)'}}></div>
                      <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-purple-500" style={{clipPath: 'polygon(50% 50%, 25% 0%, 50% 0%)'}}></div>
                    </div>
                  </div>
                  
                  {/* Revenue Breakdown */}
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">$270K</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Outreach</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">$181K</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Content</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">$80K</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Social</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">White label services for 300+ agencies globally</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">Custom branding and client management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">Dedicated support and training resources</span>
                  </div>
                </div>
                
                <Link 
                  href="#contact" 
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-green-500/25"
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
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-6 py-3 rounded-full">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Not sure which path to choose?</span>
              <Link href="#contact" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold">
                Let's discuss your needs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
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
          <div className="flex flex-wrap justify-center gap-4 mb-16">
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
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-purple-600 dark:text-purple-400 text-sm font-medium mb-2">Testimonials</div>
          <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">What people are saying</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-12">
            We've received 200+ 5-star reviews. In fact, we've only ever received one review that was less than 5-stars. (It was 4 stars 😉)
          </p>
          
          <div className="h-[40rem] rounded-md flex flex-col antialiased bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-gray-900/50 dark:to-gray-800/50 items-center justify-center relative overflow-hidden">
            <InfiniteMovingCards
              items={testimonials}
              direction="right"
              speed="slow"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">FAQs</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-50/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-300 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white font-medium">Can I submit my own content?</span>
                <svg className="w-5 h-5 text-gray-600 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            
            <div className="bg-gray-50/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-300 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white font-medium">I work at a digital agency, do you provide white label services?</span>
                <svg className="w-5 h-5 text-gray-600 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            
            <div className="bg-gray-50/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-300 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white font-medium">How long is the turnaround time for getting my content published?</span>
                <svg className="w-5 h-5 text-gray-600 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            
            <div className="bg-gray-50/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-300 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white font-medium">Which payment methods do you accept?</span>
                <svg className="w-5 h-5 text-gray-600 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-16 px-4 sm:px-6 lg:px-8">
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
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500"
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
          
          <div className="border-t border-gray-300 dark:border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
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
