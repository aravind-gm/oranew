import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jewellery Care Guide - Keep Your Jewellery Sparkling',
  description: 'Learn how to care for your ORA fashion jewellery. Expert tips on cleaning, storage, and maintenance to keep your pieces looking new.',
  alternates: {
    canonical: 'https://orashop.in/care',
  },
  openGraph: {
    title: 'Jewellery Care Guide - ORA Jewellery',
    description: 'Keep your ORA jewellery sparkling with expert care tips.',
    url: 'https://orashop.in/care',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Jewellery Care Guide - ORA',
  },
};

export default function CarePage() {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container-luxury max-w-4xl">
        <Link href="/" className="text-accent hover:underline mb-6 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-serif font-bold text-text-primary mb-4">
          Jewellery Care Guide
        </h1>
        <p className="text-xl text-text-secondary mb-12">
          Keep your ORA jewellery sparkling for years to come with proper care
        </p>

        <div className="prose prose-lg max-w-none text-text-secondary space-y-8">
          <section className="bg-background-white p-8 rounded-2xl shadow-luxury">
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-6">
              General Care Tips
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">Clean Regularly</h3>
                  <p className="text-sm">Wipe with a soft cloth after each wear</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">Store Properly</h3>
                  <p className="text-sm">Keep in original box or soft pouch</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">Avoid Chemicals</h3>
                  <p className="text-sm">Remove before applying perfume or lotion</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">Handle with Care</h3>
                  <p className="text-sm">Remove during physical activities</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Fashion Jewellery Care
            </h2>
            <p>Fashion and plated jewellery needs gentle care to maintain its finish:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Wipe gently with a soft, dry cloth after every wear</li>
              <li>Remove before washing hands, bathing, or swimming</li>
              <li>Apply perfume, hairspray, and lotions before wearing your jewellery</li>
              <li>Avoid contact with water, sweat, and chemicals to preserve plating</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Maintaining the Finish
            </h2>
            <p>Keep your gold-plated and silver-finished pieces looking new:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Store each piece individually in a soft cloth or zip-lock bag</li>
              <li>Keep away from direct sunlight and humid environments</li>
              <li>Do not use harsh cleaning agents or jewellery dips</li>
              <li>Use a microfibre cloth to gently buff and restore shine</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Stone & Embellishment Care
            </h2>
            <p>For pieces with artificial stones or rhinestones:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Handle gently — do not bend or pull at stone settings</li>
              <li>Clean around stones with a soft brush if needed</li>
              <li>Avoid knocking stones against hard surfaces</li>
              <li>If a stone feels loose, stop wearing the piece and contact us</li>
            </ul>
          </section>

          <section className="bg-error/10 p-6 rounded-2xl border border-error/30">
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              What to Avoid
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Swimming pools (chlorine damages metals)</li>
              <li>Hot tubs and saunas</li>
              <li>Household cleaning products</li>
              <li>Hairspray and other cosmetics</li>
              <li>Direct sunlight for prolonged periods</li>
              <li>Abrasive materials and surfaces</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Storage Best Practices
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div className="bg-background-white p-6 rounded-xl shadow-luxury">
                <h3 className="font-semibold text-text-primary mb-3">✓ Do:</h3>
                <ul className="space-y-2 text-sm">
                  <li>Store each piece separately</li>
                  <li>Use original boxes or soft pouches</li>
                  <li>Keep in a cool, dry place</li>
                  <li>Use anti-tarnish strips for silver</li>
                </ul>
              </div>
              <div className="bg-background-white p-6 rounded-xl shadow-luxury">
                <h3 className="font-semibold text-text-primary mb-3">✗ Don&apos;t:</h3>
                <ul className="space-y-2 text-sm">
                  <li>Store different metals together</li>
                  <li>Leave in humid bathrooms</li>
                  <li>Pile pieces on top of each other</li>
                  <li>Expose to direct sunlight</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Our Warranty
            </h2>
            <p>
              All ORA pieces come with a quality assurance guarantee. If you notice any defects 
              within our return window, we&apos;re happy to assist with an exchange or refund.
            </p>
            <div className="bg-background-white p-6 rounded-xl shadow-luxury mt-4">
              <h3 className="font-semibold text-text-primary mb-3">What We Cover:</h3>
              <ul className="space-y-2">
                <li>✨ Manufacturing defects</li>
                <li>🔍 Loose stones on delivery</li>
                <li>📦 Damage during shipping</li>
              </ul>
            </div>
          </section>

          <section className="bg-accent/10 p-8 rounded-2xl text-center">
            <h3 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Need Expert Advice?
            </h3>
            <p className="mb-6">
              Our jewellery care specialists are here to help you maintain your precious pieces.
            </p>
            <div className="space-y-2 mb-6">
              <p><strong>Email:</strong> admin@orashop.in</p>
              <p><strong>Phone:</strong> 9842253984, 9095007887, 9342865987</p>
            </div>
            <a href="mailto:admin@orashop.in" className="btn-primary inline-block">
              Contact Care Team
            </a>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-sm text-text-muted">
          <p>Last updated: March 4, 2026</p>
        </div>
      </div>
    </div>
  );
}
