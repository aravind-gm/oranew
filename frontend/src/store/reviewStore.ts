'use client';

import api from '@/lib/api';
import { create } from 'zustand';

interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  reviewText: string;
  isApproved: boolean;
  isVerifiedPurchase?: boolean;
  helpfulCount?: number;
  createdAt: string;
  updatedAt: string;
  user: {
    fullName: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface ReviewStore {
  reviews: Review[];
  stats: ReviewStats | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  
  // Actions
  fetchReviews: (productId: string) => Promise<void>;
  createReview: (data: {
    productId: string;
    rating: number;
    title: string;
    reviewText: string;
  }) => Promise<boolean>;
  updateReview: (reviewId: string, data: {
    rating?: number;
    title?: string;
    reviewText?: string;
  }) => Promise<boolean>;
  deleteReview: (reviewId: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

// Calculate rating distribution from reviews
const calculateStats = (reviews: Review[]): ReviewStats => {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  reviews.forEach((review) => {
    const rating = Math.round(review.rating) as 1 | 2 | 3 | 4 | 5;
    if (rating >= 1 && rating <= 5) {
      distribution[rating]++;
    }
  });

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  return {
    averageRating,
    totalReviews,
    ratingDistribution: distribution,
  };
};

export const useReviewStore = create<ReviewStore>((set, get) => ({
  reviews: [],
  stats: null,
  loading: false,
  submitting: false,
  error: null,

  fetchReviews: async (productId: string) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/reviews/products/${productId}`);
      const reviews = response.data.data || [];
      const stats = calculateStats(reviews);
      set({ reviews, stats, loading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to fetch reviews',
        loading: false,
      });
    }
  },

  createReview: async (data) => {
    try {
      set({ submitting: true, error: null });
      await api.post('/reviews', data);
      
      // Refresh reviews after creating
      await get().fetchReviews(data.productId);
      set({ submitting: false });
      return true;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to submit review',
        submitting: false,
      });
      return false;
    }
  },

  updateReview: async (reviewId, data) => {
    try {
      set({ submitting: true, error: null });
      await api.put(`/reviews/${reviewId}`, data);
      
      // Update local state
      const reviews = get().reviews.map((review) =>
        review.id === reviewId ? { ...review, ...data } : review
      );
      const stats = calculateStats(reviews);
      set({ reviews, stats, submitting: false });
      return true;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to update review',
        submitting: false,
      });
      return false;
    }
  },

  deleteReview: async (reviewId) => {
    try {
      set({ submitting: true, error: null });
      await api.delete(`/reviews/${reviewId}`);
      
      // Remove from local state
      const reviews = get().reviews.filter((review) => review.id !== reviewId);
      const stats = calculateStats(reviews);
      set({ reviews, stats, submitting: false });
      return true;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to delete review',
        submitting: false,
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
  
  reset: () => set({
    reviews: [],
    stats: null,
    loading: false,
    submitting: false,
    error: null,
  }),
}));
