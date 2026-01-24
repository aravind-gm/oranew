'use client';

import StarRating from '@/components/common/StarRating';
import { useAuthStore } from '@/store/authStore';
import { BadgeCheck, ThumbsUp, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  reviewText: string;
  isVerifiedPurchase?: boolean;
  helpfulCount?: number;
  createdAt: string;
  user: {
    fullName: string;
  };
}

interface ReviewCardProps {
  review: Review;
  onDelete?: (reviewId: string) => void;
  onHelpful?: (reviewId: string) => void;
}

export default function ReviewCard({ review, onDelete, onHelpful }: ReviewCardProps) {
  const { user } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isOwner = user?.id === review.userId;
  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    await onDelete(review.id);
    setIsDeleting(false);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-white hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {getInitials(review.user.fullName)}
          </div>
          
          {/* User Info */}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{review.user.fullName}</p>
              {review.isVerifiedPurchase && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <BadgeCheck size={12} />
                  Verified Purchase
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{formattedDate}</p>
          </div>
        </div>

        {/* Rating & Actions */}
        <div className="flex items-center gap-3">
          <StarRating rating={review.rating} size={16} />
          {isOwner && onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Delete review"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Review Content */}
      <div className="mb-4">
        {review.title && (
          <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
        )}
        <p className="text-gray-700 leading-relaxed">{review.reviewText}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <button
          onClick={() => onHelpful?.(review.id)}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ThumbsUp size={14} />
          <span>Helpful ({review.helpfulCount || 0})</span>
        </button>
      </div>
    </div>
  );
}
