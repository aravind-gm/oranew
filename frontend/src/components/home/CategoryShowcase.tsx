export default function CategoryShowcase() {
  return (
    <section className="section-luxury bg-background-white">
      <div className="container-luxury">
        <div className="text-center mb-16">
          <h2 className="heading-section mb-4">Jewellery for Every Occasion</h2>
          <p className="text-luxury max-w-2xl mx-auto">
            From everyday elegance to statement pieces for special moments,
            find the perfect jewellery to express your style.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Casual */}
          <div className="card-luxury p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-serif text-2xl mb-3">Everyday Elegance</h3>
            <p className="text-text-secondary mb-6">
              Subtle, refined pieces that complement your daily style with effortless grace.
            </p>
          </div>

          {/* Festive */}
          <div className="card-luxury p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="font-serif text-2xl mb-3">Festive Glamour</h3>
            <p className="text-text-secondary mb-6">
              Radiant designs that capture the joy and celebration of special occasions.
            </p>
          </div>

          {/* Wedding */}
          <div className="card-luxury p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="font-serif text-2xl mb-3">Bridal Collection</h3>
            <p className="text-text-secondary mb-6">
              Exquisite pieces to adorn your most precious moments and memories.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
