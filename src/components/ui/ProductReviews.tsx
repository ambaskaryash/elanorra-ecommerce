'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  StarIcon,
  HandThumbUpIcon,
  CheckBadgeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { useReviewsStore } from '@/lib/store/reviews-store';
import { useAuth } from '@/lib/contexts/auth-context';
import { toast } from 'react-hot-toast';

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');
  
  const { 
    getProductReviews, 
    getProductRating, 
    addReview, 
    markHelpful, 
    isLoading 
  } = useReviewsStore();
  const { user, isAuthenticated } = useAuth();

  const reviews = getProductReviews(productId);
  const { averageRating, totalReviews } = getProductRating(productId);

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'helpful':
        return b.helpful - a.helpful;
      default:
        return 0;
    }
  });

  // Filter reviews
  const filteredReviews = sortedReviews.filter(review => {
    if (filterBy === 'all') return true;
    if (filterBy === 'verified') return review.verified;
    return review.rating === parseInt(filterBy);
  });

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to write a review');
      return;
    }
    setShowWriteReview(true);
  };

  const renderStars = (rating: number, size = 'h-5 w-5') => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <StarSolid
            key={i}
            className={`${size} ${
              i < Math.floor(rating) 
                ? 'text-yellow-400' 
                : i < rating 
                  ? 'text-yellow-400 opacity-50' 
                  : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(review => review.rating === rating).length / reviews.length) * 100 : 0
  }));

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {totalReviews > 0 ? averageRating.toFixed(1) : '0.0'}
            </div>
            <div className="flex justify-center mb-2">
              {renderStars(averageRating)}
            </div>
            <div className="text-sm text-gray-600">
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Rating breakdown</h4>
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center text-sm">
                  <span className="w-8">{rating}</span>
                  <StarSolid className="h-4 w-4 text-yellow-400 mx-1" />
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-8 text-right text-gray-600">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
              <option value="helpful">Most helpful</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="filter" className="text-sm font-medium text-gray-700">
              Filter:
            </label>
            <select
              id="filter"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="all">All reviews</option>
              <option value="verified">Verified only</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleWriteReview}
          className="flex items-center space-x-2 px-4 py-2 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors"
        >
          <PencilIcon className="h-4 w-4" />
          <span>Write Review</span>
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {filteredReviews.length > 0 ? (
            <motion.div
              key="reviews"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {filteredReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {review.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{review.userName}</span>
                              {review.verified && (
                                <CheckBadgeIcon className="h-4 w-4 text-green-500" title="Verified purchase" />
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        {renderStars(review.rating, 'h-4 w-4')}
                        <span className="text-sm text-gray-600">({review.rating}/5)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        markHelpful(review.id);
                        toast.success('Thank you for your feedback!');
                      }}
                      className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <HandThumbUpIcon className="h-4 w-4" />
                      <span>Helpful ({review.helpful})</span>
                    </button>
                    
                    {review.verified && (
                      <span className="text-xs text-green-600 font-medium">
                        ✓ Verified Purchase
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="no-reviews"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 bg-gray-50 rounded-lg"
            >
              <div className="text-gray-500 mb-2">
                {filterBy === 'all' 
                  ? 'No reviews yet'
                  : 'No reviews match your filters'
                }
              </div>
              {filterBy !== 'all' && (
                <button
                  onClick={() => setFilterBy('all')}
                  className="text-rose-600 hover:text-rose-700 text-sm font-medium"
                >
                  View all reviews
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={showWriteReview}
        onClose={() => setShowWriteReview(false)}
        productId={productId}
        productName={productName}
        user={user}
      />
    </div>
  );
}

// Write Review Modal Component
interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  user: any;
}

function WriteReviewModal({ isOpen, onClose, productId, productName, user }: WriteReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addReview } = useReviewsStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rating) {
      toast.error('Please select a rating');
      return;
    }
    
    if (!title.trim() || !comment.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    const reviewData = {
      productId,
      userId: user?.id || 'guest',
      userName: `${user?.firstName} ${user?.lastName}` || 'Anonymous',
      userEmail: user?.email || 'guest@example.com',
      rating,
      title: title.trim(),
      comment: comment.trim(),
      verified: false, // In real app, check if user purchased the product
    };

    const result = await addReview(reviewData);
    
    if (result.success) {
      toast.success('Review submitted successfully!');
      setRating(0);
      setTitle('');
      setComment('');
      onClose();
    } else {
      toast.error(result.error || 'Failed to submit review');
    }
    
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Write a Review</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">{productName}</h4>
          <p className="text-sm text-gray-600">Share your experience with this product</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <StarSolid
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Review Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              maxLength={100}
            />
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience with this product"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:bg-gray-400 transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}