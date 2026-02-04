import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container-luxury max-w-4xl">
        <Link href="/" className="text-accent hover:underline mb-6 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-serif font-bold text-text-primary mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none text-text-secondary space-y-6">
          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing and using ORA Jewellery website, you agree to be bound by these Terms of Service 
              and all applicable laws and regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">2. Use License</h2>
            <p>
              Permission is granted to temporarily access the materials on ORA Jewellery&apos;s website for personal, 
              non-commercial transitory viewing only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">3. Product Information</h2>
            <p>
              We strive to provide accurate product descriptions and images. However, we do not warrant that 
              product descriptions or other content is accurate, complete, reliable, current, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">4. Pricing</h2>
            <p>
              All prices are in Indian Rupees (INR) and are subject to change without notice. We reserve the 
              right to modify or discontinue products without prior notification.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">5. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password. You agree 
              to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">6. Limitation of Liability</h2>
            <p>
              ORA Jewellery shall not be liable for any indirect, incidental, special, consequential, or 
              punitive damages resulting from your use of or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">7. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:support@orajewellery.com" className="text-accent hover:underline">
                support@orajewellery.com
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
