'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  HomeIcon, 
  PaintBrushIcon, 
  TruckIcon, 
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  CubeIcon 
} from '@heroicons/react/24/outline';

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

const services = [
  {
    icon: HomeIcon,
    title: 'Interior Design Consultation',
    description: 'Work with our expert designers to create a personalized vision for your space.',
    features: [
      'One-on-one design consultation',
      'Personalized mood boards',
      'Room layout planning',
      'Color scheme recommendations',
    ],
    price: 'Starting at ₹5,000',
    duration: '2-3 hours',
  },
  {
    icon: PaintBrushIcon,
    title: 'Complete Room Makeover',
    description: 'Transform your entire space with our comprehensive design and styling service.',
    features: [
      'Full room design concept',
      'Product sourcing and procurement',
      'Professional styling and setup',
      '3D visualization',
    ],
    price: 'Starting at ₹25,000',
    duration: '2-4 weeks',
  },
  {
    icon: SparklesIcon,
    title: 'Personal Shopping',
    description: 'Let our curators handpick the perfect pieces for your home and lifestyle.',
    features: [
      'Personalized product recommendations',
      'Style preference assessment',
      'Budget-conscious selections',
      'Exclusive access to new arrivals',
    ],
    price: 'Starting at ₹2,500',
    duration: '1-2 weeks',
  },
  {
    icon: CubeIcon,
    title: 'Custom Furniture Design',
    description: 'Create bespoke furniture pieces tailored to your exact specifications.',
    features: [
      'Custom design consultation',
      'Material and finish selection',
      'Handcrafted by skilled artisans',
      'Quality guarantee',
    ],
    price: 'Quote on request',
    duration: '4-8 weeks',
  },
  {
    icon: TruckIcon,
    title: 'White Glove Delivery',
    description: 'Premium delivery and installation service for your precious purchases.',
    features: [
      'Careful handling and transport',
      'Professional installation',
      'Furniture placement',
      'Packaging removal',
    ],
    price: 'Starting at ₹1,500',
    duration: 'Same day',
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Ongoing Design Support',
    description: 'Continuous support and advice for your evolving design needs.',
    features: [
      '24/7 design consultation',
      'Seasonal refresh suggestions',
      'Maintenance recommendations',
      'Style evolution guidance',
    ],
    price: 'Starting at ₹1,000/month',
    duration: 'Ongoing',
  },
];

const processSteps = [
  {
    step: '01',
    title: 'Initial Consultation',
    description: 'We start by understanding your vision, lifestyle, and preferences through a detailed consultation.',
  },
  {
    step: '02',
    title: 'Design Development',
    description: 'Our team creates personalized design concepts and mood boards tailored to your space.',
  },
  {
    step: '03',
    title: 'Product Curation',
    description: 'We handpick the perfect pieces from our collection and trusted partners.',
  },
  {
    step: '04',
    title: 'Implementation',
    description: 'Professional delivery, installation, and styling to bring your vision to life.',
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] bg-gray-900 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&h=900&fit=crop&crop=center"
            alt="Interior Design Services"
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
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Our Services</h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              From consultation to completion, we're here to make your design dreams reality
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Comprehensive Design Services
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Whether you need a single consultation or a complete transformation, we have the perfect service for you
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={service.title}
                  variants={itemVariants}
                  className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-rose-100 rounded-xl group-hover:bg-rose-200 transition-colors">
                      <service.icon className="h-8 w-8 text-rose-600" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold text-gray-900">{service.price}</span>
                      <span className="text-sm text-gray-500">{service.duration}</span>
                    </div>
                    <button className="w-full bg-rose-600 text-white py-3 rounded-md hover:bg-rose-700 transition-colors font-medium">
                      Get Started
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
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
                Our Design Process
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                A proven methodology that ensures exceptional results for every project
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {processSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  variants={itemVariants}
                  className="text-center relative"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-600 text-white text-xl font-bold rounded-full mb-6">
                    {step.step}
                  </div>
                  {index < processSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gray-300 -translate-y-0.5 -ml-8"></div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Elanorra Living?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="p-2 bg-rose-100 rounded-lg mr-4">
                    <SparklesIcon className="h-6 w-6 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Expert Design Team</h3>
                    <p className="text-gray-600">Our certified interior designers bring years of experience and creativity to every project.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="p-2 bg-rose-100 rounded-lg mr-4">
                    <CubeIcon className="h-6 w-6 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Curated Product Selection</h3>
                    <p className="text-gray-600">Access to exclusive furniture and decor from trusted brands and artisans worldwide.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="p-2 bg-rose-100 rounded-lg mr-4">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Personalized Service</h3>
                    <p className="text-gray-600">Every project is unique, and we tailor our approach to match your specific needs and vision.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop&crop=center"
                  alt="Design consultation"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>
          </div>
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
              Ready to Start Your Design Journey?
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Book a consultation today and let's bring your vision to life
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors"
              >
                Book Consultation
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center px-8 py-4 border border-white text-white font-medium rounded-md hover:bg-white hover:text-gray-900 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}