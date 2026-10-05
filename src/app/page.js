"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaArrowRight,
  FaTag,
  FaShieldAlt,
  FaTruck,
  FaHeadset,
  FaRobot,
  FaChevronLeft,
  FaChevronRight,
  FaBox,
  FaStar,
  FaBolt,
  FaGem,
  FaHeart,
} from "react-icons/fa";
import { productService, recommendationService, statsService } from "@/services";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/common";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [platformStats, setPlatformStats] = useState({
    totalSellers: 0,
    totalProducts: 0,
    satisfactionRate: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Combine categories with grocery
  const allCategories = [...categories.map((cat) => ({ ...cat }))];
  const [slidesToShow, setSlidesToShow] = useState(1);

  // Responsive slides calculation
  useEffect(() => {
    const updateSlides = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 640) {
          setSlidesToShow(1);
        } else if (window.innerWidth < 1024) {
          setSlidesToShow(2);
        } else {
          setSlidesToShow(3);
        }
      }
    };
    updateSlides();
    window.addEventListener('resize', updateSlides);
    return () => window.removeEventListener('resize', updateSlides);
  }, []);
  const maxSlide = Math.max(0, allCategories.length - slidesToShow);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev >= maxSlide ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev <= 0 ? maxSlide : prev - 1));
  };

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      if (allCategories.length > slidesToShow) {
        nextSlide();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [currentSlide, allCategories.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData, recommendationsData, statsData] =
          await Promise.all([
            productService.getProducts({ limit: 8 }),
            productService.getCategories(),
            isAuthenticated && user
              ? recommendationService.getRecommendations({
                  userId: user.id,
                  limit: 4,
                })
              : Promise.resolve({ recommendations: [] }),
            statsService.getStats(),
          ]);
        setProducts(productsData.products || []);
        setCategories(categoriesData || []);
        setRecommendedProducts(recommendationsData.recommendations || []);
        setPlatformStats(statsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

   const features = [
     {
       icon: <FaBolt className="text-4xl text-yellow-500" />,
       title: "Lightning Fast",
       description:
         "AI-powered instant price matching and smart deals delivered in seconds",
       bgColor: "from-yellow-50 to-orange-50",
     },
     {
       icon: <FaRobot className="text-4xl text-blue-500" />,
       title: "AI Smart Bargaining",
       description:
         "Intelligent negotiation engine that gets you the best prices automatically",
       bgColor: "from-blue-50 to-indigo-50",
     },
     {
       icon: <FaShieldAlt className="text-4xl text-green-500" />,
       title: "Buyer Protection",
       description:
         "Advanced fraud detection and secure escrow payments for worry-free shopping",
       bgColor: "from-green-50 to-emerald-50",
     },
     {
       icon: <FaTruck className="text-4xl text-purple-500" />,
       title: "Smart Delivery",
       description:
         "AI-predicted delivery times with real-time tracking and route optimization",
       bgColor: "from-purple-50 to-pink-50",
     },
   ];

   // Dynamic stats from API
   const dynamicStats = [
     {
       value: platformStats.totalSellers > 0
         ? platformStats.totalSellers >= 1000
           ? `${(platformStats.totalSellers / 1000).toFixed(0)}K+`
           : platformStats.totalSellers.toString()
         : "10K+",
       label: "Active Sellers",
       icon: <FaBox className="text-3xl text-blue-500" />,
     },
     {
       value: platformStats.totalProducts > 0
         ? platformStats.totalProducts >= 1000
           ? `${(platformStats.totalProducts / 1000).toFixed(0)}K+`
           : platformStats.totalProducts.toString()
         : "1M+",
       label: "Products Listed",
       icon: <FaGem className="text-3xl text-purple-500" />,
     },
     {
       value: platformStats.satisfactionRate > 0
         ? `${platformStats.satisfactionRate}%`
         : "98%",
       label: "Satisfaction Rate",
       icon: <FaStar className="text-3xl text-amber-500" />,
     },
     {
       value: "24/7",
       label: "Customer Support",
       icon: <FaHeadset className="text-3xl text-green-500" />,
     },
   ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden flex items-center min-h-[50vh]">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-64 h-64 sm:w-80 sm:h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -top-20 -right-40 w-64 h-64 sm:w-80 sm:h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-40 left-1/3 w-64 h-64 sm:w-80 sm:h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik01MCAwIEw1MCAxMDAgTTAgNTAgTDEwMCA1MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIvPgo8L3N2Zz4K')] opacity-20"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
              <FaBolt className="text-yellow-400 text-sm" />
              <span className="text-xs font-medium text-white">
                AI-Powered Smart Shopping Platform
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Shop Smarter with{" "}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Intelligence
              </span>
            </h1>

            <p className="text-base md:text-lg text-blue-100 mb-6 leading-relaxed max-w-3xl mx-auto">
              Experience the future of e-commerce with intelligent price
              negotiation, personalized recommendations, and seamless shopping
              powered by cutting-edge AI technology.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/products">
                <Button
                  size="md"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-6 py-2.5 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                >
                  <FaBox className="text-lg" />
                  Start Shopping
                  <FaArrowRight className="ml-1.5" />
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="md"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-6 py-2.5 text-base font-semibold rounded-xl backdrop-blur-sm transition-all duration-300"
                >
                  Create Account
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-blue-200">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <FaShieldAlt className="text-green-400 text-sm sm:text-base" />
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <FaTruck className="text-blue-400 text-sm sm:text-base" />
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <FaHeadset className="text-purple-400 text-sm sm:text-base" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </section>

      {/* Stats Bar */}
      <section className="relative -mt-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {dynamicStats.map((stat, index) => (
              <div
                key={index}
                className="text-center group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-lg mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-500 text-xs sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Why Choose AI Shop?
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Our platform combines the best of traditional e-commerce with
              cutting-edge AI technology to deliver an unmatched shopping
              experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.bgColor} rounded-2xl -z-10 transform group-hover:scale-105 transition-transform duration-300`}
                ></div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 sm:p-8 h-full border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Carousel Section */}
      {allCategories.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Browse by Category
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Discover products across our carefully curated categories
              </p>
            </div>

            <div className="relative">
              {/* Carousel Container */}
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{
                    transform: `translateX(-${currentSlide * (100 / slidesToShow)}%)`,
                  }}
                >
                  {allCategories.map((category) => (
                     <Link
                       key={category.id}
                       href={
                         category.id === "grocery"
                           ? "/grocery"
                           : `/products?categoryId=${category.id}`
                       }
                       className="flex-shrink-0 px-4"
                       style={{ width: `${100 / slidesToShow}%` }}
                     >
                      <div className="group cursor-pointer">
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-gray-100 to-gray-200">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-6xl">🛍️</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg text-center group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-gray-500 text-sm text-center mt-1">
                          Explore products
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              {allCategories.length > slidesToShow && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 sm:p-3 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"
                    aria-label="Previous slide"
                  >
                    <FaChevronLeft className="text-gray-700 w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 sm:p-3 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"
                    aria-label="Next slide"
                  >
                    <FaChevronRight className="text-gray-700 w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </>
              )}

              {/* Dots Indicator */}
              {allCategories.length > slidesToShow && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: maxSlide + 1 }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        currentSlide === index
                          ? "bg-blue-600 w-8"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                Featured Products
              </h2>
              <p className="text-gray-600">
                Handpicked selections just for you
              </p>
            </div>
            <Link
              href="/products"
              className="hidden sm:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold group"
            >
              View All
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl h-80 border border-gray-100 animate-pulse"
                ></div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaBox className="text-4xl text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                No products available yet
              </h3>
              <p className="text-gray-500 mb-6">
                Be the first to list products on our platform
              </p>
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
              >
                Start selling today!
                <FaArrowRight />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Recommended Products Section */}
      {isAuthenticated && recommendedProducts.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                  Recommended for You
                </h2>
                <p className="text-gray-600">
                  AI-personalized picks based on your browsing history
                </p>
              </div>
              <Link
                href="/products"
                className="hidden sm:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold group"
              >
                View All
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProducts.map((rec) => (
                <div key={rec.id} className="relative group">
                  <Link href={`/products/${rec.recommendedTo?.id}`}>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                      {/* Image */}
                      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                        {rec.recommendedTo?.images?.[0] ? (
                          <img
                            src={rec.recommendedTo.images[0]}
                            alt={rec.recommendedTo.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaBox className="text-6xl text-gray-300" />
                          </div>
                        )}
                        {/* Score Badge */}
                        <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                          {Math.round(rec.score * 100)}% match
                        </div>
                      </div>
                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {rec.recommendedTo?.name || "Unknown Product"}
                        </h3>
                        <p className="text-lg font-bold text-gray-900 mb-2">
                          Tk.{rec.recommendedTo?.price?.toFixed(2) || "N/A"}
                        </p>
                        {rec.reason && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-auto">
                            {rec.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-10 lg:py-16 relative overflow-hidden flex items-center min-h-[50vh]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-sm rounded-3xl mb-4">
            <FaBox className="text-2xl text-white" />
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to Transform Your Shopping Experience?
          </h2>

          <p className="text-base md:text-lg text-blue-100 mb-6 max-w-2xl mx-auto leading-relaxed">
            Join millions of smart shoppers who are already saving money with
            AI-powered price negotiation and personalized recommendations.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/products">
              <Button
                size="md"
                className="text-blue-600 hover:bg-blue-50 px-5 py-2 text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <FaBox className="text-base" />
                Start Shopping Now
              </Button>
            </Link>
            <Link href="/register?role=seller">
              <Button
                size="md"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-5 py-2 text-sm font-semibold rounded-xl backdrop-blur-sm transition-all duration-300 flex items-center gap-2"
              >
                <FaGem className="text-amber-400" />
                Become a Seller
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-blue-200 text-sm">
            Free to join • No upfront costs • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}