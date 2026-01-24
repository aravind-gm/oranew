export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container-luxury">
        <h1 className="text-4xl font-serif font-bold text-text-primary mb-6 text-center">
          About ORA
        </h1>
        <p className="text-xl text-text-secondary mb-12 text-center max-w-2xl mx-auto">
          own. radiate. adorn.
        </p>
        
        <div className="space-y-12">
          <div className="bg-background-white rounded-luxury p-8 shadow-luxury">
            <h2 className="text-2xl font-serif font-semibold mb-4">Our Story</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              ORA was founded with a vision to bring premium, affordable fashion jewellery 
              to the modern woman. We believe that every woman deserves to shine and express 
              her unique style without breaking the bank.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Our collection features carefully curated pieces that blend contemporary design 
              with timeless elegance. Each piece is crafted with attention to detail, ensuring 
              you get the best quality artificial jewellery that looks and feels luxurious.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background-white rounded-luxury p-8 shadow-luxury text-center">
              <div className="text-4xl font-serif font-bold text-primary mb-2">500+</div>
              <p className="text-text-muted">Products</p>
            </div>
            <div className="bg-background-white rounded-luxury p-8 shadow-luxury text-center">
              <div className="text-4xl font-serif font-bold text-primary mb-2">10K+</div>
              <p className="text-text-muted">Happy Customers</p>
            </div>
            <div className="bg-background-white rounded-luxury p-8 shadow-luxury text-center">
              <div className="text-4xl font-serif font-bold text-primary mb-2">4.8★</div>
              <p className="text-text-muted">Average Rating</p>
            </div>
          </div>
          
          <div className="bg-background-white rounded-luxury p-8 shadow-luxury">
            <h2 className="text-2xl font-serif font-semibold mb-4">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Quality</h3>
                <p className="text-text-secondary text-sm">
                  We ensure every piece meets our high standards of craftsmanship and durability.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Affordability</h3>
                <p className="text-text-secondary text-sm">
                  Luxury shouldn't be expensive. We offer premium designs at accessible prices.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Style</h3>
                <p className="text-text-secondary text-sm">
                  Our designs are contemporary, versatile, and perfect for any occasion.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Customer First</h3>
                <p className="text-text-secondary text-sm">
                  Your satisfaction is our priority. We're here to help you shine.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
