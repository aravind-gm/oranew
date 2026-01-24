import Link from 'next/link';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container-luxury max-w-4xl">
        <Link href="/" className="text-accent hover:underline mb-6 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-serif font-bold text-text-primary mb-8">Returns & Refunds</h1>

        <div className="prose prose-lg max-w-none text-text-secondary space-y-8">
          <section className="bg-accent/10 p-6 rounded-2xl">
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              7-Day Return Policy
            </h2>
            <p className="text-lg">
              We offer a hassle-free 7-day return policy on all jewellery purchases. Your satisfaction 
              is our priority.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Eligibility Criteria
            </h2>
            <p>To be eligible for a return, items must meet the following conditions:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Item must be unused and in the same condition that you received it</li>
              <li>Must be in the original packaging with all tags attached</li>
              <li>Certificate of authenticity and invoice must be included</li>
              <li>Return request must be initiated within 7 days of delivery</li>
            </ul>
            <div className="bg-error/10 p-4 rounded-xl mt-4 border border-error/30">
              <p className="font-semibold text-error">⚠️ Non-Returnable Items:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Custom-made or personalized jewellery</li>
                <li>Items purchased during final sale events</li>
                <li>Engraved items</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              How to Initiate a Return
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Login to Your Account</h3>
                  <p>Go to your order history in the account dashboard</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Select the Order</h3>
                  <p>Find the order you want to return and click &quot;Request Return&quot;</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Choose Reason</h3>
                  <p>Select the reason for return and provide additional details if needed</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-semibold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Ship the Item</h3>
                  <p>Pack the item securely and ship it to our returns address</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Refund Process
            </h2>
            <p>Once we receive and inspect your returned item:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>You will receive an email confirmation of receipt</li>
              <li>Inspection takes 2-3 business days</li>
              <li>If approved, refund will be processed to your original payment method</li>
              <li>Refunds typically appear in your account within 7-10 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Exchanges
            </h2>
            <p>
              We currently do not offer direct exchanges. If you need a different size or style, 
              please return the original item and place a new order.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Return Shipping
            </h2>
            <p>
              Customers are responsible for return shipping costs unless the return is due to our error 
              (defective or incorrect item). We recommend using a tracked shipping service for returns.
            </p>
            <div className="bg-primary/10 p-4 rounded-xl mt-4">
              <p className="font-semibold text-accent">
                💡 Tip: Keep your shipping receipt until you receive your refund confirmation.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Damaged or Defective Items
            </h2>
            <p>
              If you receive a damaged or defective item, please contact us immediately at{' '}
              <a href="mailto:support@orajewellery.com" className="text-accent hover:underline">
                support@orajewellery.com
              </a>{' '}
              with photos of the damage. We will arrange for a free replacement or full refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Contact Us
            </h2>
            <p>
              For any questions about our return policy, please reach out to our customer service team:
            </p>
            <div className="bg-background-white p-6 rounded-xl shadow-luxury mt-4">
              <p><strong>Email:</strong> support@orajewellery.com</p>
              <p><strong>Phone:</strong> +91-XXXX-XXXXXX</p>
              <p><strong>Hours:</strong> Monday - Saturday, 10:00 AM - 6:00 PM IST</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-sm text-text-muted">
          <p>Last updated: January 12, 2026</p>
        </div>
      </div>
    </div>
  );
}
