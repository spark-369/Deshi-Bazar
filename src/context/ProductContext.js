'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { productService } from '@/services';

const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [currentProduct, setCurrentProduct] = useState(null);

  const fetchProducts = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const data = await productService.getProducts(params);
      setProducts(data.products);
      setPagination(data.pagination);
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data);
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }, []);

  const fetchProduct = useCallback(async (id) => {
    try {
      setLoading(true);
      const data = await productService.getProduct(id);
      setCurrentProduct(data);
      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const data = await productService.searchProducts(params);
      setProducts(data.products);
      setPagination(data.pagination);
      return data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSuggestions = useCallback(async (query) => {
    try {
      return await productService.getSearchSuggestions(query);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }, []);

  const createProduct = async (data) => {
    try {
      setLoading(true);
      const result = await productService.createProduct(data);
      return result;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id, data) => {
    try {
      setLoading(true);
      const result = await productService.updateProduct(id, data);
      return result;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    try {
      setLoading(true);
      await productService.deleteProduct(id);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    products,
    categories,
    loading,
    pagination,
    currentProduct,
    fetchProducts,
    fetchCategories,
    fetchProduct,
    searchProducts,
    getSuggestions,
    createProduct,
    updateProduct,
    deleteProduct,
    setProducts,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}

export default ProductContext;
