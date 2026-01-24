import Link from 'next/link';

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
              Gold Jewellery Care
            </h2>
            <p>Gold is durable but requires regular cleaning to maintain its shine:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Soak in warm water with mild soap for 10-15 minutes</li>
              <li>Gently scrub with a soft-bristled brush</li>
              <li>Rinse thoroughly and dry with a soft cloth</li>
              <li>Professional cleaning recommended every 6 months</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Silver Jewellery Care
            </h2>
            <p>Silver tarnishes naturally but can be easily restored:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Use a silver polishing cloth regularly</li>
              <li>Store in anti-tarnish bags or with silica gel packets</li>
              <li>Avoid exposure to sulfur-containing foods (eggs, onions)</li>
              <li>Professional cleaning for intricate designs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Diamond & Gemstone Care
            </h2>
            <p>Keep your precious stones sparkling:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Clean with warm soapy water and a soft brush</li>
              <li>Check settings regularly for loose stones</li>
              <li>Avoid harsh chemicals and ultrasonic cleaners for delicate stones</li>
              <li>Professional inspection recommended annually</li>
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
              Professional Services
            </h2>
            <p>
              ORA offers professional cleaning and maintenance services for all jewellery purchased from us. 
              Contact our customer service to schedule an appointment.
            </p>
            <div className="bg-background-white p-6 rounded-xl shadow-luxury mt-4">
              <h3 className="font-semibold text-text-primary mb-3">Services Offered:</h3>
              <ul className="space-y-2">
                <li>✨ Professional cleaning</li>
                <li>🔍 Stone inspection and tightening</li>
                <li>✏️ Engraving services</li>
                <li>🔧 Ring resizing</li>
                <li>💎 Stone replacement</li>
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
              <p><strong>Email:</strong> care@orajewellery.com</p>
              <p><strong>Phone:</strong> +91-XXXX-XXXXXX</p>
            </div>
            <a href="mailto:care@orajewellery.com" className="btn-primary inline-block">
              Contact Care Team
            </a>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-sm text-text-muted">
          <p>Last updated: January 12, 2026</p>
        </div>
      </div>
    </div>
  );
}
