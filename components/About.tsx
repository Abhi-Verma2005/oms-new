'use client'

import Image from 'next/image';
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

// A reusable animation variant for elements that fade in and slide up
const fadeInUp = {
  initial: { y: 30, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
    },
  },
};

// A container variant for staggering the animation of its children
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Animation for the main headline text reveal
const headlineText = "Digital Growth Partner";
const headlineWords = headlineText.split(' ');

const headlineWord = {
  initial: { y: 40, opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1, 
    transition: {
      duration: 0.5,
    }
  },
};

const About = () => {
  const heroRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start end", "end start"] })
  const heroParallaxY = useTransform(scrollYProgress, [0, 1], [0, -60])
  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        {/* Hero */}
        <motion.section 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="relative"
          ref={heroRef}
        >
          <div className="text-center max-w-3xl mx-auto">
            <motion.div variants={fadeInUp}>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-violet-500/10 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium border border-purple-200/60 dark:border-purple-800/60 mb-6">
                Your AI-Driven, Tech-Enabled
              </div>
            </motion.div>
            
            {/* Staggered word reveal for the main headline */}
            <motion.h1 
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                {headlineWords.map((word, index) => (
                  <motion.span 
                    key={index} 
                    variants={headlineWord} 
                    className="inline-block mr-2 md:mr-4" // Add margin for spacing
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-gray-700 dark:text-gray-200">
              We are a team of 70+ specialists working as one engine. From SEO and content to automation and PR, every solution is built with precision.
            </motion.p>
            <motion.p variants={fadeInUp} className="mt-4 text-gray-700 dark:text-gray-300">
              Deadlines are checkpoints, not finish lines. With certified systems and award-winning creativity, we help brands move ten steps ahead and create results that last.
            </motion.p>
          </div>
          <motion.div 
            style={{ y: heroParallaxY }}
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { duration: 0.8, delay: 0.4 } }}
            className="mt-12"
          >
            <Image
              priority
              width={2560}
              height={1703}
              src="https://emiactech.com/wp-content/uploads/2025/09/DSC_7605-scaled.jpg"
              alt="Team working together"
              className="w-full h-auto rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-purple-500/10"
            />
          </motion.div>
        </motion.section>

        {/* About split - Animates when it scrolls into view */}
        <motion.section 
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="mt-20 grid md:grid-cols-2 gap-8 items-center"
        >
          <motion.div variants={fadeInUp}>
            <Image
              width={2560}
              height={1703}
              src="https://emiactech.com/wp-content/uploads/2025/09/DSC_7148-scaled.jpg"
              alt="Office discussion"
              className="w-full h-auto rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-purple-500/10"
            />
          </motion.div>
          <motion.div variants={staggerContainer} initial="initial" animate="animate">
            <motion.p variants={fadeInUp} className="text-lg text-gray-700 dark:text-gray-200">
              Ambitious brands need more than campaigns; they need systems. Our foundation combines strategy, creativity, and technology to deliver scalable outcomes.
            </motion.p>
            <motion.p variants={fadeInUp} className="mt-4 text-gray-700 dark:text-gray-300">
              We build ecosystems that connect every touchpoint—search, content, performance, automation, and analytics—into one growth engine. The result is resilience, adaptability, and consistent results as markets change.
            </motion.p>
            <motion.p variants={fadeInUp} className="mt-4 text-gray-700 dark:text-gray-300">
              Every system we design is anchored in measurable outcomes. Behind every strategy lies data, structure, and processes that define how growth is achieved.
            </motion.p>
          </motion.div>
        </motion.section>

        {/* Numbers - Animates when it scrolls into view */}
        <motion.section 
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="mt-20"
        >
          <div className="text-center max-w-3xl mx-auto mb-10">
            <motion.h3 variants={fadeInUp} className="text-3xl md:text-4xl font-bold">Numbers That Define Us</motion.h3>
            <motion.p variants={fadeInUp} className="mt-3 text-gray-700 dark:text-gray-300">
              Different ideas, one direction. These numbers show systems that scale, partnerships that last, and growth that can be measured.
            </motion.p>
          </div>
          <motion.div 
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {/* Number cards stagger in */}
            {[
              { number: 98, suffix: '%', label: 'Repeat clients' },
              { number: 45, suffix: '+', label: 'Clients served' },
              { number: 70, suffix: '+', label: 'Specialists' },
              { number: 10, suffix: 'x', label: 'Avg. ROI focus' }
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/60 dark:border-gray-700/60 text-center shadow"
              >
                <div className="text-5xl font-extrabold">{item.number}<span className="text-purple-600 dark:text-purple-400">{item.suffix}</span></div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* Image trio - Animates when it scrolls into view */}
        <motion.section 
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mt-20"
        >
          <div className="grid md:grid-cols-3 gap-4">
            {[
              'https://emiactech.com/wp-content/uploads/2025/09/DSC2428-1.jpg',
              'https://emiactech.com/wp-content/uploads/2025/09/DSC2424-1.jpg',
              'https://emiactech.com/wp-content/uploads/2025/09/DSC2430-1.jpg',
            ].map((src) => (
              <motion.div 
                key={src} 
                variants={fadeInUp}
                className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60"
              >
                <Image
                  src={src}
                  alt="Office"
                  width={1200}
                  height={800}
                  className="w-full h-64 md:h-80 object-cover transition-transform duration-300 hover:scale-105"
                />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA - Animates when it scrolls into view */}
        <motion.section 
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mt-20"
        >
          <div className="relative max-w-3xl mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 dark:border-gray-700/60 p-8 shadow-lg">
            <h2 className="text-2xl md:text-3xl font-semibold text-center">
              Want to dominate the #1 Rank & AI Citations of Google?
            </h2>
            <form
              onSubmit={(e) => { e.preventDefault(); alert('Form submitted!'); }}
              className="mt-6 flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                name="email"
                placeholder="Your Email Address"
                required
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/60 px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              />
              <button
                type="submit"
                className="rounded-xl px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 shadow-md transition-transform transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Get Started
              </button>
            </form>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default About;