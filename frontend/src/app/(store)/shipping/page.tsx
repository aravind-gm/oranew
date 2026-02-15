import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy - Free Delivery Across India',
  description: 'ORA Jewellery offers free shipping on all orders across India. Learn about delivery timelines, tracking, and packaging.',
  alternates: {
    canonical: 'https://orashop.in/shipping',
  },
  openGraph: {
    title: 'Shipping Policy - ORA Jewellery',
    description: 'Free delivery on all orders across India.',
    url: 'https://orashop.in/shipping',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Shipping Policy - ORA Jewellery',
  },
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container-luxury max-w-4xl">
        <Link href="/" className="text-accent hover:underline mb-6 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-serif font-bold text-text-primary mb-8">Shipping Policy</h1>

        <div className="prose prose-lg max-w-none text-text-secondary space-y-8">
          <section className="bg-accent/10 p-6 rounded-2xl">
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Free Delivery Across India
            </h2>
            <p className="text-lg">
              We offer free delivery on all orders, no minimum purchase required. Your jewellery will be delivered safely to your doorstep.
            </p>
          </section>

          <section className="bg-background-white p-6 rounded-2xl shadow-luxury mt-6">
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Delivery Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border border-border rounded-xl">
                <div>
                  <h3 className="font-semibold text-text-primary">Standard Delivery</h3>
                  <p className="text-sm text-text-muted">All orders</p>
                </div>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-sm text-text-secondary">
                <li>Metro cities: 3-5 business days</li>
                <li>Tier 2 cities: 4-6 business days</li>
                <li>Remote areas: 5-7 business days</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Processing Time
            </h2>
            <p>
              All orders are processed within 1-2 business days. Orders placed on weekends or holidays 
              will be processed on the next business day.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Delivery Areas
            </h2>
            <p>
              We currently deliver to all locations across India. International shipping will be available soon.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Metro cities: 2-3 business days</li>
              <li>Tier 2 cities: 3-5 business days</li>
              <li>Remote areas: 5-7 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Order Tracking
            </h2>
            <p>
              Once your order is shipped, you will receive a confirmation email with a tracking number. 
              You can track your order status from your account dashboard or by clicking the tracking 
              link in the email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              No Hidden Charges
            </h2>
            <p>
              Delivery is always free for all orders across India. The price you see at checkout is the final price you pay.
            </p>
            <div className="bg-emerald-50 p-4 rounded-xl mt-4">
              <p className="font-semibold text-emerald-700">✨ Free delivery on every order, no minimum required!</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Packaging
            </h2>
            <p>
              All jewellery is carefully packaged in premium gift boxes with protective cushioning. 
              Each order includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Elegant ORA gift box</li>
              <li>Certificate of authenticity</li>
              <li>Care instructions</li>
              <li>Invoice and warranty card</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Delivery Issues
            </h2>
            <p>
              If you experience any issues with your delivery, please contact our customer support team 
              at <a href="mailto:admin@orashop.in" className="text-accent hover:underline">
                admin@orashop.in
              </a> or call us at 9842253984, 9095007887, 9342865987.
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
