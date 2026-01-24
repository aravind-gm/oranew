'use client';

import Link from 'next/link';
import { useState } from 'react';

const faqs = [
  {
    category: 'Orders & Shipping',
    questions: [
      {
        q: 'How long does shipping take?',
        a: 'We offer free shipping on orders above ₹5,000. Standard delivery takes 5-7 business days. Express shipping (2-3 days) is available at checkout.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Currently, we only ship within India. International shipping will be available soon.',
      },
      {
        q: 'How can I track my order?',
        a: 'Once your order ships, you\'ll receive a tracking number via email. You can also track orders from your account dashboard.',
      },
    ],
  },
  {
    category: 'Returns & Exchanges',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We offer a 7-day return policy for all jewellery. Items must be unused and in original packaging. Custom orders cannot be returned.',
      },
      {
        q: 'How do I return an item?',
        a: 'Go to your order history, select the order, and click "Request Return". Our team will guide you through the process.',
      },
      {
        q: 'When will I receive my refund?',
        a: 'Refunds are processed within 7-10 business days after we receive the returned item.',
      },
    ],
  },
  {
    category: 'Products & Care',
    questions: [
      {
        q: 'Are your products made of real gold/silver?',
        a: 'Yes, all our products are made from genuine materials. Each item comes with a certificate of authenticity.',
      },
      {
        q: 'How do I care for my jewellery?',
        a: 'Store in a cool, dry place. Clean with a soft cloth. Avoid contact with perfumes, lotions, and water. Visit our Care Guide for detailed instructions.',
      },
      {
        q: 'Do you offer customization?',
        a: 'Yes! We offer custom engraving and design services. Contact our customer support for more details.',
      },
    ],
  },
  {
    category: 'Payment & Security',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit/debit cards, UPI, net banking, and digital wallets through our secure Razorpay payment gateway.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes, all transactions are encrypted and processed through Razorpay\'s secure payment gateway. We never store your card details.',
      },
      {
        q: 'Can I pay cash on delivery?',
        a: 'Cash on delivery is available for orders below ₹50,000.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container-luxury max-w-4xl">
        <Link href="/" className="text-accent hover:underline mb-6 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-serif font-bold text-text-primary mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-text-secondary mb-12">
          Find answers to common questions about our products, shipping, and policies.
        </p>

        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
                {category.category}
              </h2>
              <div className="space-y-3">
                {category.questions.map((faq, faqIndex) => {
                  const itemId = `${categoryIndex}-${faqIndex}`;
                  const isOpen = openItems.includes(itemId);

                  return (
                    <div
                      key={itemId}
                      className="bg-background-white rounded-xl shadow-luxury overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="w-full text-left p-6 flex justify-between items-center hover:bg-primary/5 transition-colors"
                      >
                        <span className="font-medium text-text-primary pr-4">{faq.q}</span>
                        <svg
                          className={`w-5 h-5 text-accent transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-6 text-text-secondary">
                          <p>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-8 bg-primary/10 rounded-2xl text-center">
          <h3 className="text-xl font-serif font-semibold text-text-primary mb-2">
            Still have questions?
          </h3>
          <p className="text-text-secondary mb-4">
            Our customer support team is here to help
          </p>
          <a
            href="mailto:support@orajewellery.com"
            className="btn-primary inline-block"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
