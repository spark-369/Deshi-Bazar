const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper to get token
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Helper methods
export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }
};

export const getAuthToken = () => getToken();

export const setUser = (user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const getUser = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const clearAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Build headers with auth
const getHeaders = (extraHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Handle fetch response
const handleResponse = async (res) => {
  const data = await res.json();
  
  if (!res.ok) {
    const error = new Error(data.error || 'Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  
  return data;
};

// Build query string from params object
const buildQueryString = (params) => {
  if (!params || typeof params !== 'object') return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value);
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

// Simple fetch-based API wrapper
export const api = {
  get: (url, config = {}) => {
    const queryString = buildQueryString(config.params);
    const finalUrl = queryString ? `${url}${queryString}` : url;
    return fetch(`${API_URL}${finalUrl}`, {
      method: 'GET',
      headers: getHeaders(config.headers),
      ...config,
    }).then(handleResponse);
  },
  
  post: (url, data, config = {}) => 
    fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: getHeaders(config.headers),
      body: JSON.stringify(data),
      ...config,
    }).then(handleResponse),
  
  put: (url, data, config = {}) => 
    fetch(`${API_URL}${url}`, {
      method: 'PUT',
      headers: getHeaders(config.headers),
      body: JSON.stringify(data),
      ...config,
    }).then(handleResponse),
  
  patch: (url, data, config = {}) => 
    fetch(`${API_URL}${url}`, {
      method: 'PATCH',
      headers: getHeaders(config.headers),
      body: JSON.stringify(data),
      ...config,
    }).then(handleResponse),
  
  delete: (url, config = {}) => 
    fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers: getHeaders(config.headers),
      ...config,
    }).then(handleResponse),
};

// For backward compatibility - empty export (deprecated)
const apiClient = {};
export default apiClient;
