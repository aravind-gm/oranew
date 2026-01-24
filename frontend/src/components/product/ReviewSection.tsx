'use client';

import StarRating from '@/components/common/StarRating';
import ReviewCard from '@/components/product/ReviewCard';
import ReviewForm from '@/components/product/ReviewForm';
import { useAuthStore } from '@/store/authStore';
import { useReviewStore } from '@/store/reviewStore';
import { MessageSquarePlus, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ReviewSectionProps {
  productId: string;
  productName: string;
  averageRating?: number;
  reviewCount?: number;
}

export default function ReviewSection({
  productId,
  productName,
  averageRating: initialRating = 0,
  reviewCount: initialCount = 0,
}: ReviewSectionProps) {
  const { token } = useAuthStore();
  const { reviews, stats, loading, fetchReviews, deleteReview } = useReviewStore();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');

  useEffect(() => {
    if (productId) {
      fetchReviews(productId);
    }
  }, [productId, fetchReviews]);

  // Use stats from fetched reviews, or fallback to props
  const displayRating = stats?.averageRating || initialRating;
  const displayCount = stats?.totalReviews || initialCount;
  const ratingDistribution = stats?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  // Calculate percentages for distribution bars
  const getDistributionPercent = (starCount: number) => {
    if (displayCount === 0) return 0;
    const count = ratingDistribution[starCount as keyof typeof ratingDistribution] || 0;
    return Math.round((count / displayCount) * 100);
  };

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return b.rating - a.rating;
  });

  const handleDeleteReview = async (reviewId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this review?');
    if (confirmed) {
      await deleteReview(reviewId);
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-semibold text-gray-900">
          Customer Reviews
        </h2>
        {token && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            <MessageSquarePlus size={18} />
            Write a Review
          </button>
        )}
      </div>

      {/* Rating Summary */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-8">
          {/* Average Rating */}
          <div className="text-center md:pr-8 md:border-r border-amber-200">
            <div className="text-6xl font-bold text-gray-900 mb-2">
              {Number(displayRating).toFixed(1)}
            </div>
            <div className="flex justify-center mb-3">
              <StarRating rating={displayRating} size={24} />
            </div>
            <div className="text-sm text-gray-600">
              Based on {displayCount} {displayCount === 1 ? 'review' : 'reviews'}
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="flex-1 space-y-3">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Rating Distribution</h4>
            {[5, 4, 3, 2, 1].map((stars) => {
              const percent = getDistributionPercent(stars);
              const count = ratingDistribution[stars as keyof typeof ratingDistribution] || 0;
              return (
                <div key={stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium text-gray-700">{stars}</span>
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          productId={productId}
          productName={productName}
          onSuccess={handleReviewSuccess}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Write Review CTA (for non-logged in users) */}
      {!token && !showReviewForm && (
        <ReviewForm productId={productId} productName={productName} />
      )}

      {/* Reviews List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            All Reviews ({displayCount})
          </h3>
          {reviews.length > 0 && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="recent">Most Recent</option>
              <option value="rating">Highest Rated</option>
            </select>
          )}
        </div>

        {loading ? (
          // Loading skeleton
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-24" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          // Empty state
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
            <MessageSquarePlus className="mx-auto mb-4 text-gray-300" size={48} />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              No Reviews Yet
            </h4>
            <p className="text-gray-600 mb-6">
              Be the first to share your experience with {productName}
            </p>
            {token ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
              >
                <MessageSquarePlus size={18} />
                Write the First Review
              </button>
            ) : (
              <a
                href="/auth/login"
                className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
              >
                Log In to Write a Review
              </a>
            )}
          </div>
        ) : (
          // Reviews list
          <div className="space-y-4">
            {sortedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onDelete={handleDeleteReview}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
