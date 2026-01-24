'use client';

import ProductGallery from '@/components/product/ProductGallery';
import ProductSpecs from '@/components/product/ProductSpecs';
import RecentlyViewedProducts from '@/components/product/RecentlyViewedProducts';
import RelatedProducts from '@/components/product/RelatedProducts';
import ReviewSection from '@/components/product/ReviewSection';
import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useProductStore } from '@/store/productStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { AlertTriangle, Check, ChevronRight, Heart, Minus, Plus, ShoppingCart, Truck } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProductImage {
  id: string;
  imageUrl: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPercent: number;
  finalPrice: number;
  stockQuantity: number;
  material: string;
  weight: string;
  dimensions: string;
  careInstructions: string;
  averageRating: number;
  reviewCount: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: ProductImage[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem: addToCart } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, items: wishlistItems } = useWishlistStore();
  const { addToRecentlyViewed } = useProductStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/products/${slug}`);
        const fetchedProduct = response.data.data;
        setProduct(fetchedProduct);
        
        // Add to recently viewed
        if (fetchedProduct) {
          const primaryImage = fetchedProduct.images?.find((img: ProductImage) => img.isPrimary) || fetchedProduct.images?.[0];
          addToRecentlyViewed({
            productId: fetchedProduct.id,
            slug: fetchedProduct.slug,
            name: fetchedProduct.name,
            image: primaryImage?.imageUrl || '',
            price: fetchedProduct.finalPrice,
          });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        alert('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug, addToRecentlyViewed]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="h-96 bg-gray-200 rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Link href="/products" className="text-blue-600 hover:underline">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const isInWishlist = wishlistItems.some((item) => item.productId === product.id);
  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 5;

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
      addToCart({
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.finalPrice,
        image: primaryImage?.imageUrl || '/placeholder.png',
        quantity,
        stockQuantity: product.stockQuantity,
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch {
      alert('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = () => {
    const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
    if (isInWishlist) {
      removeFromWishlist(product.id);
      alert('Removed from wishlist');
    } else {
      addToWishlist({
        id: product.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.finalPrice,
        image: primaryImage?.imageUrl || '/placeholder.png',
      });
      alert('Added to wishlist');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/products" className="hover:text-blue-600">
              Products
            </Link>
            <ChevronRight size={16} className="text-gray-400" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-blue-600">
              {product.category.name}
            </Link>
            <ChevronRight size={16} className="text-gray-400" />
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          {/* Product Gallery */}
          <div>
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Breadcrumb Category */}
            <div>
              <span className="text-sm font-medium text-blue-600 uppercase">
                {product.category.name}
              </span>
            </div>

            {/* Title & Rating */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-600">
                  {Number(product.averageRating).toFixed(1)} ({product.reviewCount} reviews)
                </p>
              </div>
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-gray-600 text-lg">{product.shortDescription}</p>
            )}

            {/* Pricing */}
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-gray-900">
                  ₹{Number(product.finalPrice).toFixed(2)}
                </span>
                {product.discountPercent > 0 && (
                  <>
                    <span className="text-lg text-gray-500 line-through">
                      ₹{Number(product.price).toFixed(2)}
                    </span>
                    <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                      {Math.round(Number(product.discountPercent))}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div>
              {isOutOfStock ? (
                <div className="inline-block px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium">
                  Out of Stock
                </div>
              ) : isLowStock ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium">
                  <AlertTriangle size={16} />
                  Only {product.stockQuantity} left - Order soon!
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                  <Check size={16} />
                  In Stock
                </div>
              )}
            </div>

            {/* Quantity Selector & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Minus size={18} className="text-gray-600" />
                  </button>
                  <span className="px-6 py-2 font-medium text-gray-900 border-l border-r border-gray-300">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                    disabled={isOutOfStock || quantity >= product.stockQuantity}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Plus size={18} className="text-gray-600" />
                  </button>
                </div>

                <button
                  onClick={handleWishlistToggle}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  type="button"
                >
                  <Heart
                    size={20}
                    className={isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                  />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAddingToCart}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  addedToCart 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                type="button"
              >
                {addedToCart ? (
                  <>
                    <Check size={20} />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    <span>{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
                  </>
                )}
              </button>

              {/* View Cart Link */}
              {addedToCart && (
                <Link 
                  href="/cart" 
                  className="block w-full py-2 text-center text-amber-600 font-medium hover:underline"
                >
                  View Cart →
                </Link>
              )}
            </div>

            {/* Delivery Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Truck size={18} className="text-amber-500" />
                <span className="text-gray-700">Free delivery on orders above ₹999</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Check size={18} className="text-green-500" />
                <span className="text-gray-700">Easy 7-day returns</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 pt-6">
              {/* Share & More Options */}
              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  <strong>SKU:</strong> {`ORA-${product.id.slice(0, 8).toUpperCase()}`}
                </p>
                <p>
                  <strong>Category:</strong> {product.category.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* Specifications */}
            <ProductSpecs
              specs={{
                material: product.material,
                weight: product.weight,
                dimensions: product.dimensions,
                careInstructions: product.careInstructions,
              }}
            />

            {/* Reviews Section */}
            <ReviewSection
              productId={product.id}
              productName={product.name}
              averageRating={product.averageRating}
              reviewCount={product.reviewCount}
            />
          </div>

          {/* Sidebar - Similar Products */}
          <div>
            <RelatedProducts
              categoryId={product.category.id}
              currentProductId={product.id}
              limit={3}
            />
          </div>
        </div>

        {/* Recently Viewed Products Section */}
        <div className="mt-16 border-t pt-12">
          <RecentlyViewedProducts 
            excludeProductId={product.id} 
            layout="horizontal"
          />
        </div>
      </div>
    </div>
  );
}
