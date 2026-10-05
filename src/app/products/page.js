'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaFilter, FaSortAmountDown } from 'react-icons/fa';
import { productService } from '@/services';
import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/common';

function ProductsPageInner() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('categoryId');
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    categoryId: categoryId || '',
    minPrice: '',
    maxPrice: '',
    isNegotiable: '',
    sortBy: 'createdAt',
    page: 1,
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

   useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filters.categoryId) {
          const categoryIds = getSelectedCategoryIds();
          if (categoryIds.length > 1) {
            params.categoryIds = categoryIds.join(",");
          } else {
            params.categoryId = filters.categoryId;
          }
        }
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.isNegotiable) params.isNegotiable = filters.isNegotiable;
        params.sortBy = filters.sortBy;
        params.page = filters.page;
        params.limit = 12;

        const data = await productService.getProducts(params);
        setProducts(data.products || []);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filters, categories]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'page' ? {} : { page: 1 }),
    }));
  };

  const clearFilters = () => {
    setFilters({
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      isNegotiable: '',
      sortBy: 'createdAt',
      page: 1,
    });
  };

  const getSelectedCategoryIds = () => {
    if (!filters.categoryId) return [];
    const parentCategory = categories.find(cat => cat.id === filters.categoryId);
    if (parentCategory && parentCategory.children && parentCategory.children.length > 0) {
      return [parentCategory.id, ...parentCategory.children.map(child => child.id)];
    }
    return [filters.categoryId];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8">
          {/* Mobile Filter Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => document.getElementById('mobile-filters')?.classList.toggle('hidden')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FaFilter className="text-blue-600" />
              Show Filters
            </button>
          </div>

          {/* Filters Sidebar */}
          <aside id="mobile-filters" className="w-full md:w-64 lg:w-72 flex-shrink-0 hidden md:block">
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm md:sticky md:top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <FaFilter className="text-blue-600" />
                <h2 className="font-semibold text-gray-900 text-lg">Filters</h2>
              </div>

              {/* Category Filter */}
              <div className="mb-5 sm:mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="space-y-1.5 max-h-60 sm:max-h-72 overflow-y-auto border border-gray-200 rounded-lg p-2.5">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded touch-manipulation">
                    <input
                      type="radio"
                      name="categoryId"
                      value=""
                      checked={filters.categoryId === ''}
                      onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                      className="border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-900">All Categories</span>
                  </label>
                  {categories.map((cat) => {
                    const hasChildren = cat.children && cat.children.length > 0;
                    return (
                      <div key={cat.id}>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded touch-manipulation">
                          <input
                            type="radio"
                            name="categoryId"
                            value={cat.id}
                            checked={filters.categoryId === cat.id}
                            onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                            className="border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                          <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                        </label>
                        
                        {hasChildren && (
                          <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-3">
                            {cat.children.map((child) => (
                              <label key={child.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded touch-manipulation">
                                <input
                                  type="radio"
                                  name="categoryId"
                                  value={child.id}
                                  checked={filters.categoryId === child.id}
                                  onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                                  className="border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                />
                                <span className="text-sm text-gray-700">{child.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Filter */}
              <div className="mb-5 sm:mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm touch-manipulation"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm touch-manipulation"
                  />
                </div>
              </div>

              {/* Negotiable Filter */}
              <div className="mb-5 sm:mb-6">
                <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
                  <input
                    type="checkbox"
                    checked={filters.isNegotiable === 'true'}
                    onChange={(e) => handleFilterChange('isNegotiable', e.target.checked ? 'true' : '')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Negotiable Only</span>
                </label>
              </div>

              <Button variant="outline" onClick={clearFilters} className="w-full py-2.5">
                Clear Filters
              </Button>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {/* Sort and Results */}
            <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-3 mb-4 sm:mb-6">
              <p className="text-gray-600 text-sm sm:text-base order-2 xs:order-1">
                {pagination?.total || 0} products found
              </p>
              <div className="flex items-center gap-2 justify-end xs:justify-start order-1 xs:order-2">
                <FaSortAmountDown className="text-gray-400 flex-shrink-0" />
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white touch-manipulation min-w-0 truncate"
                >
                  <option value="createdAt">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

             {/* Products */}
             {loading ? (
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                 {[...Array(6)].map((_, i) => (
                   <div key={i} className="bg-white rounded-xl h-72 sm:h-80 animate-pulse"></div>
                 ))}
               </div>
             ) : products.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                 {products.map((product) => (
                   <ProductCard key={product.id} product={product} />
                 ))}
               </div>
             ) : (
              <div className="text-center py-12 bg-white rounded-xl">
                <p className="text-gray-500">No products found matching your criteria.</p>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col xs:flex-row justify-center items-center gap-3 sm:gap-2 mt-6 sm:mt-8">
                <Button
                  variant="outline"
                  disabled={filters.page === 1}
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  className="w-full xs:w-auto px-5 py-2.5"
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-gray-600 order-2 xs:order-1 text-sm sm:text-base">
                  Page {filters.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={filters.page >= pagination.totalPages}
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  className="w-full xs:w-auto px-5 py-2.5"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// useSearchParams must be rendered inside a Suspense boundary for the page to
// be prerenderable at build time (required for `next build` to succeed).
export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ProductsPageInner />
    </Suspense>
  );
}
