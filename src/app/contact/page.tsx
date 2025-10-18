'use client';

import { useState } from 'react';
import { motion, Variants, cubicBezier } from 'framer-motion';
import Image from 'next/image';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

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

const contactInfo = [
  {
    icon: EnvelopeIcon,
    title: 'Email Us',
    info: 'hello@Elanorraliving.com',
    subInfo: 'We reply within 24 hours',
  },
  {
    icon: PhoneIcon,
    title: 'Call Us',
    info: '+91 9876543210',
    subInfo: 'Mon-Sat 9AM-8PM',
  },
  {
    icon: MapPinIcon,
    title: 'Visit Showroom',
    info: 'Bandra West, Mumbai',
    subInfo: 'By appointment only',
  },
  {
    icon: ClockIcon,
    title: 'Business Hours',
    info: 'Mon-Sat: 9AM-8PM',
    subInfo: 'Sunday: 10AM-6PM',
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    service: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast.success('Thank you for your message! We\'ll get back to you soon.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      service: '',
    });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[50vh] bg-gray-900 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://res.cloudinary.com/demo/image/upload/w_1600,h_900,c_fill/ecommerce/banners/contact-hero"
            alt="Contact Elanorra Living"
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
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Get In Touch</h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              Let's create something beautiful together
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Send Us a Message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                        placeholder="+91 9876543210"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                        Service Interest
                      </label>
                      <select
                        id="service"
                        name="service"
                        value={formData.service}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                      >
                        <option value="">Select a service</option>
                        <option value="consultation">Design Consultation</option>
                        <option value="room-makeover">Complete Room Makeover</option>
                        <option value="personal-shopping">Personal Shopping</option>
                        <option value="custom-furniture">Custom Furniture</option>
                        <option value="delivery">White Glove Delivery</option>
                        <option value="support">Ongoing Support</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors resize-none"
                      placeholder="Tell us about your project, questions, or how we can help..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 px-6 rounded-md font-medium transition-colors ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-rose-600 hover:bg-rose-700'
                    } text-white`}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </motion.div>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
                  <div className="space-y-6">
                    {contactInfo.map((item, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-shrink-0 p-3 bg-rose-100 rounded-xl">
                          <item.icon className="h-6 w-6 text-rose-600" />
                        </div>
                        <div className="ml-4">
                          <h4 className="text-lg font-semibold text-gray-900">{item.title}</h4>
                          <p className="text-gray-700 font-medium">{item.info}</p>
                          <p className="text-gray-500 text-sm">{item.subInfo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Contact Cards */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-6 rounded-2xl">
                    <div className="flex items-center mb-3">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2" />
                      <span className="font-semibold">Quick Response</span>
                    </div>
                    <p className="text-sm opacity-90">
                      Need immediate assistance? Our team is available for urgent queries.
                    </p>
                    <button className="mt-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                      Live Chat
                    </button>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <h4 className="font-semibold text-gray-900 mb-2">Schedule a Consultation</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Book a free 30-minute design consultation with our experts.
                    </p>
                    <button className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                      Book Now
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Visit Our Showroom
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Experience our collections in person at our beautifully curated showroom in Mumbai
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 h-96">
                {/* Replace with actual map integration */}
                <div className="bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Interactive Map</p>
                    <p className="text-gray-500 text-sm">Showroom Location: Bandra West, Mumbai</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Address</h4>
                    <p className="text-gray-600">
                      123 Design Street<br />
                      Bandra West, Mumbai<br />
                      Maharashtra 400050
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Parking</h4>
                    <p className="text-gray-600">
                      Complimentary valet parking<br />
                      available for showroom visitors
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Appointment</h4>
                    <p className="text-gray-600">
                      Showroom visits by appointment<br />
                      Call ahead to schedule your visit
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}