'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import Footer from '@/components/ui/footer';

// --- Data for the blog posts ---
// In a real application, this would come from a CMS or API.
const postsData = [
  {
    id: 224321,
    imageUrl: 'https://emiactech.com/wp-content/uploads/2023/10/pexels-rdne-stock-project-8369771-1696236553-1969640211-1-924x520.jpg',
    imageAlt: 'Influencer Marketing Services in 2023',
    categories: ['Content Marketing', 'Social Media Marketing'],
    title: 'Why Your Business Needs Influencer Marketing Services in 2023',
    date: 'October 13, 2023',
    commentCount: 0,
    excerpt: "In today's fast-paced digital world, businesses constantly face new marketing and advertising challenges. Because of the widespread use of social media platforms, traditional marketing approaches…",
    postUrl: '/blog/why-your-business-needs-influencer-marketing-services',
  },
  {
    id: 224327,
    imageUrl: 'https://emiactech.com/wp-content/uploads/2023/10/pexels-george-milton-6953929-1696241021-1681958791-1-924x520.jpg',
    imageAlt: 'Influencer Marketing Services Trends',
    categories: ['Social Media Marketing'],
    title: 'Influencer Marketing Services Trends for 2023',
    date: 'October 11, 2023',
    commentCount: 0,
    excerpt: "Are you ready to take your business to the next level? Want to stay ahead of the competition and increase brand awareness? Then, it's time…",
    postUrl: '/blog/influencer-marketing-services-trends-for-2023',
  },
  {
    id: 8907,
    imageUrl: 'https://emiactech.com/wp-content/uploads/2021/07/pexels-antoni-shkraba-4348401-1692179224-111390388-924x520.jpg',
    imageAlt: 'find influencers',
    categories: ['Social Media Marketing'],
    title: '7 Proven Tactics to Find Influencers for Boosting Your Online Branding',
    date: 'August 28, 2023',
    commentCount: 0,
    excerpt: "In today's fast-paced digital landscape, building a solid online brand presence is a non-negotiable for businesses striving to stay ahead. However, navigating this intricate realm…",
    postUrl: '/blog/how-to-find-the-perfect-influencer',
  },
  {
    id: 8909,
    imageUrl: 'https://emiactech.com/wp-content/uploads/2021/07/scott-graham-5fNmWej4tAA-unsplash-1692173050-1747042688-924x520.jpg',
    imageAlt: 'outreach marketing',
    categories: ['Link Building'],
    title: 'The Not-so-Hidden Benefits of Outreach Marketing That are Ignored in 2023',
    date: 'August 28, 2023',
    commentCount: 0,
    excerpt: 'Businesses face a pressing challenge in an era of marketing noise, where grabbing and maintaining consumer attention is a Herculean task. The traditional marketing methods…',
    postUrl: '/blog/benefits-of-outreach-marketing',
  },
];


// --- Reusable Animation Variants ---
const fadeInUp = {
  initial: { y: 40, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.7,
    },
  },
};

const fadeInLeft = {
  initial: { x: -40, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
    },
  },
};

const fadeInRight = {
  initial: { x: 40, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
    },
  },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const heroStaggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};


// --- Hero Section Component ---
const HeroSection = () => {
  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-20 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={heroStaggerContainer}
          className="text-center"
        >
          <motion.div
            variants={fadeInUp}
            className="mb-6"
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 mb-6">
              📚 Resources & Insights
            </span>
          </motion.div>
          
          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Discover Our
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Resources
            </span>
          </motion.h1>
          
          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            Explore our comprehensive collection of articles, guides, and insights designed to help you 
            grow your business and stay ahead of the competition.
          </motion.p>
          
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Expert Insights</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Industry Trends</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Growth Strategies</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

// --- Reusable Blog Post Card Component ---
const BlogPostCard = ({ post }) => {
  return (
    <motion.article 
      variants={fadeInUp}
      className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-shadow hover:shadow-xl border border-gray-200 dark:border-gray-700"
    >
      <div className="relative">
        <Image
          width={924}
          height={520}
          src={post.imageUrl}
          alt={post.imageAlt}
          className="w-full h-56 object-cover"
        />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="mb-3">
          {post.categories.map((cat, index) => (
            <span key={index} className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase">
              {cat}{index < post.categories.length - 1 && ', '}
            </span>
          ))}
        </div>
        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
          <Link href={post.postUrl} className="hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
            {post.title}
          </Link>
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-base flex-grow mb-4">
          {post.excerpt}
        </p>
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700/50 text-sm text-gray-500 dark:text-gray-400">
          <span>{post.date}</span>
        </div>
      </div>
    </motion.article>
  );
};


// --- Main Resources Page Component ---
const ResourcesPage = () => {
  return (
    <>
      {/* Hero Section */}
      <HeroSection />
      
      {/* Resources Grid Section */}
      <div className="bg-gray-50 dark:bg-gray-900 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10"
          >
            {postsData.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ResourcesPage;