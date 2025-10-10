'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Footer from '@/components/ui/footer';

// --- Reusable SVG Icon Components ---
const MapPinIcon = (props) => (
  <svg aria-hidden="true" viewBox="0 0 288 512" {...props}>
    <path d="M112 316.94v156.69l22.02 33.02c4.75 7.12 15.22 7.12 19.97 0L176 473.63V316.94c-10.39 1.92-21.06 3.06-32 3.06s-21.61-1.14-32-3.06zM144 0C64.47 0 0 64.47 0 144s64.47 144 144 144 144-64.47 144-144S223.53 0 144 0zm0 76c-37.5 0-68 30.5-68 68 0 6.62-5.38 12-12 12s-12-5.38-12-12c0-50.73 41.28-92 92-92 6.62 0 12 5.38 12 12s-5.38 12-12 12z" />
  </svg>
);

const PhoneIcon = (props) => (
  <svg aria-hidden="true" viewBox="0 0 512 512" {...props}>
    <path d="M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z" />
  </svg>
);

const EnvelopeIcon = (props) => (
  <svg aria-hidden="true" viewBox="0 0 512 512" {...props}>
    <path d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z" />
  </svg>
);

// Mobile detection hook
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Optimized animation variants for mobile
const createFadeInUp = (isMobile) => ({
  initial: { y: isMobile ? 0 : 40, opacity: isMobile ? 1 : 0 },
  animate: { y: 0, opacity: 1 },
});

const createFadeInLeft = (isMobile) => ({
  initial: { x: isMobile ? 0 : -40, opacity: isMobile ? 1 : 0 },
  animate: { x: 0, opacity: 1 },
});

const createFadeInRight = (isMobile) => ({
  initial: { x: isMobile ? 0 : 40, opacity: isMobile ? 1 : 0 },
  animate: { x: 0, opacity: 1 },
});

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Hero Section Component
const HeroSection = () => {
  const isMobile = useMobileDetection();
  const fadeInUp = createFadeInUp(isMobile);
  const fadeInLeft = createFadeInLeft(isMobile);
  const fadeInRight = createFadeInRight(isMobile);

  return (
    <section className="relative py-12 sm:py-20 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      
      {/* Decorative elements - optimized for mobile */}
      <div className="absolute top-10 sm:top-20 left-4 sm:left-10 w-12 sm:w-20 h-12 sm:h-20 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20 animate-pulse" />
      <div className="absolute bottom-10 sm:bottom-20 right-4 sm:right-10 w-20 sm:w-32 h-20 sm:h-32 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/4 w-10 sm:w-16 h-10 sm:h-16 bg-violet-200 dark:bg-violet-800 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Text content */}
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: isMobile ? '-20px' : '-40px', amount: isMobile ? 0.1 : 0.3 }}
            variants={staggerContainer}
            className="space-y-6 sm:space-y-8"
          >
            <motion.div 
              variants={fadeInUp}
              transition={{ duration: isMobile ? 0.3 : 0.8, ease: "easeOut" }}
            >
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 text-purple-700 dark:text-purple-300 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium border border-purple-200 dark:border-purple-800">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Let's Connect
              </span>
            </motion.div>

            <motion.h1 
              variants={fadeInUp}
              transition={{ duration: isMobile ? 0.3 : 0.8, ease: "easeOut" }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight"
            >
              Ready to
              <span className="block bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                Transform
              </span>
              <span className="block text-gray-900 dark:text-white">
                Your Business?
              </span>
            </motion.h1>

            <motion.p 
              variants={fadeInUp}
              transition={{ duration: isMobile ? 0.3 : 0.8, ease: "easeOut" }}
              className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg px-4 sm:px-0"
            >
              Let's discuss how we can help you achieve your digital marketing goals and drive real results for your business.
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              transition={{ duration: isMobile ? 0.3 : 0.8, ease: "easeOut" }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <button className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-violet-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base">
                Get Started Today
                <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <button className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 text-sm sm:text-base">
                Schedule Call
              </button>
            </motion.div>
          </motion.div>

          {/* Right side - Stats and decorative elements */}
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: isMobile ? '-20px' : '-40px', amount: isMobile ? 0.1 : 0.3 }}
            variants={staggerContainer}
            className="relative"
          >
            {/* Main stats container */}
            <motion.div 
              variants={fadeInRight}
              transition={{ duration: isMobile ? 0.3 : 0.8, ease: "easeOut" }}
              className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1 sm:mb-2">24/7</div>
                  <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Support</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1 sm:mb-2">48h</div>
                  <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Response</div>
                </div>
                <div className="text-center col-span-2">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-1 sm:mb-2">100+</div>
                  <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Happy Clients</div>
                </div>
              </div>
            </motion.div>

            {/* Floating stats cards - hidden on mobile for better layout */}
            {!isMobile && (
              <>
                <motion.div 
                  variants={fadeInRight}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="absolute -top-6 -right-6 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 mb-1">5+</div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-300">Years Experience</div>
                  </div>
                </motion.div>

                <motion.div 
                  variants={fadeInRight}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                  className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">99%</div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-300">Success Rate</div>
                  </div>
                </motion.div>
              </>
            )}

            {/* Decorative elements - optimized for mobile */}
            <motion.div 
              variants={fadeInLeft}
              transition={{ duration: isMobile ? 0.3 : 0.8, ease: "easeOut" }}
              className="absolute top-2 sm:top-4 left-2 sm:left-4 w-8 sm:w-12 lg:w-16 h-8 sm:h-12 lg:h-16 bg-gradient-to-br from-purple-200 to-violet-200 dark:from-purple-800 dark:to-violet-800 rounded-full opacity-60"
            />
            <motion.div 
              variants={fadeInLeft}
              transition={{ duration: isMobile ? 0.3 : 0.8, ease: "easeOut", delay: 0.2 }}
              className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 w-6 sm:w-8 lg:w-12 h-6 sm:h-8 lg:h-12 bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-800 dark:to-cyan-800 rounded-full opacity-60"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// --- Main Contact Section Component ---
const ContactSection = () => {
  const isMobile = useMobileDetection();
  const fadeInUp = createFadeInUp(isMobile);
  const fadeInLeft = createFadeInLeft(isMobile);
  const fadeInRight = createFadeInRight(isMobile);

  const infoItems = [
    {
      Icon: MapPinIcon,
      text: 'Plot #102, Amrapali Marg, Maa Karni Nagar, Extension, Vaishali Nagar, Jaipur, Rajasthan IN - 302034',
    },
    {
      Icon: PhoneIcon,
      text: '+1 (650) 392-2238',
      href: 'tel:+16503922238',
    },
    {
      Icon: PhoneIcon,
      text: '+91 91193 91191',
      href: 'tel:+919119391191',
    },
    {
      Icon: EnvelopeIcon,
      text: 'care@emiactech.com',
      href: 'mailto:care@emiactech.com',
    },
  ];

  // Animation variants for contact section
  const contactFadeInLeft = {
    initial: { x: isMobile ? 0 : -50, opacity: isMobile ? 1 : 0 },
    animate: { x: 0, opacity: 1 },
  };

  const contactFadeInRight = {
    initial: { x: isMobile ? 0 : 50, opacity: isMobile ? 1 : 0 },
    animate: { x: 0, opacity: 1 },
  };

  const contactStaggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-12 sm:py-16 lg:py-20 px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">
        {/* Left Column: Contact Info */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: isMobile ? '-20px' : '-40px', amount: isMobile ? 0.1 : 0.3 }}
          variants={contactFadeInLeft}
          transition={{ duration: isMobile ? 0.3 : 0.8, ease: "easeOut" }}
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Let's Elevate Your Brand Presence!
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 leading-relaxed px-4 sm:px-0">
            We work as an extension of your team, bringing systems, creativity, and technology together to deliver measurable growth. Whether it's scaling visibility, automating processes, or building authority, it all starts here.
          </p>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-10 leading-relaxed px-4 sm:px-0">
            Fill out the form or connect with us directly; let's align strategy and execution to move your brand forward.
          </p>
          <motion.div 
            variants={contactStaggerContainer}
            className="space-y-4 sm:space-y-6"
          >
            {infoItems.map((item, index) => {
              const content = (
                <motion.div 
                  key={index} 
                  variants={fadeInUp}
                  className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400 mt-1">
                    <item.Icon className="fill-current" />
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 leading-relaxed">{item.text}</p>
                </motion.div>
              );
              return item.href ? <a key={index} href={item.href} className="hover:opacity-80 transition-opacity">{content}</a> : content;
            })}
          </motion.div>
        </motion.div>

        {/* Right Column: Contact Form */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: isMobile ? '-20px' : '-40px', amount: isMobile ? 0.1 : 0.3 }}
          variants={contactFadeInRight}
          transition={{ duration: isMobile ? 0.3 : 0.8, ease: "easeOut" }}
          className="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
        >
          {/* NOTE: This form is for display. You'll need to add your own submission logic
              (e.g., using a Next.js API route or a service like Formspree) and reCAPTCHA integration. */}
          <form 
            onSubmit={(e) => { e.preventDefault(); alert('Form submitted!'); }} 
            className="space-y-4 sm:space-y-6"
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input type="text" id="name" name="name" placeholder="Enter your name" required className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input type="email" id="email" name="email" placeholder="Enter your email" required className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input type="tel" id="phone" name="phone" placeholder="Enter your number" required className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Message
              </label>
              <textarea id="message" name="message" placeholder="Enter your message" rows={4} className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base resize-none"></textarea>
            </div>
            <div>
              <button
                type="submit"
                className="w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-md transition-transform transform hover:scale-105 text-sm sm:text-base"
              >
                Send Message
              </button>
            </div>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

// Main Contact Page Component
const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      {/* CSS fallback to ensure content is visible on mobile */}
      <style jsx>{`
        @media (max-width: 768px) {
          [data-framer-motion] {
            opacity: 1 !important;
            transform: translateY(0) translateX(0) !important;
          }
        }
      `}</style>
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Contact Section */}
      <ContactSection />
    </div>
  );
};

export default ContactPage;