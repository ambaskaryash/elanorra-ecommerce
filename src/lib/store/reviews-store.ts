import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

interface ReviewsState {
  reviews: Review[];
  isLoading: boolean;
  addReview: (reviewData: Omit<Review, 'id' | 'helpful' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  getProductReviews: (productId: string) => Review[];
  getProductRating: (productId: string) => { averageRating: number; totalReviews: number };
  markHelpful: (reviewId: string) => void;
  deleteReview: (reviewId: string) => void;
}

// Mock existing reviews
const mockReviews: Review[] = [
  {
    id: '1',
    productId: '1',
    userId: '1',
    userName: 'Sarah Johnson',
    userEmail: 'sarah@example.com',
    rating: 5,
    title: 'Beautiful and high quality!',
    comment: 'Absolutely love these ceramic bowls. The craftsmanship is exceptional and they look stunning in my kitchen. The glazing is perfect and they feel substantial without being too heavy.',
    verified: true,
    helpful: 8,
    createdAt: '2024-09-15T10:30:00Z',
    updatedAt: '2024-09-15T10:30:00Z',
  },
  {
    id: '2',
    productId: '1',
    userId: '2',
    userName: 'Michael Chen',
    userEmail: 'michael@example.com',
    rating: 4,
    title: 'Great product, fast shipping',
    comment: 'Really happy with this purchase. The bowls are well-made and arrived quickly. Only minor complaint is they\'re a bit smaller than I expected from the photos, but still very nice quality.',
    verified: true,
    helpful: 5,
    createdAt: '2024-09-20T14:15:00Z',
    updatedAt: '2024-09-20T14:15:00Z',
  },
  {
    id: '3',
    productId: '2',
    userId: '3',
    userName: 'Emily Rodriguez',
    userEmail: 'emily@example.com',
    rating: 5,
    title: 'Perfect for my morning coffee ritual',
    comment: 'This ceramic mug is exactly what I was looking for. The size is perfect, it keeps my coffee warm, and the design is minimalist yet elegant. Highly recommend!',
    verified: true,
    helpful: 12,
    createdAt: '2024-09-25T08:45:00Z',
    updatedAt: '2024-09-25T08:45:00Z',
  },
  {
    id: '4',
    productId: '2',
    userId: '4',
    userName: 'David Kim',
    userEmail: 'david@example.com',
    rating: 4,
    title: 'Good quality, nice weight',
    comment: 'Solid ceramic mug with a nice weight to it. The finish is smooth and it\'s comfortable to hold. Would buy again.',
    verified: false,
    helpful: 3,
    createdAt: '2024-10-01T16:20:00Z',
    updatedAt: '2024-10-01T16:20:00Z',
  },
];

export const useReviewsStore = create<ReviewsState>()(
  persist(
    (set, get) => ({
      reviews: mockReviews,
      isLoading: false,

      addReview: async (reviewData) => {
        set({ isLoading: true });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const newReview: Review = {
            ...reviewData,
            id: Date.now().toString(),
            helpful: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({
            reviews: [newReview, ...state.reviews],
            isLoading: false,
          }));

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Failed to add review' };
        }
      },

      getProductReviews: (productId: string) => {
        return get().reviews
          .filter(review => review.productId === productId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getProductRating: (productId: string) => {
        const productReviews = get().reviews.filter(review => review.productId === productId);
        
        if (productReviews.length === 0) {
          return { averageRating: 0, totalReviews: 0 };
        }

        const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / productReviews.length;

        return {
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          totalReviews: productReviews.length,
        };
      },

      markHelpful: (reviewId: string) => {
        set((state) => ({
          reviews: state.reviews.map(review =>
            review.id === reviewId
              ? { ...review, helpful: review.helpful + 1 }
              : review
          ),
        }));
      },

      deleteReview: (reviewId: string) => {
        set((state) => ({
          reviews: state.reviews.filter(review => review.id !== reviewId),
        }));
      },
    }),
    {
      name: 'app-reviews-storage',
    }
  )
);