export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container-luxury">
        <h1 className="text-4xl font-serif font-bold text-text-primary mb-6">
          My Profile
        </h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="bg-background-white rounded-luxury p-6 shadow-luxury h-fit">
            <nav className="space-y-2">
              <a href="#" className="block px-4 py-2 rounded bg-primary/10 text-primary font-medium">
                Profile
              </a>
              <a href="#" className="block px-4 py-2 rounded hover:bg-primary/5 transition-colors">
                Orders
              </a>
              <a href="#" className="block px-4 py-2 rounded hover:bg-primary/5 transition-colors">
                Wishlist
              </a>
              <a href="#" className="block px-4 py-2 rounded hover:bg-primary/5 transition-colors">
                Addresses
              </a>
              <a href="#" className="block px-4 py-2 rounded hover:bg-primary/5 transition-colors text-red-600">
                Logout
              </a>
            </nav>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-2 bg-background-white rounded-luxury p-8 shadow-luxury">
            <h2 className="text-2xl font-serif font-semibold mb-6">Personal Information</h2>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <input type="text" className="input-luxury" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <input type="text" className="input-luxury" placeholder="Doe" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" className="input-luxury" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input type="tel" className="input-luxury" placeholder="+91 98765 43210" />
              </div>
              <button type="submit" className="btn-primary">Update Profile</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
