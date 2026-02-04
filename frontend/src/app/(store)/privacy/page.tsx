import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container-luxury max-w-4xl">
        <Link href="/" className="text-accent hover:underline mb-6 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-serif font-bold text-text-primary mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none text-text-secondary space-y-6">
          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, including your name, email address, phone number, 
              shipping address, and payment information when you create an account or make a purchase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Send you order confirmations and shipping updates</li>
              <li>Respond to your comments and questions</li>
              <li>Send you promotional communications (with your consent)</li>
              <li>Improve our products and services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">3. Information Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share your 
              information with trusted service providers who assist us in operating our website and conducting 
              our business.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information. However, no method 
              of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">5. Cookies</h2>
            <p>
              We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
              You can choose to disable cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new policy on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">8. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@orajewellery.com" className="text-accent hover:underline">
                privacy@orajewellery.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-sm text-text-muted">
          <p>Last updated: January 12, 2026</p>
        </div>
      </div>
    </div>
  );
}
