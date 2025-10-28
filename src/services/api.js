import axios from 'axios';

// Base API URL
const API_URL = 'http://localhost:5000/api'; // Change this to your production API URL

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      console.warn('⚠️ Rate limit exceeded, suppressing error message');
      // Don't show error to user, just log it
      return Promise.reject({
        ...error,
        silent: true, // Flag to indicate this error should be handled silently
        response: {
          ...error.response,
          data: {
            ...error.response.data,
            message: 'Please wait a moment before trying again'
          }
        }
      });
    }

    if (error.response?.status === 401) {
      // Check if this is a guest checkout request (don't redirect)
      const isGuestCheckout = error.config?.url?.includes('/guest') || 
                              error.config?.url?.includes('/orders/guest') ||
                              error.config?.url?.includes('guest/create-payment-intent');
      
      if (!isGuestCheckout) {
        // Only redirect to login for authenticated routes
        const currentPath = window.location.pathname;
        const publicPaths = ['/login', '/register', '/', '/checkout'];
        
        // Don't redirect if already on public page
        if (!publicPaths.includes(currentPath)) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateDetails: (data) => api.put('/auth/updatedetails', data),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (productData) => api.post('/products', productData),
  update: (id, productData) => api.put(`/products/${id}`, productData),
  delete: (id) => api.delete(`/products/${id}`),
  addReview: (id, reviewData) => api.post(`/products/${id}/reviews`, reviewData),
};

// Cart API
export const cartAPI = {
  getCart: () => api.get('/users/cart'),
  addToCart: (productId, quantity) => api.post('/users/cart', { productId, quantity }),
  updateCartItem: (productId, quantity) => api.put(`/users/cart/${productId}`, { quantity }),
  removeFromCart: (productId) => api.delete(`/users/cart/${productId}`),
  clearCart: () => api.delete('/users/cart'),
};

// Wishlist API
export const wishlistAPI = {
  getWishlist: () => api.get('/users/wishlist'),
  addToWishlist: (productId) => api.post(`/users/wishlist/${productId}`),
  removeFromWishlist: (productId) => api.delete(`/users/wishlist/${productId}`),
};

// Orders API (to be created in backend)
export const ordersAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getMyOrders: () => api.get('/orders/myorders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
};

export default api;