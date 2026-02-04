import Link from 'next/link';

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container-luxury max-w-4xl">
        <Link href="/" className="text-accent hover:underline mb-6 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-serif font-bold text-text-primary mb-8">Shipping Policy</h1>

        <div className="prose prose-lg max-w-none text-text-secondary space-y-8">
          <section className="bg-background-white p-6 rounded-2xl shadow-luxury">
            <h2 className="text-2xl font-serif font-semibold text-text-primary mb-4">
              Shipping Options
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border border-border rounded-xl">
                <div>
                  <h3 className="font-semibold text-text-primary">Standard Shipping</h3>
                  <p className="text-sm text-text-muted">5-7 business days</p>
                </div>
                <span className="font-semibold text-accent">FREE on orders above ₹5,000</span>
              </div>
              <div className="flex justify-between items-center p-4 border border-border rounded-xl">
                <div>
                  <h3 className="font-semibold text-text-primary">Express Shipping</h3>
                  <p className="text-sm text-text-muted">2-3 business days</p>
                </div>
                <span className="font-semibold text-accent">₹200</span>
              </div>
              <div className="flex justify-between items-center p-4 border border-border rounded-xl">
                <div>
                  <h3 className="font-semibold text-text-primary">Same Day Delivery</h3>
                  <p className="text-sm text-text-muted">Available in select cities</p>
                </div>
                <span className="font-semibold text-accent">₹500</span>
              </div>
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
              Shipping Charges
            </h2>
            <p>
              Shipping charges are calculated based on the delivery location and weight of the package. 
              You can view the exact shipping cost at checkout before completing your order.
            </p>
            <div className="bg-primary/10 p-4 rounded-xl mt-4">
              <p className="font-semibold text-accent">✨ Pro Tip: Enjoy FREE shipping on all orders above ₹5,000!</p>
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
              at <a href="mailto:support@orajewellery.com" className="text-accent hover:underline">
                support@orajewellery.com
              </a> or call us at +91-XXXX-XXXXXX.
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
