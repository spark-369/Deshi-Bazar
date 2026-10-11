'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productService } from '@/services';
import { Card, Button } from '@/components/common';
import { FaArrowRight, FaBox, FaTimes, FaChevronRight, FaTags } from 'react-icons/fa';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productService.getCategories(true);
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const getCategoryIcon = (name) => {
    const icons = {
      electronics: '📱',
      clothing: '👕',
      books: '📚',
      home: '🏠',
      sports: '⚽',
      toys: '🧸',
      food: '🍕',
      beauty: '💄',
      automotive: '🚗',
      furniture: '🛋️',
      grocery: '🥦',
      vegetable: '🥕',
      fruit: '🍎',
      meat: '🥩',
      dairy: '🥛',
      bakery: '🥖',
    };
    const key = name.toLowerCase();
    return icons[key] || '🛍️';
  };

  const getCategoryGradient = (name) => {
    const gradients = {
      electronics: 'from-blue-600 to-purple-600',
      clothing: 'from-pink-500 to-rose-600',
      books: 'from-amber-500 to-orange-600',
      home: 'from-emerald-500 to-teal-600',
      sports: 'from-cyan-500 to-blue-600',
      toys: 'from-fuchsia-500 to-pink-600',
      food: 'from-orange-500 to-red-600',
      beauty: 'from-rose-500 to-pink-600',
      automotive: 'from-slate-600 to-blue-700',
      furniture: 'from-amber-600 to-orange-700',
      grocery: 'from-green-500 to-emerald-600',
      vegetable: 'from-green-400 to-lime-600',
      fruit: 'from-red-400 to-pink-600',
      meat: 'from-rose-600 to-red-700',
      dairy: 'from-blue-400 to-cyan-600',
      bakery: 'from-yellow-500 to-amber-600',
    };
    const key = name.toLowerCase();
    return gradients[key] || 'from-gray-500 to-gray-600';
  };

  const openSubcategoryModal = (category) => {
    setSelectedCategory(category);
    setShowSubcategoryModal(true);
  };

  const closeSubcategoryModal = () => {
    setSelectedCategory(null);
    setShowSubcategoryModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden flex items-center min-h-[32vh] sm:min-h-[36vh]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
        {/* Decorative Elements - hidden on small screens for performance */}
        <div className="pointer-events-none">
          <div className="hidden sm:block absolute top-0 left-0 w-64 h-64 lg:w-96 lg:h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl lg:blur-3xl opacity-15 animate-blob"></div>
          <div className="hidden sm:block absolute top-0 right-0 w-64 h-64 lg:w-96 lg:h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl lg:blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
          <div className="hidden sm:block absolute bottom-0 left-1/2 w-64 h-64 lg:w-96 lg:h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl lg:blur-3xl opacity-15 animate-blob animation-delay-4000"></div>
        </div>
        
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-md sm:rounded-lg shadow-sm mb-1 sm:mb-2">
              <FaBox className="text-base sm:text-lg lg:text-xl text-white" />
            </div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 tracking-tight px-2">
              Shop by{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Category
              </span>
            </h1>
            <p className="text-sm sm:text-base lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light px-4 sm:px-0">
              Discover our carefully curated collection of products. Browse through our categories and find exactly what you need.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="mt-2 sm:mt-3 lg:mt-4 grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-base sm:text-lg lg:text-xl font-bold text-blue-600">{categories.length}+</div>
              <div className="text-gray-500 mt-0.5 text-[10px] sm:text-xs">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-lg lg:text-xl font-bold text-purple-600">
                {categories.reduce((acc, cat) => acc + (cat.children?.length || 0), 0)}+
              </div>
              <div className="text-gray-500 mt-0.5 text-[10px] sm:text-xs">Sub-categories</div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-lg lg:text-xl font-bold text-green-600">
                {categories.reduce((acc, cat) => acc + (cat.products?.length || 0), 0)}+
              </div>
              <div className="text-gray-500 mt-0.5 text-[10px] sm:text-xs">Products</div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-lg lg:text-xl font-bold text-amber-600">24/7</div>
              <div className="text-gray-500 mt-0.5 text-[10px] sm:text-xs">Shopping</div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 sm:pt-2 lg:pt-2 pb-6 sm:pb-8 lg:pb-10">
        {categories.length === 0 ? (
            <div className="text-center py-12 sm:py-16 lg:py-20 px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaBox className="text-4xl sm:text-5xl text-gray-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">No categories available</h3>
            <p className="text-gray-500 text-sm sm:text-base">Check back later for new categories</p>
          </div>
        ) : (
          <>
            {/* Featured Categories */}
            <div className="mb-2 sm:mb-3">
              <div className="flex flex-col xs:flex-row xs:flex-wrap items-start xs:items-center justify-between mb-4 sm:mb-5 gap-3 xs:gap-4">
                <div className="order-1 xs:order-none">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    Explore Categories
                  </h2>
                  <p className="text-gray-500 mt-1 text-xs sm:text-sm">Click on any category to browse products</p>
                </div>
                <div className="hidden xs:flex items-center gap-2 text-sm text-gray-500 order-2 xs:order-none">
                  <FaTags className="text-blue-500" />
                  <span>{categories.length} categories available</span>
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                {categories.map((category) => {
                  const hasSubcategories = category.children && category.children.length > 0;
                  const gradient = getCategoryGradient(category.name);
                  
                  return (
                    <div key={category.id} className="group">
                      <div className="h-full flex flex-col">
                        {/* Category Card */}
                        <Link href={`/products?categoryId=${category.id}`}>
                          <Card className="h-full flex-1 flex flex-col justify-between hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 bg-white relative overflow-hidden group/card">
                            {/* Background Gradient */}
                            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
                            
                            {/* Icon Container */}
                            <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 bg-gradient-to-br ${gradient} shadow-md sm:shadow-lg transform group-hover/card:scale-105 sm:group-hover/card:scale-110 transition-transform duration-300`}>
                              <span className="text-2xl sm:text-3xl">{getCategoryIcon(category.name)}</span>
                            </div>

                            {/* Badge */}
                            <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                              <span className="px-2 py-0.5 sm:py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-700 rounded-full">
                                {category.products?.length || 0} items
                              </span>
                            </div>

                            {/* Content */}
                            <div className="mt-auto">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-1.5 group-hover/card:text-blue-600 transition-colors">
                                {category.name}
                              </h3>
                              {category.description && (
                                <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mb-1.5 sm:mb-2">
                                  {category.description}
                                </p>
                              )}
                              <p className="text-xs sm:text-sm font-medium text-blue-600 flex items-center gap-1 group-hover/card:gap-2 transition-all">
                                Browse products
                                <FaArrowRight className="w-3 h-3 transition-transform group-hover/card:translate-x-1" />
                              </p>
                            </div>
                          </Card>
                        </Link>

                        {/* Subcategory Button */}
                        {hasSubcategories && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-1.5 sm:mt-2 text-xs sm:text-sm"
                            onClick={() => openSubcategoryModal(category)}
                          >
                            <span className="text-gray-500 group-hover:text-blue-600 transition-colors">
                              View {category.children.length} sub-category{category.children.length > 1 ? 's' : ''}
                            </span>
                            <FaChevronRight className="w-3 h-3 ml-1 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Popular Categories Section */}
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    Popular Categories
                  </h2>
                  <p className="text-gray-500 mt-1 text-xs sm:text-sm">Most visited by our customers</p>
                </div>
                <div className="h-1 w-24 sm:w-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                {categories
                  .sort((a, b) => (b.products?.length || 0) - (a.products?.length || 0))
                  .slice(0, 6)
                  .map((category) => (
                    <Link 
                      key={category.id} 
                      href={`/products?categoryId=${category.id}`}
                      className="group"
                    >
                      <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white overflow-hidden relative">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-5">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 transform rotate-45"></div>
                        </div>
                        
                        <div className="relative p-5 sm:p-6">
                          <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-md sm:shadow-lg transform group-hover:scale-105 sm:group-hover:scale-110 transition-transform bg-gradient-to-br ${getCategoryGradient(category.name)}`}>
                              {getCategoryIcon(category.name)}
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 font-medium">Category</span>
                              <h3 className="text-base sm:text-lg font-bold text-gray-900">{category.name}</h3>
                            </div>
                          </div>
                          
                          {category.description && (
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 sm:mb-3">
                              {category.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="text-xs sm:text-sm font-semibold text-blue-600">
                                {category.products?.length || 0} products
                              </span>
                              {category.children?.length > 0 && (
                                <span className="text-xs text-gray-400">
                                  +{category.children.length} sub-categories
                                </span>
                              )}
                            </div>
                            <span className="inline-flex items-center text-blue-600 group-hover:text-purple-600 transition-colors font-medium text-xs sm:text-sm">
                              Explore
                              <FaArrowRight className="ml-1 w-3 h-3 sm:w-4 sm:h-4 transform group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
              </div>
            </div>

            {/* CTA Section */}
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl min-h-[40vh] flex items-center">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50"></div>
              <div className="hidden sm:block absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mix-blend-multiply filter blur-2xl lg:blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg mb-2 sm:mb-3">
                  <FaBox className="text-xl sm:text-2xl lg:text-3xl text-white" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2">
                  Can't find what you're looking for?
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                  Try searching for specific products or browse our featured collections to discover amazing deals.
                </p>
                <Link href="/products">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    Browse All Products
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Subcategory Modal */}
      {showSubcategoryModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${getCategoryGradient(selectedCategory.name)} flex-shrink-0`}>
                    {getCategoryIcon(selectedCategory.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                      {selectedCategory.name}
                    </h2>
                    <p className="text-gray-500 text-xs sm:text-sm">
                      {selectedCategory.children?.length || 0} sub-categories available
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeSubcategoryModal}
                  className="p-2 hover:bg-gray-200 rounded-xl transition-colors flex-shrink-0"
                  aria-label="Close modal"
                >
                  <FaTimes className="text-lg sm:text-xl text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] sm:max-h-[65vh]">
              {selectedCategory.description && (
                <p className="text-gray-600 mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded-xl text-sm sm:text-base">
                  {selectedCategory.description}
                </p>
              )}

              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
                {selectedCategory.children?.map((child) => (
                  <Link
                    key={child.id}
                    href={`/products?categoryId=${child.id}`}
                    onClick={closeSubcategoryModal}
                  >
                    <Card className="p-3 sm:p-4 hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 group/item">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-base sm:text-lg bg-gradient-to-br ${getCategoryGradient(child.name)} shadow-sm`}>
                          {getCategoryIcon(child.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base group-hover/item:text-blue-600 transition-colors truncate">
                            {child.name}
                          </h3>
                          {child.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {child.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">
                              {child.products?.length || 0} products
                            </span>
                          </div>
                        </div>
                        <FaChevronRight className="w-4 h-4 text-gray-400 group-hover/item:text-blue-500 transition-colors flex-shrink-0" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              {selectedCategory.children?.length === 0 && (
                <div className="text-center py-6 sm:py-8 px-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <FaBox className="text-lg sm:text-2xl text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm sm:text-base">No sub-categories available</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50">
              <Button
                variant="outline"
                onClick={closeSubcategoryModal}
                className="w-full text-sm sm:text-base"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}