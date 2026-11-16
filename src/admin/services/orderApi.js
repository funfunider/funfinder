import axios from 'axios';
import { getAdminCookie } from '../utils/cookies';

// Get auth token from localStorage with fallback to cookies
const getAuthToken = () => {
  const localToken = localStorage.getItem('adminToken');
  if (localToken) {
    return localToken;
  }
  return getAdminCookie('adminToken');
};

/**
 * Admin Order API Service
 * Handles order management for admin panel targeting MongoDB order endpoints
 */
class AdminOrderApiService {
  constructor() {
    this.baseURL = '/api/v2';
    
    // Create axios instance
    this.axios = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true,
      timeout: 30000,
    });

    // Add request interceptor for auth and logging
    this.axios.interceptors.request.use(
      (config) => {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get order feed (list of orders) from v2 event orders endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Order feed data
   */
  async getOrderFeed(params = {}) {
    const { eventId, ...queryParams } = params;
    const endpoints = [];

    if (eventId) {
      endpoints.push(
        `/event/${eventId}/orders`,
        `/event/orders/event/${eventId}`,
        `/event/orders/${eventId}`
      );
    }

    endpoints.push(
      '/event/orders',
      '/event/orders/',
      '/order/feed'
    );

    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying order feed endpoint: ${endpoint}`);
        const response = await this.axios.get(endpoint, { params: queryParams });
        console.log(`Successfully retrieved order feed from ${endpoint}:`, response.data);
        return response.data;
      } catch (error) {
        console.warn(`Order feed endpoint ${endpoint} failed (${error.response?.status || error.message})`);
        lastError = error;
      }
    }

    if (lastError?.response?.status === 403) {
      throw new Error('Access denied. Please check your authentication.');
    } else if (lastError?.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    }

    throw this.handleError(lastError || new Error('Failed to fetch orders from available endpoints'));
  }

  /**
   * Get order details by ID or order number
   * @param {number|string} orderId - Order ID or Order Number
   * @returns {Promise<Object>} Order details
   */
  async getOrderDetails(orderId) {
    const endpoints = [
      `/event/orders/number/${orderId}`,
      `/event/orders/${orderId}`,
      `/order/details/${orderId}`
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const response = await this.axios.get(endpoint);
        return response.data;
      } catch (error) {
        lastError = error;
      }
    }

    throw this.handleError(lastError || new Error('Failed to fetch order details'));
  }

  /**
   * Update order status
   * @param {number} orderId - Order ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Update response
   */
  async updateOrderStatus(orderId, status) {
    try {
      const response = await this.axios.patch(`/event/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cancel an order
   * @param {number} orderId - Order ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation response
   */
  async cancelOrder(orderId, reason = '') {
    try {
      const response = await this.axios.post(`/event/orders/${orderId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Mark an order ticket as used
   * @param {number|string} orderId - Order ID or Number
   * @returns {Promise<Object>} Updated order response
   */
  async markOrderAsUsed(orderId) {
    const endpoints = [
      `/event/orders/${orderId}/mark-used`,
      `/event/orders/number/${orderId}/mark-used`,
      `/order/${orderId}/mark-used`
    ];

    let lastError = null;
    for (const endpoint of endpoints) {
      try {
        const response = await this.axios.post(endpoint);
        return response.data;
      } catch (err) {
        lastError = err;
      }
    }

    throw this.handleError(lastError || new Error('Failed to mark order as used'));
  }

  /**
   * Export orders to CSV
   * @param {Object} params - Query parameters
   * @returns {Promise<Blob>} CSV file blob
   */
  async exportOrders(params = {}) {
    try {
      const response = await this.axios.get('/event/orders/export', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - Axios error
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || data?.error || `HTTP ${status} Error`;
      return new Error(`${message} (${status})`);
    } else if (error.request) {
      return new Error('Network error - please check your connection');
    } else {
      return new Error(error.message || 'Unknown error occurred');
    }
  }
}

const adminOrderApiService = new AdminOrderApiService();
export default adminOrderApiService;
