/**
 * Authentication API Service
 * Handles customer authentication, registration, and session management
 */
const getLanguage = () => {
  if (typeof window !== 'undefined') {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length > 0 && ['en', 'ka', 'ru', 'hi', 'ar', 'he'].includes(parts[0])) {
      return parts[0];
    }
    return window.localStorage.getItem('ff_language') || 'en';
  }
  return 'en';
};

class AuthApiService {
  constructor() {
    this.sessionToken = this.getStoredToken();
  }

  get baseURL() {
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const envUrl = typeof process !== 'undefined' ? process.env?.REACT_APP_API_BASE_URL : undefined;
    const base =
      envUrl && (isLocal || !envUrl.includes('localhost'))
        ? envUrl
        : isLocal
          ? 'http://localhost:5000'
          : 'https://funfinder.ge';
    return `${base}/${getLanguage()}/api/v3`;
  }

  /**
   * Get customer token from localStorage or cookies
   */
  getStoredToken() {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('ff_token') ||
      localStorage.getItem('customer_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('customer_session_token') ||
      this.getSessionToken() ||
      null
    );
  }

  /**
   * Set and persist tokens
   */
  setToken(jwtToken, sessionToken) {
    const primaryToken = jwtToken || sessionToken;
    this.sessionToken = primaryToken;

    if (typeof window !== 'undefined') {
      if (jwtToken) {
        localStorage.setItem('ff_token', jwtToken);
        localStorage.setItem('customer_token', jwtToken);
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('adminToken', jwtToken);
        document.cookie = `adminToken=${jwtToken}; path=/; max-age=2592000; SameSite=Lax`;
      }
      if (sessionToken) {
        localStorage.setItem('customer_session_token', sessionToken);
        localStorage.setItem('admin_session_token', sessionToken);
        document.cookie = `customer_session_token=${sessionToken}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `admin_session_token=${sessionToken}; path=/; max-age=2592000; SameSite=Lax`;
      } else if (jwtToken) {
        document.cookie = `customer_session_token=${jwtToken}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `admin_session_token=${jwtToken}; path=/; max-age=2592000; SameSite=Lax`;
      }
    }
  }

  /**
   * Clear all persisted tokens
   */
  clearToken() {
    this.sessionToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ff_token');
      localStorage.removeItem('customer_token');
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminRoles');
      localStorage.removeItem('adminPermissions');
      localStorage.removeItem('admin_session_token');
      localStorage.removeItem('customer_session_token');
      localStorage.removeItem('ff_user');
      localStorage.removeItem('ff_logged_in');
      document.cookie = 'customer_session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'admin_session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }
  }

  /**
   * Make HTTP request using fetch API with automatic Auth header
   */
  async makeRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const token = this.getStoredToken();

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const requestOptions = {
      method: 'GET',
      credentials: 'include',
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    console.log(`Auth API Request: ${requestOptions.method} ${url}`);

    try {
      const response = await fetch(url, requestOptions);

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (response.status !== 401 && response.status !== 403) {
          console.error('FULL ERROR:', {
            status: response.status,
            response: data,
          });
        }

        throw new Error(
          data?.message ||
          data?.details ||
          data?.detail ||
          data?.error ||
          `HTTP ${response.status}`
        );
      }

      console.log(`Auth API Response: ${response.status} ${url}`);
      return data;

    } catch (error) {
      if (error.message && !error.message.includes('401') && !error.message.includes('403')) {
        console.error('Auth API Request Error:', error);
      }
      throw error;
    }
  }

  /**
   * Login customer
   */
  async login(credentials) {
    try {
      console.log('Attempting customer login:', credentials);
      const data = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      const jwtToken = data?.token || data?.access_token;
      const sessionToken = data?.customer_session_token;
      this.setToken(jwtToken, sessionToken);

      console.log('Login successful:', data);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new customer
   */
  async register(userData) {
    try {
      console.log('Attempting customer registration:', userData);
      const data = await this.makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      const jwtToken = data?.token || data?.access_token;
      const sessionToken = data?.customer_session_token;
      if (jwtToken || sessionToken) {
        this.setToken(jwtToken, sessionToken);
      }

      console.log('Registration successful:', data);
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Get customer profile
   */
  async getProfile() {
    try {
      console.log('Fetching customer profile...');
      const response = await this.makeRequest('/auth/profile');
      console.log('Profile fetched successfully:', response);
      return response;
    } catch (error) {
      if (error.message && !error.message.includes('401') && !error.message.includes('403')) {
        console.error('Profile fetch error:', error);
      } else {
        console.info('User is not logged in (Guest)');
      }
      throw error;
    }
  }

  /**
   * Update logged-in customer's profile
   */
  async updateProfile(data) {
    try {
      console.log('Updating customer profile:', data);
      const body = await this.makeRequest('/auth/profile/update', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      console.log('Profile updated:', body);
      return body;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  /**
   * Logout customer
   */
  async logout() {
    try {
      console.log('Attempting customer logout...');
      const response = await this.makeRequest('/auth/logout', {
        method: 'POST',
      });
      console.log('Logout successful:', response);
      return response;
    } catch (error) {
      console.error('Logout error:', error);
      return { success: true };
    } finally {
      this.clearToken();
    }
  }

  /**
   * Login with Google
   */
  async loginWithGoogle(googleResponse) {
    try {
      const token = googleResponse?.credential;
      if (!token) {
        throw new Error('Missing Google ID token (credential)');
      }

      console.log('Google ID Token:', token.substring(0, 50) + '...');
      const response = await this.makeRequest('/auth/google/login', {
        method: 'POST',
        body: JSON.stringify({
          token: token,
          email: googleResponse?.email,
          name: googleResponse?.name,
        }),
      });

      const jwtToken = response?.token || response?.access_token;
      const sessionToken = response?.customer_session_token;
      if (jwtToken || sessionToken) {
        this.setToken(jwtToken, sessionToken);
      }

      console.log('Google login successful:', response);
      return response;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  /**
   * Check if customer is authenticated
   */
  async isAuthenticated() {
    try {
      await this.getProfile();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get customer session token from cookies
   */
  getSessionToken() {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'customer_session_token') {
        return value;
      }
    }
    return null;
  }
}

// Create and export singleton instance
const authApiService = new AuthApiService();
export default authApiService;
