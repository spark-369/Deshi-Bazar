'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { productService } from '@/services';
import { Card, Button, Input } from '@/components/common';
import { FaStar, FaThumbsUp, FaThumbsDown, FaFlag, FaFilter, FaBox } from 'react-icons/fa';

export default function ReviewsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ productId: '', rating: '', sortBy: 'newest' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user's reviews
        const reviewsData = await productService.getProductReviews(
          filter.productId || undefined,
          1,
          50
        );
        setReviews(reviewsData.reviews || []);
        
        // Fetch products for filter dropdown
        const productsData = await productService.getProducts({ limit: 100 });
        setProducts(productsData.products || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, filter]);

  const handleReportReview = async (reviewId, reason) => {
    if (!confirm('Report this review as inappropriate?')) return;
    
    try {
      const { api } = await import('@/services');
      await api.put(`/api/reviews/${reviewId}`, { action: 'report', reason });
      alert('Review reported successfully');
    } catch (error) {
      console.error('Error reporting review:', error);
      alert('Failed to report review');
    }
  };

  const renderStars = (rating, size = 'sm') => {
    const sizeClass = size === 'lg' ? 'text-lg' : 'text-sm';
    return [...Array(5)].map((_, i) => (
      <FaStar
        key={i}
        className={`${sizeClass} ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
        fill={i < Math.floor(rating) ? '#fbbf24' : '#d1d5db'}
      />
    ));
  };

  const getRatingFilterLabel = (rating) => {
    if (!rating) return 'All Ratings';
    return `${rating} Star${rating > 1 ? 's' : ''}`;
  };

  const getSentimentBadge = (sentiment) => {
    const styles = {
      POSITIVE: 'bg-green-100 text-green-800',
      NEUTRAL: 'bg-gray-100 text-gray-800',
      NEGATIVE: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[sentiment] || styles.NEUTRAL}`}>
        {sentiment}
      </span>
    );
  };

  const getFakeReviewBadge = (isFlagged) => {
    if (!isFlagged) return null;
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1">
        <FaFlag />
        Flagged as Fake
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
          <p className="text-gray-600 mt-2">View and manage product reviews</p>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <span className="font-medium text-gray-700">Filters:</span>
            </div>
            
            <select
              value={filter.productId}
              onChange={(e) => setFilter({ ...filter, productId: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>

            <select
              value={filter.rating}
              onChange={(e) => setFilter({ ...filter, rating: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <select
              value={filter.sortBy}
              onChange={(e) => setFilter({ ...filter, sortBy: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter({ productId: '', rating: '', sortBy: 'newest' })}
            >
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Reviews Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{reviews.length}</p>
            <p className="text-sm text-gray-500">Total Reviews</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-500">
              {reviews.length > 0 
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                : 0}
            </p>
            <p className="text-sm text-gray-500">Average Rating</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {reviews.filter(r => r.aiAnalysis?.sentiment === 'POSITIVE').length}
            </p>
            <p className="text-sm text-gray-500">Positive</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">
              {reviews.filter(r => r.isFlagged).length}
            </p>
            <p className="text-sm text-gray-500">Flagged</p>
          </Card>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card className="p-12 text-center">
            <FaStar className="text-5xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-500 mb-6">
              {filter.productId || filter.rating 
                ? 'Try adjusting your filters'
                : 'Purchase products to leave reviews'
              }
            </p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Product Info */}
                  <div className="w-full md:w-48 flex-shrink-0">
                    <Link href={`/products/${review.productId}`}>
                      <div className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg -m-2 transition-colors">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {review.product?.image ? (
                            <img src={review.product.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FaBox className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {review.product?.name || 'Product'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {review.product?.category?.name}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Review Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {renderStars(review.rating, 'lg')}
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSentimentBadge(review.aiAnalysis?.sentiment)}
                          {getFakeReviewBadge(review.isFlagged)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReportReview(review.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Report review"
                        >
                          <FaFlag />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-3">{review.comment}</p>

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {review.images.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}

                    {/* AI Analysis */}
                    {review.aiAnalysis && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-700 mb-1">AI Analysis:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          {review.aiAnalysis.sentiment && (
                            <div>
                              <span className="text-gray-500">Sentiment:</span>{' '}
                              <span className="font-medium">{review.aiAnalysis.sentiment}</span>
                            </div>
                          )}
                          {review.aiAnalysis.confidence && (
                            <div>
                              <span className="text-gray-500">Confidence:</span>{' '}
                              <span className="font-medium">
                                {(review.aiAnalysis.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          )}
                          {review.aiAnalysis.keyPhrases && (
                            <div className="col-span-2">
                              <span className="text-gray-500">Key Points:</span>{' '}
                              <span className="font-medium">
                                {review.aiAnalysis.keyPhrases.slice(0, 3).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                        {review.aiAnalysis.summary && (
                          <p className="text-xs text-gray-600 mt-2 italic">
                            "{review.aiAnalysis.summary}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Verified Purchase */}
                    {review.isVerifiedPurchase && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                        <FaThumbsUp />
                        <span>Verified Purchase</span>
                      </div>
                    )}

                    {/* Helpful Votes */}
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="text-gray-500">
                        <FaThumbsUp className="inline mr-1" />
                        {review.helpfulCount || 0} helpful
                      </span>
                      {review.response && (
                        <span className="text-gray-500">
                          Seller responded
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
