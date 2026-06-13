import { api } from "./api";

export const productService = {
  // Get all products with filters
  async getProducts(params = {}) {
    const data = await api.get("/api/products", {
      params: { ...params, productType: params.productType },
    });
    return data;
  },

  // Get single product
  async getProduct(id) {
    const data = await api.get(`/api/products/${id}`);
    return data;
  },

  // Create new product (seller only)
  async createProduct(data) {
    const result = await api.post("/api/products", data);
    return result;
  },

  // Update product
  async updateProduct(id, data) {
    const result = await api.put(`/api/products/${id}`, data);
    return result;
  },

  // Delete product
  async deleteProduct(id) {
    const result = await api.delete(`/api/products/${id}`);
    return result;
  },

  // Get categories
  async getCategories(includeProducts = false) {
    const data = await api.get("/api/categories", {
      params: { includeProducts },
    });
    return data;
  },

  // Search products
  async searchProducts(params = {}) {
    const data = await api.get("/api/search", { params });
    return data;
  },

  // Get AI search suggestions
  async getSearchSuggestions(query) {
    const data = await api.get("/api/search", {
      params: { q: query, suggestions: true },
    });
    return data.suggestions;
  },

  // Get product reviews
  async getProductReviews(productId, page = 1, limit = 10) {
    const data = await api.get("/api/reviews", {
      params: { productId, page, limit },
    });
    return data;
  },

  // Add product review
  async addReview(data) {
    const result = await api.post("/api/reviews", data);
    return result;
  },
};

export default productService;
