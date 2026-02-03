/**
 * useCategories - Fetch categories with 503 retry handling
 * Never crashes on Render cold start
 */

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

interface UseCategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  isWakingUp: boolean; // Shows "Waking up server..." message
}

export function useCategories() {
  const [state, setState] = useState<UseCategoriesState>({
    categories: [],
    loading: true,
    error: null,
    isWakingUp: false,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const { data } = await api.get<{ data: Category[] }>('/categories');

        if (isMounted) {
          setState({
            categories: data.data || [],
            loading: false,
            error: null,
            isWakingUp: false,
          });
        }
      } catch (err: any) {
        if (!isMounted) return;

        const status = err.response?.status;
        const message = err.response?.data?.message || err.message;

        // Handle 503 - show "waking up" message but don't treat as error
        if (status === 503) {
          console.warn('[Categories] Backend is waking up, waiting...');
          setState((prev) => ({
            ...prev,
            loading: false,
            error: null,
            isWakingUp: true,
          }));
          // Auto-retry after 3 seconds
          setTimeout(fetchCategories, 3000);
        } else {
          // Real error
          setState({
            categories: [],
            loading: false,
            error: message || 'Failed to load categories',
            isWakingUp: false,
          });
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
