"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { productService } from "@/services";
import { Card, Button, Input } from "@/components/common";
import {
  FaStar,
  FaThumbsUp,
  FaThumbsDown,
  FaFlag,
  FaFilter,
  FaBox,
  FaTrash,
  FaEdit,
  FaTimes,
} from "react-icons/fa";

export default function ReviewsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    productId: "",
    rating: "",
    sortBy: "newest",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({
    rating: 0,
    title: "",
    content: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

   useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (!user?.id) return;

        const params = { page: 1, limit: 50 };
        if (filter.productId) params.productId = filter.productId;
        if (filter.rating) params.rating = filter.rating;

        const reviewsData = await productService.getProductReviews(
          filter.productId || undefined,
          1,
          50,
        );
        setReviews(reviewsData.reviews || []);

        const productsData = await productService.getProducts({ limit: 100 });
        setProducts(productsData.products || []);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.id) {
      fetchData();
    }
  }, [isAuthenticated, user, filter]);

  const handleDelete = async (reviewId) => {
    if (!confirm("Delete this review?")) return;
    try {
      await productService.deleteReview(reviewId);
      setReviews(reviews.filter((r) => r.id !== reviewId));
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review");
    }
  };

  const canEditOrDelete = (review) => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    if (user.role === "SELLER") return false;
    return review.userId === user.id;
  };

  const handleEditClick = (review) => {
    setEditingReview(review);
    setEditForm({
      rating: review.rating,
      title: review.title || "",
      content: review.comment || "",
    });
  };

  const handleUpdate = async () => {
    if (!editingReview) return;
    setSaving(true);
    try {
      const updated = await productService.updateReview(editingReview.id, {
        rating: Number(editForm.rating),
        title: editForm.title,
        content: editForm.content,
      });
      setReviews(
        reviews.map((r) => (r.id === editingReview.id ? { ...r, ...updated } : r)),
      );
      setEditingReview(null);
    } catch (error) {
      console.error("Error updating review:", error);
      alert("Failed to update review");
    } finally {
      setSaving(false);
    }
  };

  const renderStars = (rating, size = "sm") => {
    const sizeClass = size === "lg" ? "text-lg" : "text-sm";
    return [...Array(5)].map((_, i) => (
      <FaStar
        key={i}
        className={`${sizeClass} ${i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"}`}
        fill={i < Math.floor(rating) ? "#fbbf24" : "#d1d5db"}
      />
    ));
  };

  const getSentimentBadge = (sentiment) => {
    const styles = {
      POSITIVE: "bg-green-100 text-green-800",
      NEUTRAL: "bg-gray-100 text-gray-800",
      NEGATIVE: "bg-red-100 text-red-800",
    };
    if (!sentiment) return null;
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${styles[sentiment] || styles.NEUTRAL}`}
      >
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

  const filteredReviews = filter.rating
    ? reviews.filter((r) => r.rating === parseInt(filter.rating))
    : reviews;

  const avgRating =
    filteredReviews.length > 0
      ? (
          filteredReviews.reduce((sum, r) => sum + r.rating, 0) /
          filteredReviews.length
        ).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              My Reviews
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              View and manage your product reviews
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <span className="font-medium text-gray-700 text-sm">
                Filters:
              </span>
            </div>

            <select
              value={filter.productId}
              onChange={(e) =>
                setFilter({ ...filter, productId: e.target.value })
              }
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white w-full sm:w-auto"
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
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white w-full sm:w-auto"
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
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white w-full sm:w-auto"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilter({ productId: "", rating: "", sortBy: "newest" })
              }
              className="w-full sm:w-auto"
            >
              Clear
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              {filteredReviews.length}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">Total Reviews</p>
          </Card>
          <Card className="p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-500">
              {avgRating}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">Average Rating</p>
          </Card>
          <Card className="p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
              {
                filteredReviews.filter(
                  (r) => r.aiAnalysis?.sentiment === "POSITIVE",
                ).length
              }
            </p>
            <p className="text-xs sm:text-sm text-gray-500">Positive</p>
          </Card>
          <Card className="p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">
              {filteredReviews.filter((r) => r.isFlagged).length}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">Flagged</p>
          </Card>
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <FaStar className="text-4xl sm:text-5xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              No reviews found
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {filter.productId || filter.rating
                ? "Try adjusting your filters"
                : "Purchase products to leave reviews"}
            </p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id} className="p-4 sm:p-5 lg:p-6">
                <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                  {/* Product Info */}
                  <div className="w-full md:w-48 flex-shrink-0">
                    <Link href={`/products/${review.productId}`}>
                      <div className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg -m-2 transition-colors">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {review.product?.images?.[0] ? (
                            <img
                              src={review.product.images[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FaBox className="text-gray-400 text-sm sm:text-base" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {review.product?.name || "Product"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {review.product?.category?.name}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {renderStars(review.rating, "lg")}
                          <span className="text-xs sm:text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {getSentimentBadge(review.aiAnalysis?.sentiment)}
                          {getFakeReviewBadge(review.isFlagged)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {canEditOrDelete(review) && (
                          <>
                            <button
                              onClick={() => handleEditClick(review)}
                              className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit review"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(review.id)}
                              className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete review"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {review.title && (
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        {review.title}
                      </h4>
                    )}

                    {review.comment && (
                      <p className="text-sm text-gray-700 mb-3">
                        {review.comment}
                      </p>
                    )}

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mb-3 overflow-x-auto">
                        {review.images.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                          />
                        ))}
                      </div>
                    )}

                    {/* AI Analysis */}
                    {review.aiAnalysis && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          AI Analysis:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          {review.aiAnalysis.sentiment && (
                            <div>
                              <span className="text-gray-500">Sentiment:</span>{" "}
                              <span className="font-medium">
                                {review.aiAnalysis.sentiment}
                              </span>
                            </div>
                          )}
                          {review.aiAnalysis.confidence != null && (
                            <div>
                              <span className="text-gray-500">Confidence:</span>{" "}
                              <span className="font-medium">
                                {(review.aiAnalysis.confidence * 100).toFixed(
                                  0,
                                )}
                                %
                              </span>
                            </div>
                          )}
                          {review.aiAnalysis.fakeDetection && (
                            <div>
                              <span className="text-gray-500">Fake Score:</span>{" "}
                              <span className="font-medium">
                                {(
                                  (review.aiAnalysis.fakeDetection?.fakeScore ||
                                    0) * 100
                                ).toFixed(0)}
                                %
                              </span>
                            </div>
                          )}
                        </div>
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
                    <div className="mt-3 flex items-center gap-4 text-xs sm:text-sm">
                      <span className="text-gray-500">
                        <FaThumbsUp className="inline mr-1" />
                        {review.helpfulCount || 0} helpful
                      </span>
                      {review.response && (
                        <span className="text-gray-500">Seller responded</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Review Modal */}
        {editingReview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Review
                </h3>
                <button
                  onClick={() => setEditingReview(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, rating: star })}
                        className="text-2xl transition-colors"
                      >
                        <FaStar
                          className={
                            star <= editForm.rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }
                          fill={
                            star <= editForm.rating ? "#fbbf24" : "#d1d5db"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Review title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comment
                  </label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) =>
                      setEditForm({ ...editForm, content: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Write your review..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingReview(null)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
