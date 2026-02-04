export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container-luxury">
        <h1 className="text-4xl font-serif font-bold text-text-primary mb-6">
          Contact Us
        </h1>
        <p className="text-text-secondary mb-8">
          Get in touch with us for any inquiries.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-background-white rounded-luxury p-8 shadow-luxury">
            <h2 className="text-2xl font-serif font-semibold mb-4">Send us a message</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input type="text" className="input-luxury" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" className="input-luxury" placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea className="input-luxury" rows={5} placeholder="Your message"></textarea>
              </div>
              <button type="submit" className="btn-primary w-full">Send Message</button>
            </form>
          </div>
          
          <div className="bg-background-white rounded-luxury p-8 shadow-luxury">
            <h2 className="text-2xl font-serif font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Email</h3>
                <p className="text-text-muted">hello@orashop.in</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Phone</h3>
                <p className="text-text-muted">+91 98765 43210</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Address</h3>
                <p className="text-text-muted">
                  123 Fashion Street<br />
                  Mumbai, Maharashtra 400001<br />
                  India
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
