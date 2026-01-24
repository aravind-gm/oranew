'use client';

import StarRating from '@/components/common/StarRating';
import { useAuthStore } from '@/store/authStore';
import { useReviewStore } from '@/store/reviewStore';
import { MessageSquarePlus, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface ReviewFormProps {
  productId: string;
  productName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  productId,
  productName,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const { token } = useAuthStore();
  const { createReview, submitting, error, clearError } = useReviewStore();

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    // Validation
    if (rating === 0) {
      setValidationError('Please select a rating');
      return;
    }
    if (!title.trim()) {
      setValidationError('Please enter a review title');
      return;
    }
    if (!reviewText.trim()) {
      setValidationError('Please write your review');
      return;
    }
    if (reviewText.trim().length < 10) {
      setValidationError('Review must be at least 10 characters');
      return;
    }

    const success = await createReview({
      productId,
      rating,
      title: title.trim(),
      reviewText: reviewText.trim(),
    });

    if (success) {
      setRating(0);
      setTitle('');
      setReviewText('');
      onSuccess?.();
    }
  };

  // Not logged in
  if (!token) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
        <MessageSquarePlus className="mx-auto mb-4 text-gray-400" size={40} />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Share Your Experience
        </h3>
        <p className="text-gray-600 mb-6">
          Please log in to write a review for {productName}
        </p>
        <Link
          href={`/auth/login?redirect=/products/${productId}`}
          className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
        >
          Log In to Review
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Write a Review</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <StarRating
              rating={rating}
              size={32}
              interactive
              onChange={setRating}
            />
            <span className="text-sm text-gray-500">
              {rating === 0 && 'Select your rating'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </span>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            maxLength={100}
          />
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this product. What did you like or dislike?"
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {reviewText.length}/1000 characters
          </p>
        </div>

        {/* Errors */}
        {(validationError || error) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {validationError || error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Review'
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center">
          By submitting, you agree to our review guidelines. Reviews are moderated before publishing.
        </p>
      </form>
    </div>
  );
}
