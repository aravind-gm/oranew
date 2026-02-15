'use client';

/**
 * Contact Page — Refined contact page with baby pink theme
 * Clean layout, ORA brand information, premium design
 * ORA Design System
 */

import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Truck, Shield, CheckCircle, Package } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    orderId: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-16 sm:py-20 border-b" style={{ borderColor: '#F6C1CF' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-serif text-4xl sm:text-5xl font-light text-[#111111] mb-4"
          >
            Contact ORA
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto"
          >
            We're here to help with orders, returns, collaborations, or general inquiries.
          </motion.p>
        </div>
      </section>

      {/* Two Column Layout */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left: Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="font-serif text-2xl font-medium text-[#111111] mb-6">
                Send us a message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-[#111111] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#E75480] focus:ring-2 focus:ring-[#E75480]/20 outline-none transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#111111] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#E75480] focus:ring-2 focus:ring-[#E75480]/20 outline-none transition-all"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#111111] mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#E75480] focus:ring-2 focus:ring-[#E75480]/20 outline-none transition-all"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div>
                  <label htmlFor="orderId" className="block text-sm font-medium text-[#111111] mb-2">
                    Order ID <span className="text-neutral-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="orderId"
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#E75480] focus:ring-2 focus:ring-[#E75480]/20 outline-none transition-all"
                    placeholder="Enter order ID if applicable"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-[#111111] mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#E75480] focus:ring-2 focus:ring-[#E75480]/20 outline-none transition-all resize-none"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl text-white font-medium transition-all duration-200"
                  style={{ backgroundColor: '#E75480' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#C2185B')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E75480')}
                >
                  Send Message
                </button>
              </form>
            </motion.div>

            {/* Right: Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl border border-neutral-200 p-8 space-y-8"
            >
              <h2 className="font-serif text-2xl font-medium text-[#111111] mb-6">
                Contact Information
              </h2>

              {/* Phone Numbers */}
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(231, 84, 128, 0.1)' }}
                  >
                    <Phone size={18} style={{ color: '#E75480' }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#111111] mb-2">Phone</h3>
                    <div className="space-y-1 text-sm text-neutral-600">
                      <p>9842253984</p>
                      <p>9095007887</p>
                      <p>9342865987</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(231, 84, 128, 0.1)' }}
                >
                  <Mail size={18} style={{ color: '#E75480' }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111111] mb-2">Email</h3>
                  <a
                    href="mailto:admin@orashop.in"
                    className="text-sm text-neutral-600 hover:text-[#E75480] transition-colors"
                  >
                    admin@orashop.in
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(231, 84, 128, 0.1)' }}
                >
                  <MapPin size={18} style={{ color: '#E75480' }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111111] mb-2">Address</h3>
                  <address className="text-sm text-neutral-600 not-italic leading-relaxed">
                    ORA Global<br />
                    18 Karunagarapuri, Golden Nagar<br />
                    Tiruppur<br />
                    Tamil Nadu 641607<br />
                    India
                  </address>
                </div>
              </div>

              {/* Support Hours */}
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(231, 84, 128, 0.1)' }}
                >
                  <Clock size={18} style={{ color: '#E75480' }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111111] mb-2">Support Hours</h3>
                  <div className="text-sm text-neutral-600 space-y-1">
                    <p>Monday – Saturday</p>
                    <p>10:00 AM – 6:00 PM IST</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-12 sm:py-16" style={{ backgroundColor: '#FDECEF' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: 'rgba(231, 84, 128, 0.1)' }}
              >
                <Truck size={20} style={{ color: '#E75480' }} />
              </div>
              <h3 className="text-sm font-semibold text-[#111111] mb-1">
                Free Delivery Across India
              </h3>
              <p className="text-xs text-neutral-600">On all orders</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: 'rgba(231, 84, 128, 0.1)' }}
              >
                <CheckCircle size={20} style={{ color: '#E75480' }} />
              </div>
              <h3 className="text-sm font-semibold text-[#111111] mb-1">5-Day Easy Returns</h3>
              <p className="text-xs text-neutral-600">Hassle-free process</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: 'rgba(231, 84, 128, 0.1)' }}
              >
                <Shield size={20} style={{ color: '#E75480' }} />
              </div>
              <h3 className="text-sm font-semibold text-[#111111] mb-1">Secure Checkout</h3>
              <p className="text-xs text-neutral-600">Safe payment methods</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: 'rgba(231, 84, 128, 0.1)' }}
              >
                <Package size={20} style={{ color: '#E75480' }} />
              </div>
              <h3 className="text-sm font-semibold text-[#111111] mb-1">Premium Craftsmanship</h3>
              <p className="text-xs text-neutral-600">Quality materials</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
