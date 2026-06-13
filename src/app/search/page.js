"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { productService } from "@/services";
import ProductCard from "@/components/product/ProductCard";
import { Card, Button, Input } from "@/components/common";
import {
  FaSearch,
  FaMicrophone,
  FaFilter,
  FaHistory,
  FaTimes,
  FaSearchPlus,
  FaMagic,
} from "react-icons/fa";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "relevance",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiPowered, setAiPowered] = useState(false);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Debounced suggestion fetching
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await productService.getSearchSuggestions(query);
        setSuggestions(data.slice(0, 8));
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [query]);

  const saveRecentSearch = (searchQuery) => {
    if (!searchQuery.trim()) return;

    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    saveRecentSearch(searchQuery);

    try {
      const params = {
        q: searchQuery,
        ...filters,
      };

      if (filters.category) params.categoryId = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      params.sortBy = filters.sortBy;

      const data = await productService.searchProducts(params);
      setSearchResults(data.products || []);
      setAiPowered(data.aiPowered || false);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setSuggestions([]);
    handleSearch(suggestion);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuggestions([]);
    router.push(`/search?q=${encodeURIComponent(query)}`);
    handleSearch();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const handleVoiceSearch = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Voice search is not supported in your browser");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleSearch(transcript);
      router.push(`/search?q=${encodeURIComponent(transcript)}`);
    };

    recognition.start();
  };

  const handleAISearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setAiPowered(true);
    saveRecentSearch(query);

    try {
      // AI-powered semantic search
      const { api } = await import("@/services");
      const response = await api.get("/api/search", {
        params: {
          q: query,
          ai: true,
          ...filters,
        },
      });
      setSearchResults(response.products || []);
    } catch (error) {
      console.error("AI search error:", error);
      handleSearch();
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span
        key={i}
        className={i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Search Products
          </h1>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="pl-10 pr-4 py-3 text-lg"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <FaSearch className="text-gray-400 text-xs" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="px-6">
                Search
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleVoiceSearch}
                className="px-4"
                title="Voice search"
              >
                <FaMicrophone
                  className={isListening ? "text-red-500 animate-pulse" : ""}
                />
              </Button>

              <Button
                type="button"
                variant={aiPowered ? "primary" : "outline"}
                onClick={handleAISearch}
                className="px-4 flex items-center gap-2"
                title="AI-powered search"
              >
                <FaMagic />
                AI Search
              </Button>
            </div>
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <FaFilter />
              Filters
            </button>

            {query && (
              <span className="text-sm text-gray-500">
                {searchResults.length} results for "{query}"
                {aiPowered && (
                  <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                    AI Powered
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="p-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      setFilters({ ...filters, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Categories</option>
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="home">Home & Garden</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Price
                  </label>
                  <Input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) =>
                      setFilters({ ...filters, minPrice: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price
                  </label>
                  <Input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      setFilters({ ...filters, maxPrice: e.target.value })
                    }
                    placeholder="Any"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters({ ...filters, sortBy: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button onClick={() => handleSearch()}>Apply Filters</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      category: "",
                      minPrice: "",
                      maxPrice: "",
                      sortBy: "relevance",
                    });
                  }}
                >
                  Clear
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Search Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl h-80 animate-pulse"
              ></div>
            ))}
          </div>
        ) : query ? (
          searchResults.length > 0 ? (
            <>
              {aiPowered && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
                  <FaMagic className="text-purple-600" />
                  <span className="text-purple-800 text-sm">
                    AI-powered semantic search results
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <Card className="p-12 text-center">
              <FaSearchPlus className="text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No results found
              </h3>
              <p className="text-gray-500 mb-6">
                Try different keywords or filters
              </p>
              <Button onClick={() => handleAISearch()}>
                <FaMagic className="mr-2" />
                Try AI Search
              </Button>
            </Card>
          )
        ) : (
          <div className="space-y-8">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FaHistory />
                    Recent Searches
                  </h2>
                  <button
                    onClick={clearRecentSearches}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQuery(search);
                        handleSearch(search);
                      }}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Tips */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Search Tips
              </h2>
              <ul className="space-y-2 text-gray-600">
                <li>• Use specific keywords for better results</li>
                <li>• Try voice search for hands-free searching</li>
                <li>• Use AI Search for semantic understanding</li>
                <li>• Combine filters to narrow down results</li>
              </ul>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
