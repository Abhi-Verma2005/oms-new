'use client';

import React from 'react';
import { motion } from 'motion/react';
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


// --- Main Contact Section Component ---
const ContactSection = () => {
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

  // Animation variants
  const fadeInLeft = {
    initial: { x: -50, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.8 } },
  };

  const fadeInRight = {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.8 } },
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
        {/* Left Column: Contact Info */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInLeft}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Let's Elevate Your Brand Presence!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            We work as an extension of your team, bringing systems, creativity, and technology together to deliver measurable growth. Whether it’s scaling visibility, automating processes, or building authority, it all starts here.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-10">
            Fill out the form or connect with us directly; let’s align strategy and execution to move your brand forward.
          </p>
          <div className="space-y-6">
            {infoItems.map((item, index) => {
              const content = (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-6 h-6 text-purple-600 dark:text-purple-400 mt-1">
                    <item.Icon className="fill-current" />
                  </div>
                  <p className="text-base text-gray-700 dark:text-gray-200">{item.text}</p>
                </div>
              );
              return item.href ? <a href={item.href} className="hover:opacity-80 transition-opacity">{content}</a> : content;
            })}
          </div>
        </motion.div>

        {/* Right Column: Contact Form */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInRight}
          className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          {/* NOTE: This form is for display. You'll need to add your own submission logic
              (e.g., using a Next.js API route or a service like Formspree) and reCAPTCHA integration. */}
          <form 
            onSubmit={(e) => { e.preventDefault(); alert('Form submitted!'); }} 
            className="space-y-6"
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input type="text" id="name" name="name" placeholder="Enter your name" required className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input type="email" id="email" name="email" placeholder="Enter your email" required className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input type="tel" id="phone" name="phone" placeholder="Enter your number" required className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Message
              </label>
              <textarea id="message" name="message" placeholder="Enter your message" rows={4} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
            </div>
            <div>
              <button
                type="submit"
                className="w-full py-3 px-6 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-md transition-transform transform hover:scale-105"
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

export default ContactSection;