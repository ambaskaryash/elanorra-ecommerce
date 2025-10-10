'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

const values = [
  {
    icon: '✨',
    title: 'Quality Craftsmanship',
    description: 'Every piece is carefully curated and crafted with attention to detail, ensuring lasting beauty and functionality.',
  },
  {
    icon: '🌿',
    title: 'Sustainable Living',
    description: 'We believe in responsible sourcing and sustainable practices that respect our environment and communities.',
  },
  {
    icon: '🎨',
    title: 'Timeless Design',
    description: 'Our collections feature timeless aesthetics that transcend trends, creating spaces that feel both current and enduring.',
  },
  {
    icon: '💝',
    title: 'Personal Touch',
    description: 'We understand that your home is your sanctuary, and we help you create spaces that reflect your unique personality.',
  },
];

const team = [
  {
    name: 'Sarah Mitchell',
    role: 'Founder & Creative Director',
    image: 'https://images.unsplash.com/photo-1494790108755-2616c1be3c7c?w=400&h=400&fit=crop&crop=center',
    description: 'With over 15 years in interior design, Sarah founded Elanorr Living to make luxury accessible to everyone.',
  },
  {
    name: 'David Chen',
    role: 'Head of Product Curation',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=center',
    description: 'David travels the world to discover unique pieces that combine traditional craftsmanship with modern aesthetics.',
  },
  {
    name: 'Maya Patel',
    role: 'Sustainability Director',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=center',
    description: 'Maya ensures our commitment to sustainable practices while maintaining the highest quality standards.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] bg-gray-900 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&h=900&fit=crop&crop=center"
            alt="Elanorr Living Story"
            fill
            className="object-cover opacity-60"
            priority
          />
        </div>
        <div className="relative z-10 h-full flex items-center justify-center text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl px-4"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Our Story</h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              Transforming houses into homes through curated luxury and timeless design
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Founded on a Vision of Elevated Living
              </h2>
              <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                <p>
                  Elanorr Living was born from a simple belief: everyone deserves to live beautifully. 
                  Founded in 2018, we started as a small team of design enthusiasts who noticed a gap 
                  in the market for accessible luxury home decor.
                </p>
                <p>
                  What began as a passion project has grown into a curated marketplace where discerning 
                  homeowners can discover exceptional pieces that tell a story. We partner with artisans, 
                  designers, and makers who share our commitment to quality and sustainability.
                </p>
                <p>
                  Today, Elanorr Living serves thousands of customers worldwide, helping them create 
                  spaces that are not just beautiful, but meaningful and personal.
                </p>
              </div>
            </motion.div>
            <motion.div variants={itemVariants}>
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop&crop=center"
                  alt="Elanorr Living workspace"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Our Values
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                These principles guide everything we do, from product curation to customer service
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value) => (
                <motion.div
                  key={value.title}
                  variants={itemVariants}
                  className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center"
                >
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Meet Our Team
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The passionate individuals behind Elanorr Living&apos;s success
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {team.map((member) => (
                <motion.div
                  key={member.name}
                  variants={itemVariants}
                  className="text-center group"
                >
                  <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-rose-600 font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600">{member.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Space?
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Discover our curated collection of premium home decor and lifestyle products
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center px-8 py-4 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors text-lg"
            >
              Shop Our Collection
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}