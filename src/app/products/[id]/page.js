"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { productService, recommendationService } from "@/services";
import { Card, Button, Input } from "@/components/common";
import {
  FaStar,
  FaShoppingCart,
  FaHeart,
  FaShare,
  FaBox,
  FaTag,
  FaArrowLeft,
  FaPlus,
  FaMinus,
  FaTag as FaNegotiable,
} from "react-icons/fa";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { addToCart, addToWishlist } = useCart();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [offerPrice, setOfferPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        const productData = await productService.getProduct(params.id);
        // Normalize tags to an array (handle string or null from DB)
        if (productData) {
          productData.tags = Array.isArray(productData.tags)
            ? productData.tags
            : typeof productData.tags === "string"
              ? productData.tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
              : [];
        }
        setProduct(productData);

        // Fetch reviews with error handling
        if (productData?.id) {
          try {
            const reviewsData = await productService.getProductReviews(
              productData.id,
              1,
              10,
            );
            setReviews(reviewsData.reviews || []);
          } catch (reviewError) {
            console.warn("Failed to fetch reviews:", reviewError.message);
            // Don't fail the whole page - reviews are optional
            setReviews([]);
          }
        }

        // Fetch related recommendations
        if (productData?.id && isAuthenticated) {
          try {
            const recData = await recommendationService.getRecommendations({
              productId: productData.id,
              limit: 4,
            });
            setRecommendedProducts(recData.recommendations || []);
          } catch (recError) {
            console.warn("Failed to fetch recommendations:", recError.message);
            setRecommendedProducts([]);
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id, isAuthenticated]);

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addToCart(product.id, quantity);
      alert("Added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add to cart");
    }
  };

  const handleAddToWishlist = async () => {
    if (!product) return;

    try {
      await addToWishlist(product.id);
      alert("Added to wishlist!");
    } catch (error) {
      console.error("Error adding to wishlist:", error);
    }
  };

  const handleMakeOffer = async () => {
    if (!offerPrice || isNaN(offerPrice)) {
      alert("Please enter a valid offer price");
      return;
    }

    if (parseFloat(offerPrice) >= product.price) {
      alert("Offer price must be less than the current price");
      return;
    }

    setSubmitting(true);
    try {
      const { offerService } = await import("@/services");
      await offerService.createOffer({
        productId: product.id,
        initialOffer: parseFloat(offerPrice),
        message: "I would like to make an offer",
      });
      alert("Offer submitted successfully!");
      setOfferPrice("");
      router.push("/offers");
    } catch (error) {
      console.error("Error making offer:", error);
      alert("Failed to submit offer");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FaStar
        key={i}
        className={`text-sm ${i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"}`}
        fill={i < Math.floor(rating) ? "#fbbf24" : "#d1d5db"}
      />
    ));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Product not found</p>
          <Link href="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/products"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <FaArrowLeft className="mr-2" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-h-[60vh]">
          {/* Product Images */}
          <div className="space-y-3">
            <div className="aspect-[4/3] bg-white rounded-xl overflow-hidden shadow-sm">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FaBox className="text-5xl text-gray-300" />
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                      selectedImage === i
                        ? "border-blue-600"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {product.category?.name}
                </span>
                {product.isNegotiable && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center gap-1">
                    <FaNegotiable />
                    Negotiable
                  </span>
                )}
                {product.tags &&
                  product.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1">
                  {renderStars(product.rating || 0)}
                </div>
                <span className="text-gray-500 text-sm">
                  ({reviews.length} reviews)
                </span>
                <span className="text-gray-500 text-sm">|</span>
                <span className="text-gray-500 text-sm">
                  {product.stock} in stock
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {product.price?.toFixed(2)} Tk.
                </span>
                {product.originalPrice &&
                  product.originalPrice > product.price && (
                    <>
                      <span className="text-lg text-gray-500 line-through">
                        {product.originalPrice?.toFixed(2)} Tk.
                      </span>
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded">
                        {Math.round(
                          (1 - product.price / product.originalPrice) * 100,
                        )}
                        % OFF
                      </span>
                    </>
                  )}
              </div>

              {product.isNegotiable && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-2">Make an Offer</p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Your offer price"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleMakeOffer}
                      loading={submitting}
                      disabled={!offerPrice}
                    >
                      Submit Offer
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    AI will suggest if your offer is likely to be accepted
                  </p>
                </div>
              )}
            </div>

            {/* Quantity & Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-gray-50"
                >
                  <FaMinus />
                </button>
                <span className="px-3 py-2 font-medium text-sm">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                  className="px-3 py-2 hover:bg-gray-50"
                >
                  <FaPlus />
                </button>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <FaShoppingCart />
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>

              <Button
                variant="outline"
                onClick={handleAddToWishlist}
                className="flex items-center justify-center gap-2"
              >
                <FaHeart />
                Wishlist
              </Button>
            </div>

            {/* Product Details */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                Product Details
              </h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">SKU</dt>
                  <dd className="font-medium">{product.sku || "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Brand</dt>
                  <dd className="font-medium">{product.brand || "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Category</dt>
                  <dd className="font-medium">{product.category?.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Condition</dt>
                  <dd className="font-medium">{product.condition || "New"}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("description")}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === "description"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === "reviews"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Reviews ({reviews.length})
            </button>
            <button
              onClick={() => setActiveTab("shipping")}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === "shipping"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Shipping
            </button>
          </div>

          <div className="py-8">
            {activeTab === "description" && (
              <div className="prose max-w-none">
                <p className="text-gray-600 whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                {/* Add Review Form */}
                {!hasReviewed && isAuthenticated && (
                  <Card className="p-6">
                    <h4 className="font-medium text-gray-900 mb-4">
                      Write a Review
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rating
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="focus:outline-none"
                            >
                              <FaStar
                                className={`text-2xl ${
                                  star <= reviewRating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                                fill={
                                  star <= reviewRating ? "#fbbf24" : "#d1d5db"
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title (optional)
                        </label>
                        <Input
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          placeholder="Summary of your review"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Review
                        </label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Share your experience with this product"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={4}
                        />
                      </div>
                      <Button
                        onClick={async () => {
                          if (!reviewComment.trim()) {
                            alert("Please write a review");
                            return;
                          }
                          setSubmittingReview(true);
                          try {
                            await productService.addReview({
                              productId: product.id,
                              rating: reviewRating,
                              title: reviewTitle,
                              content: reviewComment,
                            });
                            alert("Review submitted successfully!");
                            setHasReviewed(true);
                            setReviewComment("");
                            setReviewTitle("");
                            setReviewRating(5);
                            // Refresh reviews
                            const reviewsData =
                              await productService.getProductReviews(
                                product.id,
                                1,
                                10,
                              );
                            setReviews(reviewsData.reviews || []);
                          } catch (error) {
                            console.error("Error submitting review:", error);
                            alert(
                              error.data?.error ||
                                error.message ||
                                "Failed to submit review",
                            );
                          } finally {
                            setSubmittingReview(false);
                          }
                        }}
                        loading={submittingReview}
                        disabled={!reviewComment.trim()}
                      >
                        Submit Review
                      </Button>
                    </div>
                  </Card>
                )}

                {hasReviewed && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
                    Thank you for your review!
                  </div>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <p className="text-gray-500">No reviews yet</p>
                ) : (
                  reviews.map((review) => (
                    <Card key={review.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {review.user?.name?.charAt(0) || "U"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {review.user?.name || "Anonymous"}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                          <br />
                          {review?.aiAnalysis?.fakeDetection?.isFake
                            ? "Fake"
                            : "Not Fake"}
                        </span>
                      </div>
                      <p className="mt-4 text-gray-600">{review.title}</p>
                      <p className="mt-2 text-gray-600">{review.content}</p>
                      {review.aiAnalysis && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">AI Analysis:</span>{" "}
                            Sentiment:{" "}
                            <span className="font-medium">
                              {review.aiAnalysis.sentiment || "N/A"}
                            </span>
                            {review.aiAnalysis.confidence != null && (
                              <span>
                                {" "}
                                (
                                {(review.aiAnalysis.confidence * 100).toFixed(
                                  0,
                                )}
                                % confidence)
                              </span>
                            )}
                            {review.aiAnalysis.fakeDetection && (
                              <span>
                                {" "}
                                · Fake:{" "}
                                {(
                                  review.aiAnalysis.fakeDetection.fakeScore *
                                  100
                                ).toFixed(0)}
                                %
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-4">
                <Card className="p-6">
                  <h4 className="font-medium text-gray-900 mb-4">
                    Shipping Options
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <p className="font-medium">Standard Shipping</p>
                        <p className="text-sm text-gray-500">
                          5-7 business days
                        </p>
                      </div>
                      <span className="font-medium">5.00 Tk.</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <p className="font-medium">Express Shipping</p>
                        <p className="text-sm text-gray-500">
                          2-3 business days
                        </p>
                      </div>
                      <span className="font-medium">15.00 Tk.</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-medium">Overnight Shipping</p>
                        <p className="text-sm text-gray-500">
                          Next business day
                        </p>
                      </div>
                      <span className="font-medium">30.00 Tk.</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Recommended Products Section */}
        {recommendedProducts.length > 0 && (
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                You May Also Like
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProducts.map((rec) => (
                <div key={rec.id} className="relative group">
                  <Link href={`/products/${rec.recommendedTo?.id}`}>
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
                      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                        {rec.recommendedTo?.images?.[0] ? (
                          <img
                            src={rec.recommendedTo.images[0]}
                            alt={rec.recommendedTo.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaBox className="text-4xl text-gray-300" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                          {Math.round(rec.score * 100)}% match
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600">
                          {rec.recommendedTo?.name || "Unknown Product"}
                        </h3>
                        <p className="text-lg font-bold text-gray-900">
                          Tk.{rec.recommendedTo?.price?.toFixed(2) || "N/A"}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
