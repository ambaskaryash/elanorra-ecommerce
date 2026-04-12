'use client';

import { motion, Variants, cubicBezier } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: cubicBezier(0.16, 1, 0.3, 1),
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
    name: 'Anya Sharma',
    role: 'Founder & Principal Designer',
    image: '/images/editorial-craft.png',
    description: 'With a discerning eye for minimalist detail, Anya founded Elanorra Living to bring high-end curations directly to the modern homeowner.',
  },
  {
    name: 'David Chen',
    role: 'Head of Product Curation',
    image: '/images/hero-tableware.png',
    description: 'David travels the world to discover unique pieces that combine traditional craftsmanship with modern aesthetics.',
  },
  {
    name: 'Maya Patel',
    role: 'Sustainability Director',
    image: '/images/category-stationery.png',
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
            src="/images/about-hero-minimalist.png"
            alt="Elanorra Living Story"
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
            <h1 className="text-3xl md:text-5xl font-serif uppercase tracking-[0.2em] mb-6">Our Story</h1>
            <p className="text-xs md:text-sm text-white/80 uppercase tracking-widest leading-relaxed">
              Transforming houses into homes through curated luxury and timeless design
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-2xl md:text-3xl font-serif uppercase tracking-widest text-gray-900 mb-8 leading-snug">
                Founded on a Vision of Elevated Living
              </h2>
              <div className="space-y-6 text-gray-500 text-sm leading-relaxed tracking-wide">
                <p>
                  Elanorra Living was born from a simple belief: every space deserves to be curated beautifully. 
                  We started as a dedicated team of design minimalists who noticed a gap 
                  in the market for accessible, high-contrast luxury decor.
                </p>
                <p>
                  What began as a passion project has grown into an editorial marketplace where discerning 
                  homeowners can discover exceptional, hand-crafted pieces. We partner with artisans, 
                  designers, and makers who share our commitment to architectural purity and uncompromising quality.
                </p>
                <p>
                  Today, Elanorra Living serves a sophisticated clientele worldwide, helping them sculpt 
                  spaces that are not just visually stunning, but uniquely personal.
                </p>
              </div>
            </motion.div>
            <motion.div variants={itemVariants}>
              <div className="relative h-[500px] border border-gray-100 overflow-hidden">
                <Image
                  src="/images/about-story-workspace.png"
                  alt="Elanorra Living workspace"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-stone-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-serif uppercase tracking-widest text-gray-900 mb-4">
                Our Values
              </h2>
              <p className="text-xs text-gray-500 uppercase tracking-widest max-w-2xl mx-auto">
                These principles guide everything we do, from product curation to client relations
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value) => (
                <motion.div
                  key={value.title}
                  variants={itemVariants}
                  className="bg-white p-10 border border-gray-100 hover:border-gray-900 transition-colors text-center group"
                >
                  <div className="text-3xl mb-6 grayscale group-hover:scale-110 transition-transform">{value.icon}</div>
                  <h3 className="text-xs font-serif uppercase tracking-widest text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={itemVariants} className="text-center mb-20">
              <h2 className="text-2xl md:text-3xl font-serif uppercase tracking-widest text-gray-900 mb-4">
                Meet The Curators
              </h2>
              <p className="text-xs text-gray-500 uppercase tracking-widest max-w-2xl mx-auto">
                The meticulous eyes behind Elanorra Living&apos;s collections
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {team.map((member) => (
                <motion.div
                  key={member.name}
                  variants={itemVariants}
                  className="text-center group"
                >
                  <div className="relative w-full aspect-[4/5] mx-auto mb-8 border border-gray-100 overflow-hidden group-hover:border-gray-900 transition-colors">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 hover:scale-105"
                    />
                  </div>
                  <h3 className="text-sm font-serif uppercase tracking-widest text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4">{member.role}</p>
                  <p className="text-xs text-gray-500 leading-relaxed font-light px-4">{member.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gray-900 text-white border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-serif uppercase tracking-widest mb-8">
              Ready to Transform Your Space?
            </h2>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-12 max-w-xl mx-auto leading-relaxed">
              Discover our curated collection of premium home decor and lifestyle artifacts.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center px-10 py-5 bg-white text-gray-900 text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
            >
              Shop Our Collection
              <svg className="ml-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}